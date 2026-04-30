import React from 'react'
import { useQuery } from '@apollo/client'
import { GET_TOP_RATED } from '../graphql/queries'
import { MovieCard } from './MovieCard'
import { Movie } from '@movie-explorer/types'

export function TopRated() {
  const { data, loading, error, refetch } = useQuery(GET_TOP_RATED, {
    variables: { pagination: { limit: 10 } },
    fetchPolicy: 'network-only',
  })

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Top Rated</h2>
        <button className="btn-primary" onClick={() => refetch()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="error-msg">Failed to load: {error.message}</p>}
      {data && (
        <div className="movie-list">
          {data.topRated.map((m: Movie, i: number) => (
            <div key={m.id} className="ranked-item">
              <span className="rank">#{i + 1}</span>
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
