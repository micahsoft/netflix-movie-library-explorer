import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useLazyQuery } from '@apollo/client'
import { GET_STATS, SEARCH_MOVIES } from '../graphql/queries'
import { MovieCard } from './MovieCard'
import { Movie } from '@movie-explorer/types'

export function StatsPanel() {
  const { data: statsData, loading: statsLoading, error: statsError } = useQuery(GET_STATS)
  const [query, setQuery] = useState('')
  const [search, { data: searchData, loading: searchLoading }] = useLazyQuery(SEARCH_MOVIES)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) return
    debounceRef.current = setTimeout(() => {
      search({ variables: { filter: { q: query }, limit: 20 } })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const results: Movie[] = searchData?.movies?.items ?? []
  const showResults = query.trim().length > 0

  return (
    <div>
      <div className="panel" style={{ marginBottom: '1rem' }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search movies by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        {searchLoading && <div className="loading-text">Searching…</div>}
        {showResults && searchData && (
          <div className="search-results">
            <p className="results-count">{searchData.movies.total} results</p>
            {results.map((m) => <MovieCard key={m.id} movie={m} />)}
            {results.length === 0 && <p className="empty">No movies found.</p>}
          </div>
        )}
      </div>

      {!showResults && (
        <div className="panel stats-panel">
          <h2>Catalog Overview</h2>
          {statsLoading && <p className="loading-text">Loading stats…</p>}
          {statsError && <p className="error-msg">Failed to load stats.</p>}
          {statsData && (
            <>
              <div className="stats-grid">
                <div className="stat-box">
                  <span className="stat-value">{statsData.stats.totalCount.toLocaleString()}</span>
                  <span className="stat-label">Movies</span>
                </div>
                <div className="stat-box">
                  <span className="stat-value">{statsData.stats.averageRating.toFixed(2)}</span>
                  <span className="stat-label">Avg Rating</span>
                </div>
              </div>
              <h3>Top 5 Genres</h3>
              <ul className="genre-list">
                {statsData.stats.topGenres.map((g: { genre: string; count: number }) => (
                  <li key={g.genre} className="genre-item">
                    <span className="genre-name">{g.genre}</span>
                    <span className="genre-count">{g.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
