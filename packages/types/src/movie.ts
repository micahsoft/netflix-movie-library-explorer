export interface Movie {
  id: string
  title: string
  rating: number
  genres: string[]
  year: number | null
  description: string | null
  source: 'drive' | 'manual'
}

export interface GenreCount {
  genre: string
  count: number
}

export interface YearGroup {
  year: number
  count: number
  movies: Movie[]
}

export interface CatalogStats {
  totalCount: number
  averageRating: number
  topGenres: GenreCount[]
  byYear: YearGroup[]
}

export interface MovieConnection {
  items: Movie[]
  total: number
}

export interface MovieFilter {
  q?: string
  genre?: string
  minRating?: number
  year?: number
}

export interface AddMovieInput {
  title: string
  rating: number
  genres?: string[]
  year?: number
  description?: string
}

export interface QuarantineReasonCount {
  reason: string
  count: number
}

export interface QuarantineSummary {
  total: number
  byReason: QuarantineReasonCount[]
}
