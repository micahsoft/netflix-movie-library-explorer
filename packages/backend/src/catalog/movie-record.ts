import { Movie } from '@movie-explorer/types'

export interface MovieRecord extends Movie {
  genreSet: Set<string>
}

export function toRecord(movie: Movie): MovieRecord {
  return { ...movie, genreSet: new Set(movie.genres) }
}

export function fromRecord(record: MovieRecord): Movie {
  const { genreSet, ...movie } = record
  return movie
}
