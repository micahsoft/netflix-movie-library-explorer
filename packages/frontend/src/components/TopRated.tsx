import React, { useState } from 'react'
import { useLazyQuery } from '@apollo/client'
import { GET_TOP_RATED } from '../graphql/queries'
import { MovieCard } from './MovieCard'
import { Movie } from '@movie-explorer/types'

export function TopRated() {
  const [visible, setVisible] = useState(false)
  const [fetch, { data, loading }] = useLazyQuery(GET_TOP_RATED, {
    variables: { limit: 10 },
    fetchPolicy: 'network-only',
  })

  const handleClick = () => {
    fetch()
    setVisible(true)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Top Rated</h2>
        <button className="btn-primary" onClick={handleClick} disabled={loading}>
          {loading ? 'Loading…' : 'Show Top 10'}
        </button>
      </div>
      {visible && data && (
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
