import { Injectable, Logger } from '@nestjs/common'
import { Movie } from '@movie-explorer/types'
import { DriveClient } from '../auth/drive.client'
import { normalize, QuarantineReason } from './normalizer'
import { QuarantineLog } from './quarantine-log'
import { SEED_MOVIES } from './seed-data'

export interface IngestionResult {
  movies: Movie[]
  quarantinedCount: number
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name)

  constructor(
    private readonly drive: DriveClient,
    private readonly quarantineLog: QuarantineLog,
  ) {}

  async ingest(): Promise<IngestionResult> {
    if (process.env.DEMO_MODE === 'true') {
      this.logger.log('DEMO_MODE: serving seed data (no Drive credentials required)')
      return { movies: SEED_MOVIES, quarantinedCount: 0 }
    }

    const rootFolderId =
      process.env.DRIVE_ROOT_FOLDER_ID || '1Z-Bqt69UgrGkwo0ArjHaNrA7uUmUm2r6'

    const fileRefs = await this.drive.crawl(rootFolderId)
    this.logger.log(`Fetching ${fileRefs.length} files...`)

    // Fetch files in parallel batches of 10
    const movies: Movie[] = []
    let quarantinedCount = 0

    for (let i = 0; i < fileRefs.length; i += 10) {
      const batch = fileRefs.slice(i, i + 10)
      const settled = await Promise.allSettled(
        batch.map(async (ref) => {
          try {
            const raw = await this.drive.fetchContent(ref.fileId)
            return { raw, ref }
          } catch (err) {
            return { raw: null, ref, fetchError: true }
          }
        }),
      )

      for (const result of settled) {
        if (result.status === 'rejected') continue
        const { raw, ref, fetchError } = result.value as {
          raw: unknown
          ref: (typeof fileRefs)[0]
          fetchError?: boolean
        }

        if (fetchError || raw == null) {
          this.quarantineLog.add({
            driveFileId: ref.fileId,
            folderPath: ref.folderPath,
            reason: QuarantineReason.FETCH_ERROR,
            rawSnippet: '',
            timestamp: new Date(),
          })
          quarantinedCount++
          continue
        }

        const normalized = normalize(raw, {
          driveFileId: ref.fileId,
          folderPath: ref.folderPath,
        })

        if (normalized.ok) {
          movies.push(normalized.movie)
        } else {
          this.quarantineLog.add({
            driveFileId: ref.fileId,
            folderPath: ref.folderPath,
            reason: normalized.reason,
            rawSnippet: JSON.stringify(raw).slice(0, 200),
            timestamp: new Date(),
          })
          quarantinedCount++
        }
      }
    }

    const summary = this.quarantineLog.getSummary()
    this.logger.log(
      `Ingestion complete — ${movies.length} indexed / ${quarantinedCount} quarantined`,
    )
    if (quarantinedCount > 0) {
      const breakdown = summary.byReason.map((r) => `${r.reason}: ${r.count}`).join(', ')
      this.logger.warn(`Quarantine breakdown — ${breakdown}`)
    }

    return { movies, quarantinedCount }
  }
}
