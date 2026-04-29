import { normalize, FileContext, QuarantineReason } from './normalizer'
import { MovieSource } from '@movie-explorer/types'

const ctx: FileContext = { driveFileId: 'file-123', folderPath: ['Action', '2019'] }

describe('normalize', () => {
  describe('valid input', () => {
    it('normalizes a fully-specified movie', () => {
      const result = normalize(
        { title: 'Inception', rating: 8.8, genres: ['Sci-Fi'], year: 2010 },
        ctx,
      )
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.title).toBe('Inception')
      expect(result.movie.rating).toBe(8.8)
      expect(result.movie.genres).toEqual(['Sci-Fi'])
      expect(result.movie.year).toBe(2010)
      expect(result.movie.source).toBe(MovieSource.DRIVE)
    })

    it('resolves title from "name" alias', () => {
      const result = normalize({ name: 'The Matrix', rating: 8.7 }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.title).toBe('The Matrix')
    })

    it('resolves rating from "score" alias', () => {
      const result = normalize({ title: 'Heat', score: 8.2 }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.rating).toBe(8.2)
    })

    it('coerces string rating to number', () => {
      const result = normalize({ title: 'Heat', rating: '8.2' }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.rating).toBe(8.2)
    })

    it('splits comma-separated genres', () => {
      const result = normalize({ title: 'T', rating: 7, genres: 'Action, Drama' }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.genres).toEqual(['Action', 'Drama'])
    })

    it('deduplicates genres', () => {
      const result = normalize({ title: 'T', rating: 7, genres: ['Action', 'Action'] }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.genres).toEqual(['Action'])
    })

    it('extracts year from ISO date string', () => {
      const result = normalize({ title: 'T', rating: 7, release_date: '2019-03-15' }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.year).toBe(2019)
    })

    it('falls back to folder path for genre when absent', () => {
      const result = normalize({ title: 'T', rating: 7 }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.genres).toEqual(['Action'])
    })

    it('falls back to folder path for year when absent', () => {
      const result = normalize({ title: 'T', rating: 7 }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.year).toBe(2019)
    })

    it('uses driveFileId as id fallback', () => {
      const result = normalize({ title: 'T', rating: 7 }, ctx)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.movie.id).toBe('file-123')
    })
  })

  describe('quarantine cases', () => {
    it('quarantines on missing title', () => {
      const result = normalize({ rating: 8 }, ctx)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.reason).toBe(QuarantineReason.MISSING_TITLE)
    })

    it('quarantines on empty title', () => {
      const result = normalize({ title: '   ', rating: 8 }, ctx)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.reason).toBe(QuarantineReason.MISSING_TITLE)
    })

    it('quarantines on missing rating', () => {
      const result = normalize({ title: 'T' }, ctx)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.reason).toBe(QuarantineReason.MISSING_RATING)
    })

    it('quarantines on non-numeric rating string', () => {
      const result = normalize({ title: 'T', rating: 'great' }, ctx)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.reason).toBe(QuarantineReason.INVALID_RATING_TYPE)
    })

    it('quarantines on null input', () => {
      const result = normalize(null, ctx)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.reason).toBe(QuarantineReason.PARSE_ERROR)
    })

    it('quarantines on array input', () => {
      const result = normalize([{ title: 'T', rating: 7 }], ctx)
      expect(result.ok).toBe(false)
    })
  })
})
