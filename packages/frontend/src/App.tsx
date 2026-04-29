import React, { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { StatsPanel } from './components/StatsPanel'
import { TopRated } from './components/TopRated'
import { MoviesByYear } from './components/MoviesByYear'
import { AddMovieForm } from './components/AddMovieForm'
import { FilterPanel } from './components/FilterPanel'

type Tab = 'overview' | 'search' | 'top-rated' | 'by-year' | 'add' | 'filter'

const TABS: { id: Tab; label: string; audience: 'all' | 'technical' }[] = [
  { id: 'overview', label: 'Overview', audience: 'all' },
  { id: 'search', label: 'Search', audience: 'all' },
  { id: 'top-rated', label: 'Top Rated', audience: 'all' },
  { id: 'by-year', label: 'By Year', audience: 'all' },
  { id: 'add', label: 'Add Movie', audience: 'all' },
  { id: 'filter', label: 'Filter API', audience: 'technical' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="netflix-n">N</span>
          <span className="header-title">Movie Library Explorer</span>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''} ${t.audience === 'technical' ? 'technical' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.audience === 'technical' && <span className="tech-badge">API</span>}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {tab === 'overview' && <StatsPanel />}
        {tab === 'search' && <SearchBar />}
        {tab === 'top-rated' && <TopRated />}
        {tab === 'by-year' && <MoviesByYear />}
        {tab === 'add' && <AddMovieForm />}
        {tab === 'filter' && <FilterPanel />}
      </main>
    </div>
  )
}
