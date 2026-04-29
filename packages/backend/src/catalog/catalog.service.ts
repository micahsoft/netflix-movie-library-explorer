import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Movie, CatalogStats, MovieFilter } from '@movie-explorer/types'
import { IngestionService } from '../ingestion/ingestion.service'
import { QuarantineLog } from '../ingestion/quarantine-log'
import { MovieRecord, toRecord, fromRecord } from './movie-record'

@Injectable()
export class CatalogService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogService.name)

  private store = new Map<string, MovieRecord>()
  private byRatingIds: string[] = []
  private byYear = new Map<number, string[]>()
  private genreCounts = new Map<string, number>()
  private ratingSum = 0
  private ratedCount = 0

  constructor(
    private readonly ingestion: IngestionService,
    private readonly quarantineLog: QuarantineLog,
  ) {}

  async onApplicationBootstrap() {
    const { movies } = await this.ingestion.ingest()
    this.populate(movies)
  }

  populate(movies: Movie[]) {
    this.store.clear()
    this.byRatingIds = []
    this.byYear.clear()
    this.genreCounts.clear()
    this.ratingSum = 0
    this.ratedCount = 0
    this.quarantineLog.clear()

    for (const movie of movies) {
      this.indexMovie(movie)
    }

    this.byRatingIds.sort(
      (a, b) => this.store.get(b)!.rating - this.store.get(a)!.rating,
    )

    this.logger.log(`Catalog ready — ${this.store.size} movies indexed`)
  }

  private indexMovieData(movie: Movie) {
    const record = toRecord(movie)
    this.store.set(movie.id, record)

    this.ratingSum += movie.rating
    this.ratedCount++

    for (const genre of record.genreSet) {
      this.genreCounts.set(genre, (this.genreCounts.get(genre) ?? 0) + 1)
    }

    if (movie.year != null) {
      const ids = this.byYear.get(movie.year) ?? []
      ids.push(movie.id)
      this.byYear.set(movie.year, ids)
    }
  }

  private indexMovie(movie: Movie) {
    this.indexMovieData(movie)
    this.byRatingIds.push(movie.id)
  }

  add(input: Omit<Movie, 'id' | 'source'>): Movie {
    const movie: Movie = {
      ...input,
      id: randomUUID(),
      source: 'manual',
    }

    this.indexMovieData(movie)

    // Insert into sorted array at the correct position — O(n) scan + O(n) splice
    const insertAt = this.byRatingIds.findIndex(
      (id) => this.store.get(id)!.rating < movie.rating,
    )
    if (insertAt === -1) {
      this.byRatingIds.push(movie.id)
    } else {
      this.byRatingIds.splice(insertAt, 0, movie.id)
    }

    return movie
  }

  getAll(): Movie[] {
    return [...this.store.values()].map(fromRecord)
  }

  getById(id: string): Movie | null {
    const record = this.store.get(id)
    return record ? fromRecord(record) : null
  }

  search(q: string): Movie[] {
    const query = q.toLowerCase().trim()
    if (!query) return this.getAll()
    return [...this.store.values()]
      .filter((r) => r.title.toLowerCase().includes(query))
      .map(fromRecord)
  }

  filter(f: MovieFilter): Movie[] {
    return [...this.store.values()]
      .filter((r) => {
        if (f.q && !r.title.toLowerCase().includes(f.q.toLowerCase())) return false
        if (f.genre && !r.genreSet.has(f.genre)) return false
        if (f.minRating != null && r.rating < f.minRating) return false
        if (f.year != null && r.year !== f.year) return false
        return true
      })
      .map(fromRecord)
  }

  getTopRated(limit = 10): Movie[] {
    return this.byRatingIds
      .slice(0, limit)
      .map((id) => fromRecord(this.store.get(id)!))
  }

  getStats(): CatalogStats {
    const topGenres = [...this.genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }))

    const byYear = [...this.byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, ids]) => ({
        year,
        count: ids.length,
        movies: ids.map((id) => fromRecord(this.store.get(id)!)),
      }))

    return {
      totalCount: this.store.size,
      averageRating: this.ratedCount > 0 ? this.ratingSum / this.ratedCount : 0,
      topGenres,
      byYear,
    }
  }

  async reload(): Promise<CatalogStats> {
    const { movies } = await this.ingestion.ingest()
    this.populate(movies)
    return this.getStats()
  }

  getQuarantineSummary() {
    return this.quarantineLog.getSummary()
  }
}
