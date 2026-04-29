import React, { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { SEARCH_MOVIES } from '../graphql/queries'
import { MovieCard } from './MovieCard'
import { Movie } from '@movie-explorer/types'

export function FilterPanel() {
  const [genre, setGenre] = useState('')
  const [minRating, setMinRating] = useState('')
  const [year, setYear] = useState('')
  const [filter, { data, loading }] = useLazyQuery(SEARCH_MOVIES)

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    const vars: Record<string, unknown> = {}
    if (genre.trim()) vars.genre = genre.trim()
    if (minRating) vars.minRating = parseFloat(minRating)
    if (year) vars.year = parseInt(year, 10)
    filter({ variables: { filter: vars } })
  }

  const results: Movie[] = data?.movies?.items ?? []

  return (
    <div className="panel">
      <h2>Filter Movies</h2>
      <p className="panel-subtitle">Technical user API — combine any filters</p>
      <form className="filter-form" onSubmit={handleApply}>
        <label>
          Genre
          <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g. Action" />
        </label>
        <label>
          Min Rating
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="e.g. 7.5"
          />
        </label>
        <label>
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2019"
          />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Filtering…' : 'Apply Filters'}
        </button>
      </form>
      {data && (
        <div className="search-results">
          <p className="results-count">{data.movies.total} results</p>
          {results.map((m) => <MovieCard key={m.id} movie={m} />)}
          {results.length === 0 && <p className="empty">No movies match these filters.</p>}
        </div>
      )}
    </div>
  )
}
