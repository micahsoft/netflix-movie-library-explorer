import { Test } from '@nestjs/testing'
import { IngestionService } from './ingestion.service'
import { QuarantineLog } from './quarantine-log'
import { DriveClient, DriveFileRef } from '../auth/drive.client'

// ---------------------------------------------------------------------------
// Mock DriveClient
// ---------------------------------------------------------------------------

interface MockFile {
  ref: DriveFileRef
  content: unknown
  shouldThrow?: boolean
}

class MockDriveClient {
  private files: MockFile[] = []

  setFiles(files: MockFile[]) {
    this.files = files
  }

  async crawl(_rootFolderId: string): Promise<DriveFileRef[]> {
    return this.files.map((f) => f.ref)
  }

  async fetchContent(fileId: string): Promise<unknown> {
    const file = this.files.find((f) => f.ref.fileId === fileId)
    if (!file) throw new Error(`Unknown fileId: ${fileId}`)
    if (file.shouldThrow) throw new Error('Simulated fetch failure')
    return file.content
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ref(fileId: string, folderPath: string[] = []): DriveFileRef {
  return { fileId, folderPath }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IngestionService', () => {
  let svc: IngestionService
  let mockDrive: MockDriveClient
  let quarantineLog: QuarantineLog

  beforeEach(async () => {
    mockDrive = new MockDriveClient()

    const module = await Test.createTestingModule({
      providers: [
        IngestionService,
        QuarantineLog,
        { provide: DriveClient, useValue: mockDrive },
      ],
    }).compile()

    svc = module.get(IngestionService)
    quarantineLog = module.get(QuarantineLog)

    // Ensure DEMO_MODE is off for all tests
    delete process.env.DEMO_MODE
  })

  // ── Happy path ────────────────────────────────────────────────────────────

  it('indexes valid files', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { title: 'Inception', rating: 8.8, genres: ['Sci-Fi'], year: 2010 } },
      { ref: ref('f2'), content: { title: 'Parasite', rating: 8.5, genres: ['Drama'], year: 2019 } },
    ])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(2)
    expect(quarantinedCount).toBe(0)
    expect(movies.map((m) => m.title)).toEqual(expect.arrayContaining(['Inception', 'Parasite']))
  })

  it('sets source to "drive" on all ingested movies', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { title: 'The Matrix', rating: 8.7 } },
    ])

    const { movies } = await svc.ingest()

    expect(movies[0].source).toBe('drive')
  })

  it('returns empty result when crawl finds no files', async () => {
    mockDrive.setFiles([])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(0)
    expect(quarantinedCount).toBe(0)
  })

  // ── Quarantine — normalization failures ───────────────────────────────────

  it('quarantines files missing a title', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { rating: 7.0 } },
    ])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(0)
    expect(quarantinedCount).toBe(1)
    expect(quarantineLog.getSummary().byReason).toEqual([
      { reason: 'missing_title', count: 1 },
    ])
  })

  it('quarantines files with an invalid rating', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { title: 'Bad Movie', rating: 'not-a-number' } },
    ])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(0)
    expect(quarantinedCount).toBe(1)
    expect(quarantineLog.getSummary().byReason[0].reason).toBe('invalid_rating_type')
  })

  it('quarantines files with fetch errors and still indexes valid files', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { title: 'Good Movie', rating: 7.5 } },
      { ref: ref('f2'), content: null, shouldThrow: true },
    ])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(1)
    expect(movies[0].title).toBe('Good Movie')
    expect(quarantinedCount).toBe(1)
    expect(quarantineLog.getSummary().byReason[0].reason).toBe('fetch_error')
  })

  it('tracks multiple quarantine reasons independently', async () => {
    mockDrive.setFiles([
      { ref: ref('f1'), content: { rating: 7.0 } },                              // missing_title
      { ref: ref('f2'), content: { title: 'Film', rating: 'bad' } },              // invalid_rating_type
      { ref: ref('f3'), content: { title: 'Valid', rating: 8.0 } },               // ok
    ])

    const { movies, quarantinedCount } = await svc.ingest()

    expect(movies).toHaveLength(1)
    expect(quarantinedCount).toBe(2)

    const summary = quarantineLog.getSummary()
    expect(summary.total).toBe(2)
    const reasons = summary.byReason.map((r) => r.reason)
    expect(reasons).toContain('missing_title')
    expect(reasons).toContain('invalid_rating_type')
  })

  // ── Folder path fallbacks ─────────────────────────────────────────────────

  it('extracts genre from folder path when absent from JSON', async () => {
    mockDrive.setFiles([
      { ref: ref('f1', ['Action', '2020']), content: { title: 'Unknown Genre Film', rating: 7.0 } },
    ])

    const { movies } = await svc.ingest()

    expect(movies[0].genres).toEqual(['Action'])
  })

  it('extracts year from folder path when absent from JSON', async () => {
    mockDrive.setFiles([
      { ref: ref('f1', ['Drama', '1999']), content: { title: 'No Year Film', rating: 6.5 } },
    ])

    const { movies } = await svc.ingest()

    expect(movies[0].year).toBe(1999)
  })

  // ── DEMO_MODE ─────────────────────────────────────────────────────────────

  it('returns seed data in DEMO_MODE without calling Drive', async () => {
    process.env.DEMO_MODE = 'true'
    const crawlSpy = jest.spyOn(mockDrive, 'crawl')

    const { movies, quarantinedCount } = await svc.ingest()

    expect(crawlSpy).not.toHaveBeenCalled()
    expect(movies.length).toBeGreaterThan(0)
    expect(quarantinedCount).toBe(0)
  })
})