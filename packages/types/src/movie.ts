export enum MovieSource {
  DRIVE = 'drive',
  MANUAL = 'manual',
}

export interface Movie {
  id: string
  title: string
  rating: number
  genres: string[]
  year: number | null
  description: string | null
  source: MovieSource
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

export enum MovieSortField {
  RATING = 'RATING',
  YEAR = 'YEAR',
  TITLE = 'TITLE',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface MovieSort {
  field: MovieSortField
  direction: SortDirection
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
