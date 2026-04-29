import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_STATS } from '../graphql/queries'
import { Movie } from '@movie-explorer/types'

export function MoviesByYear() {
  const { data, loading } = useQuery(GET_STATS)
  const [expanded, setExpanded] = useState<number | null>(null)

  if (loading) return <div className="panel loading">Loading…</div>

  const { byYear } = data.stats

  return (
    <div className="panel">
      <h2>Movies by Year</h2>
      <div className="year-list">
        {byYear.map((group: { year: number; count: number; movies: Movie[] }) => (
          <div key={group.year} className="year-group">
            <button
              className="year-header"
              onClick={() => setExpanded(expanded === group.year ? null : group.year)}
            >
              <span>{group.year}</span>
              <span className="year-count">{group.count} movies</span>
              <span className="chevron">{expanded === group.year ? '▲' : '▼'}</span>
            </button>
            {expanded === group.year && (
              <ul className="year-movies">
                {group.movies.map((m) => (
                  <li key={m.id} className="year-movie-item">
                    <span>{m.title}</span>
                    <span className="movie-rating-small">⭐ {m.rating.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
