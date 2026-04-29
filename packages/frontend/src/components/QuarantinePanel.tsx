import React from 'react'
import { useQuery } from '@apollo/client'
import { GET_QUARANTINE_SUMMARY } from '../graphql/queries'

export function QuarantinePanel() {
  const { data, loading, error } = useQuery(GET_QUARANTINE_SUMMARY)

  if (loading) return <div className="panel loading">Loading quarantine log…</div>
  if (error) return <div className="panel error">Error: {error.message}</div>

  const { total, byReason } = data.quarantineSummary

  return (
    <div className="panel">
      <h2>Quarantine Log</h2>
      <p className="panel-subtitle">
        Files that failed ingestion are quarantined rather than silently dropped.
        Each entry carries a typed reason so failures are always observable.
      </p>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="stat-box">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total Quarantined</span>
        </div>
      </div>

      {total === 0 ? (
        <p className="empty">All files ingested successfully — nothing quarantined.</p>
      ) : (
        <>
          <h3>Breakdown by Reason</h3>
          <ul className="genre-list">
            {byReason.map((r: { reason: string; count: number }) => (
              <li key={r.reason} className="genre-item">
                <span className="genre-name quarantine-reason">{r.reason}</span>
                <span className="genre-count">{r.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
