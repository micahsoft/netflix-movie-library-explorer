import React from 'react'
import { useQuery } from '@apollo/client'
import { GET_STATS } from '../graphql/queries'
import { GenreCount } from '@movie-explorer/types'

export function StatsPanel() {
  const { data, loading, error } = useQuery(GET_STATS)

  if (loading) return <div className="panel loading">Loading stats…</div>
  if (error) return <div className="panel error">Failed to load stats.</div>

  const { totalCount, averageRating, topGenres } = data.stats

  return (
    <div className="panel stats-panel">
      <h2>Catalog Overview</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-value">{totalCount.toLocaleString()}</span>
          <span className="stat-label">Movies</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{averageRating.toFixed(2)}</span>
          <span className="stat-label">Avg Rating</span>
        </div>
      </div>
      <h3>Top 5 Genres</h3>
      <ul className="genre-list">
        {topGenres.map((g: GenreCount) => (
          <li key={g.genre} className="genre-item">
            <span className="genre-name">{g.genre}</span>
            <span className="genre-count">{g.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
