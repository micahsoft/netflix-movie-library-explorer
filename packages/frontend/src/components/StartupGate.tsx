import React, { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_STATS } from '../graphql/queries'

interface StartupGateProps {
  children: React.ReactNode
}

export function StartupGate({ children }: StartupGateProps) {
  const [ready, setReady] = useState(false)
  const [dots, setDots] = useState('.')

  const { error } = useQuery(GET_STATS, {
    fetchPolicy: 'network-only',
    pollInterval: ready ? 0 : 2000,
    onCompleted: () => setReady(true),
  })

  useEffect(() => {
    if (ready) return
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [ready])

  if (ready) return <>{children}</>

  return (
    <div className="startup-gate">
      <div className="startup-content">
        <span className="netflix-n" style={{ fontSize: '3rem' }}>N</span>
        <p className="startup-message">
          {error ? `Connecting${dots}` : `Indexing catalog${dots}`}
        </p>
        <p className="startup-sub">
          {error
            ? 'Waiting for the backend to start up'
            : 'Drive ingestion in progress — almost ready'}
        </p>
      </div>
    </div>
  )
}
