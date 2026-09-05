import React, { useState, useEffect, useMemo, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import SearchBar from '../components/SearchBar'
import ReelSpinner from '../components/ReelSpinner'
import SportsInfoCard from '../components/SportsInfoCard'
import useSearch from '../hooks/useSearch'
import '../styles/SportsPage.css'

const LEAGUE_FILTERS = [
  { id: 'all', label: 'All Sports' },
  { id: '4328', label: 'EPL' },
  { id: '4331', label: 'Bundesliga' },
  { id: '4335', label: 'La Liga' },
  { id: '4332', label: 'Serie A' },
  { id: '4334', label: 'Ligue 1' },
  { id: '4387', label: 'NBA' },
  { id: '4391', label: 'NFL' },
  { id: '4380', label: 'NHL' },
  { id: '4370', label: 'F1' },
]

export default function SportsPage() {
  // View mode: 'search' (default) or 'hub' (the SportsHub dashboard)
  const [view, setView] = useState('search')
  const [resultMode, setResultMode] = useState('top')

  const { accessToken } = useContext(AuthContext)
  const { search, results, reels, loading, error } = useSearch(accessToken)

  const [dashboard, setDashboard] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [hubLoading, setHubLoading] = useState(false)

  // Load the SportsHub dashboard lazily — only when the user opens the Hub view
  const fetchDashboard = async () => {
    setHubLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sports/dashboard`)
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Failed to fetch sports data:', err)
    } finally {
      setHubLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'hub' && !dashboard && !hubLoading) {
      fetchDashboard()
    }
  }, [view])

  // Filter dashboard data by selected league
  const filteredDashboard = useMemo(() => {
    if (!dashboard) return null
    if (activeFilter === 'all') return dashboard

    const filterLeagueId = String(activeFilter)
    const filteredLeagues = (dashboard.leagues || []).filter(
      l => String(l.leagueId) === filterLeagueId
    )
    const filteredToday = (dashboard.todayEvents || []).filter(
      e => String(e.leagueId) === filterLeagueId
    )

    return {
      ...dashboard,
      todayEvents: filteredToday,
      leagues: filteredLeagues,
    }
  }, [dashboard, activeFilter])

  const handleFilterClick = (leagueId) => {
    setActiveFilter(String(leagueId))
  }

  const handleSearch = (query) => {
    search(query)
  }

  // Lazy-load the sports spinner to keep the initial bundle small
  const SportsReelSpinner = React.lazy(() => import('../components/SportsReelSpinner'))

  return (
    <div className="sports-page">
      <div className="sports-header">
        <h1 className="page-title">🏟️ Sports</h1>

        {/* View toggle — search bar is the default, SportsHub lives behind the Latest button */}
        <div className="sports-view-toggle">
          <button
            className={`sports-view-btn ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView('search')}
          >
            🔍 Search
          </button>
          <button
            className={`sports-view-btn ${view === 'hub' ? 'active' : ''}`}
            onClick={() => setView('hub')}
          >
            ⚡ Latest Scores
          </button>
        </div>
      </div>

      {view === 'search' ? (
        <div className="sports-search-view">
          <SearchBar
            onSearch={handleSearch}
            loading={loading}
            placeholder="Search teams, players, matches…"
          />

          {/* Loading spinner */}
          {loading && (
            <div className="sports-loading">
              <div className="sports-spinner" />
              <p>Searching sports…</p>
            </div>
          )}

          {/* Error message */}
          {error && !loading && (
            <div className="error-message">{error}</div>
          )}

          {/* Results */}
          {results && !loading && (
            <>
              {results?.sportsData && <SportsInfoCard sportsData={results.sportsData} />}
              <ReelSpinner
                reels={reels}
                isWinning={results.isWinning}
                resultMode={resultMode}
                onResultModeChange={setResultMode}
              />
            </>
          )}

          {/* Empty state */}
          {!results && !loading && !error && (
            <div className="sports-search-empty">
              <div className="empty-icon">🏟️</div>
              <p>Search for a team, player, or sport — results appear on the reels.</p>
              <p className="empty-hint">Or hit <strong>⚡ Latest Scores</strong> above for the live SportsHub.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="sports-hub-view">
          <p className="page-subtitle">Live scores, fixtures, and results — tap any card for details</p>

          {/* League filters */}
          <div className="league-filters">
            {LEAGUE_FILTERS.map(f => (
              <button
                key={f.id}
                className={`league-filter-btn ${activeFilter === String(f.id) ? 'active' : ''}`}
                onClick={() => handleFilterClick(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hubLoading && (
            <div className="sports-loading">
              <div className="sports-spinner" />
              <p>Loading sports data…</p>
            </div>
          )}

          {/* Slot machine reels */}
          {dashboard && !hubLoading && (
            <React.Suspense fallback={<div className="sports-loading"><div className="sports-spinner" /></div>}>
              <SportsReelSpinner
                dashboard={filteredDashboard}
              />
            </React.Suspense>
          )}
        </div>
      )}
    </div>
  )
}
