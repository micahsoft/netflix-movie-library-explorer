import React, { useState, useEffect, useRef } from 'react'
import { useLazyQuery } from '@apollo/client'
import { SEARCH_MOVIES } from '../graphql/queries'
import { MovieCard } from './MovieCard'
import { Movie } from '@movie-explorer/types'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [search, { data, loading }] = useLazyQuery(SEARCH_MOVIES)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) return
    debounceRef.current = setTimeout(() => {
      search({ variables: { filter: { q: query }, limit: 20 } })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const results: Movie[] = data?.movies?.items ?? []

  return (
    <div className="panel">
      <h2>Search Movies</h2>
      <input
        className="search-input"
        type="text"
        placeholder="Search by title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div className="loading-text">Searching…</div>}
      {query && data && (
        <div className="search-results">
          <p className="results-count">{data.movies.total} results</p>
          {results.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
          {results.length === 0 && <p className="empty">No movies found.</p>}
        </div>
      )}
    </div>
  )
}
