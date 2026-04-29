import React from 'react'
import { Movie } from '@movie-explorer/types'

interface Props {
  movie: Movie
}

export function MovieCard({ movie }: Props) {
  return (
    <div className="movie-card">
      <div className="movie-card-header">
        <span className="movie-title">{movie.title}</span>
        <span className="movie-rating">⭐ {movie.rating.toFixed(1)}</span>
      </div>
      <div className="movie-meta">
        {movie.year && <span className="tag">{movie.year}</span>}
        {movie.genres.map((g) => (
          <span key={g} className="tag">
            {g}
          </span>
        ))}
        {movie.source === 'manual' && <span className="tag tag-manual">added</span>}
      </div>
      {movie.description && <p className="movie-description">{movie.description}</p>}
    </div>
  )
}
