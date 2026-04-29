import { Movie } from '@movie-explorer/types'

export type QuarantineReason =
  | 'missing_title'
  | 'missing_rating'
  | 'invalid_rating_type'
  | 'invalid_json'
  | 'parse_error'
  | 'fetch_error'

export type NormalizeResult =
  | { ok: true; movie: Movie }
  | { ok: false; reason: QuarantineReason }

export interface FileContext {
  driveFileId: string
  folderPath: string[]
}

const TITLE_CANDIDATES = ['title', 'name', 'movie_title', 'film_title', 'Title']
const RATING_CANDIDATES = ['rating', 'score', 'vote_average', 'imdb_rating', 'Rating']
const GENRES_CANDIDATES = ['genres', 'genre', 'categories', 'category']
const YEAR_CANDIDATES = ['year', 'release_year', 'releaseYear', 'release_date']
const ID_CANDIDATES = ['id', 'movie_id', 'imdb_id']
const DESCRIPTION_CANDIDATES = ['description', 'overview', 'synopsis', 'plot', 'summary']

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = 1888
const MAX_YEAR = CURRENT_YEAR + 5

function extractFirst(data: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (data[key] != null) return data[key]
  }
  return null
}

function extractTitle(data: Record<string, unknown>): string | null {
  const val = extractFirst(data, TITLE_CANDIDATES)
  if (typeof val !== 'string') return null
  return val.trim() || null
}

function extractRating(data: Record<string, unknown>): number | null | 'invalid' {
  const val = extractFirst(data, RATING_CANDIDATES)
  if (val == null) return null
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  if (isNaN(num)) return 'invalid'
  return num
}

function extractGenres(data: Record<string, unknown>, folderPath: string[]): string[] {
  const val = extractFirst(data, GENRES_CANDIDATES)

  if (val != null) {
    let genres: string[]
    if (typeof val === 'string') {
      genres = val.split(',').map((g) => g.trim()).filter(Boolean)
    } else if (Array.isArray(val)) {
      genres = val.filter((g) => typeof g === 'string').map((g) => g.trim()).filter(Boolean)
    } else {
      genres = []
    }
    return [...new Set(genres)]
  }

  // Folder path fallback: first segment that is not a year
  const genreFromPath = folderPath.find((seg) => !/^\d{4}$/.test(seg))
  return genreFromPath ? [genreFromPath] : []
}

function extractYear(data: Record<string, unknown>, folderPath: string[]): number | null {
  const val = extractFirst(data, YEAR_CANDIDATES)

  if (val != null) {
    const num = parseInt(String(val).slice(0, 4), 10)
    if (!isNaN(num) && num >= MIN_YEAR && num <= MAX_YEAR) return num
  }

  // Folder path fallback: find a 4-digit year segment
  for (const seg of folderPath) {
    const num = parseInt(seg, 10)
    if (!isNaN(num) && num >= MIN_YEAR && num <= MAX_YEAR) return num
  }

  return null
}

function extractDescription(data: Record<string, unknown>): string | null {
  const val = extractFirst(data, DESCRIPTION_CANDIDATES)
  return typeof val === 'string' ? val.trim() || null : null
}

function extractId(data: Record<string, unknown>): string | null {
  const val = extractFirst(data, ID_CANDIDATES)
  return val != null ? String(val) : null
}

export function normalize(raw: unknown, context: FileContext): NormalizeResult {
  try {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ok: false, reason: 'parse_error' }
    }

    const data = raw as Record<string, unknown>

    const title = extractTitle(data)
    if (!title) return { ok: false, reason: 'missing_title' }

    const ratingResult = extractRating(data)
    if (ratingResult === null) return { ok: false, reason: 'missing_rating' }
    if (ratingResult === 'invalid') return { ok: false, reason: 'invalid_rating_type' }

    return {
      ok: true,
      movie: {
        id: extractId(data) ?? context.driveFileId,
        title,
        rating: ratingResult,
        genres: extractGenres(data, context.folderPath),
        year: extractYear(data, context.folderPath),
        description: extractDescription(data),
        source: 'drive',
      },
    }
  } catch {
    return { ok: false, reason: 'parse_error' }
  }
}
