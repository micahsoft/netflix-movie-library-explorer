import { CatalogService } from './catalog.service'
import { Movie } from '@movie-explorer/types'

// Minimal stubs — we test CatalogService logic in isolation
const mockIngestion = { ingest: jest.fn().mockResolvedValue({ movies: [], quarantinedCount: 0 }) }
const mockQuarantine = { getSummary: jest.fn().mockReturnValue({ total: 0, byReason: [] }), clear: jest.fn() }

function makeService(): CatalogService {
  return new CatalogService(mockIngestion as any, mockQuarantine as any)
}

function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 'test-id',
    title: 'Test Movie',
    rating: 7.5,
    genres: ['Drama'],
    year: 2020,
    description: null,
    source: 'drive',
    ...overrides,
  }
}

describe('CatalogService', () => {
  describe('populate', () => {
    it('sets totalCount', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1' }), movie({ id: '2' })])
      expect(svc.getStats().totalCount).toBe(2)
    })

    it('computes averageRating', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', rating: 8 }), movie({ id: '2', rating: 6 })])
      expect(svc.getStats().averageRating).toBe(7)
    })

    it('counts genres', () => {
      const svc = makeService()
      svc.populate([
        movie({ id: '1', genres: ['Action', 'Drama'] }),
        movie({ id: '2', genres: ['Action'] }),
      ])
      const stats = svc.getStats()
      const action = stats.topGenres.find((g) => g.genre === 'Action')
      expect(action?.count).toBe(2)
    })

    it('groups by year', () => {
      const svc = makeService()
      svc.populate([
        movie({ id: '1', year: 2020 }),
        movie({ id: '2', year: 2020 }),
        movie({ id: '3', year: 2021 }),
      ])
      const stats = svc.getStats()
      const y2020 = stats.byYear.find((y) => y.year === 2020)
      expect(y2020?.count).toBe(2)
    })

    it('sorts topRated descending', () => {
      const svc = makeService()
      svc.populate([
        movie({ id: '1', rating: 6 }),
        movie({ id: '3', rating: 9 }),
        movie({ id: '2', rating: 7 }),
      ])
      const top = svc.getTopRated(3)
      expect(top.map((m) => m.rating)).toEqual([9, 7, 6])
    })

    it('excludes movies with null year from byYear', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', year: null }), movie({ id: '2', year: 2020 })])
      const stats = svc.getStats()
      expect(stats.byYear).toHaveLength(1)
      expect(stats.byYear[0].year).toBe(2020)
    })
  })

  describe('add', () => {
    it('increments totalCount', () => {
      const svc = makeService()
      svc.populate([])
      svc.add({ title: 'New', rating: 8, genres: [], year: null, description: null })
      expect(svc.getStats().totalCount).toBe(1)
    })

    it('updates averageRating', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', rating: 6 })])
      svc.add({ title: 'New', rating: 8, genres: [], year: null, description: null })
      expect(svc.getStats().averageRating).toBe(7)
    })

    it('newly added movie appears in topRated', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', rating: 5 })])
      const added = svc.add({
        title: 'New Best',
        rating: 10,
        genres: [],
        year: null,
        description: null,
      })
      expect(svc.getTopRated(1)[0].id).toBe(added.id)
    })

    it('assigns manual source', () => {
      const svc = makeService()
      svc.populate([])
      const m = svc.add({ title: 'T', rating: 7, genres: [], year: null, description: null })
      expect(m.source).toBe('manual')
    })
  })

  describe('search', () => {
    it('finds by title substring (case-insensitive)', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', title: 'Inception' }), movie({ id: '2', title: 'Heat' })])
      expect(svc.search('incep')).toHaveLength(1)
      expect(svc.search('HEAT')).toHaveLength(1)
    })

    it('returns all when query is empty', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1' }), movie({ id: '2' })])
      expect(svc.search('')).toHaveLength(2)
    })
  })

  describe('reload', () => {
    it('replaces catalog with new movies', async () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', title: 'Old Movie' })])
      mockIngestion.ingest.mockResolvedValueOnce({
        movies: [movie({ id: '2', title: 'New Movie', rating: 9 })],
        quarantinedCount: 0,
      })
      await svc.reload()
      expect(svc.getStats().totalCount).toBe(1)
      expect(svc.search('New Movie')).toHaveLength(1)
      expect(svc.search('Old Movie')).toHaveLength(0)
    })

    it('returns updated stats after reload', async () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', rating: 5 })])
      mockIngestion.ingest.mockResolvedValueOnce({
        movies: [movie({ id: '2', rating: 9 }), movie({ id: '3', rating: 7 })],
        quarantinedCount: 0,
      })
      const stats = await svc.reload()
      expect(stats.totalCount).toBe(2)
      expect(stats.averageRating).toBe(8)
    })
  })

  describe('filter', () => {
    it('filters by genre', () => {
      const svc = makeService()
      svc.populate([
        movie({ id: '1', genres: ['Action'] }),
        movie({ id: '2', genres: ['Drama'] }),
      ])
      expect(svc.filter({ genre: 'Action' })).toHaveLength(1)
    })

    it('filters by minRating', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', rating: 5 }), movie({ id: '2', rating: 8 })])
      expect(svc.filter({ minRating: 7 })).toHaveLength(1)
    })

    it('filters by year', () => {
      const svc = makeService()
      svc.populate([movie({ id: '1', year: 2020 }), movie({ id: '2', year: 2021 })])
      expect(svc.filter({ year: 2020 })).toHaveLength(1)
    })

    it('applies multiple filters together', () => {
      const svc = makeService()
      svc.populate([
        movie({ id: '1', genres: ['Action'], rating: 8, year: 2020 }),
        movie({ id: '2', genres: ['Action'], rating: 5, year: 2020 }),
        movie({ id: '3', genres: ['Drama'], rating: 9, year: 2020 }),
      ])
      const results = svc.filter({ genre: 'Action', minRating: 7 })
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('1')
    })
  })
})
