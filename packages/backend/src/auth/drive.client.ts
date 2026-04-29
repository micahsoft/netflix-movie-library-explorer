import { Injectable, Logger } from '@nestjs/common'
import { google } from 'googleapis'
import { GoogleAuthService } from './google-auth.service'

export interface DriveFileRef {
  fileId: string
  folderPath: string[]
}

@Injectable()
export class DriveClient {
  private readonly logger = new Logger(DriveClient.name)

  constructor(private readonly auth: GoogleAuthService) {}

  private get drive() {
    return google.drive({ version: 'v3', auth: this.auth.getClient() })
  }

  async crawl(rootFolderId: string): Promise<DriveFileRef[]> {
    this.logger.log(`Crawling Drive folder: ${rootFolderId}`)
    const results: DriveFileRef[] = []

    interface QueueItem { id: string; path: string[] }
    const queue: QueueItem[] = [{ id: rootFolderId, path: [] }]
    let folderCount = 0

    while (queue.length > 0) {
      const batch = queue.splice(0, 5)
      folderCount += batch.length

      const settled = await Promise.allSettled(
        batch.map(({ id, path }) => this.listFolder(id, path)),
      )

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(...result.value.files)
          queue.push(...result.value.subfolders)
        } else {
          this.logger.warn(`Failed to list folder: ${result.reason}`)
        }
      }
    }

    this.logger.log(
      `Crawl complete — ${results.length} JSON files across ${folderCount} folders`,
    )
    return results
  }

  private async listFolder(
    folderId: string,
    folderPath: string[],
  ): Promise<{
    files: DriveFileRef[]
    subfolders: Array<{ id: string; path: string[] }>
  }> {
    const files: DriveFileRef[] = []
    const subfolders: Array<{ id: string; path: string[] }> = []
    let pageToken: string | undefined

    do {
      const res = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType)',
        pageToken,
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        corpora: 'allDrives',
      })

      for (const file of res.data.files ?? []) {
        if (!file.id || !file.name) continue

        if (file.mimeType === 'application/vnd.google-apps.folder') {
          subfolders.push({ id: file.id, path: [...folderPath, file.name] })
        } else if (file.name.endsWith('.json')) {
          files.push({ fileId: file.id, folderPath })
        }
      }

      pageToken = res.data.nextPageToken ?? undefined
    } while (pageToken)

    return { files, subfolders }
  }

  async fetchContent(fileId: string): Promise<unknown> {
    const res = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'json' },
    )
    return res.data
  }
}
