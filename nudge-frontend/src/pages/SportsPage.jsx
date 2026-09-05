import React, { useState, useEffect, useMemo, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import SearchBar from '../components/SearchBar'
import ReelSpinner from '../components/ReelSpinner'
import SportsInfoCard from '../components/SportsInfoCard'
import useSearch from '../hooks/useSearch'
import '../styles/SportsPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

// Static teasers for the idle Shopping reel
const SPORTS_SHOP_TEASERS = [
  { icon: '👕', title: 'Official team jerseys & kits', tag: 'Gear' },
  { icon: '👟', title: 'Latest boots & trainers', tag: 'New season' },
  { icon: '🧢', title: 'Caps, scarves & fan merch', tag: 'Fan zone' },
  { icon: '🏋️', title: 'Training & gym equipment', tag: 'Kit up' },
  { icon: '🎟️', title: 'Match tickets & experiences', tag: 'Live' },
  { icon: '🎁', title: 'Signed memorabilia', tag: 'Collect' },
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
  const [sportsFeed, setSportsFeed] = useState({ news: [], videos: [] })

  // Load the fixtures dashboard + sports news feed on mount — both feed the idle frame
  useEffect(() => {
    fetch(`${API_URL}/sports/dashboard`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setDashboard(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/search/sports-news`)
      .then(r => r.ok ? r.json() : { news: [], videos: [] })
      .then(d => setSportsFeed({ news: d.news || [], videos: d.videos || [] }))
      .catch(() => {})
  }, [])

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

  // Idle reel content — fixtures, sports news, highlights and gear
  const idleReels = useMemo(() => {
    const fixtures = (dashboard?.todayEvents || []).slice(0, 10).map(e => ({
      icon: '⚡',
      title: `${e.homeTeam || e.home?.name || ''} vs ${e.awayTeam || e.away?.name || ''}`.trim(),
      tag: e.league || e.time || 'Fixture',
    }))
    const newsCards = sportsFeed.news.map(n => ({
      icon: '📰',
      title: n.title,
      tag: n.source || 'News',
    }))
    const videoCards = sportsFeed.videos.map(v => ({
      icon: '🎬',
      title: v.title,
      tag: 'Highlights',
    }))
    return {
      all: [...fixtures.slice(0, 5), ...newsCards.slice(0, 4)],
      images: [...fixtures.slice(5), ...fixtures.slice(0, 4)],
      videos: videoCards.length > 0
        ? videoCards
        : [{ icon: '🎬', title: 'Match highlights loading…', tag: 'Video' }],
      news: newsCards.length > 0
        ? newsCards
        : [{ icon: '📰', title: 'Sports headlines loading…', tag: 'News' }],
      shopping: SPORTS_SHOP_TEASERS,
    }
  }, [dashboard, sportsFeed])

  const handleFilterClick = (leagueId) => {
    setActiveFilter(String(leagueId))
  }

  const handleSearch = (query) => {
    // Sports mode: every category reel gets a sports-flavoured query
    search(query, [], { sportsMode: true })
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

          {/* The slot frame — idles with sports content, spins while searching */}
          {loading || !results ? (
            !error && (
              <ReelSpinner
                idle
                loading={loading}
                loadingMessage="Searching sports…"
                idleReels={idleReels}
              />
            )
          ) : (
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

          {/* Error message */}
          {error && !loading && (
            <div className="error-message">{error}</div>
          )}

          {/* Empty state */}
          {!results && !loading && !error && (
            <div className="sports-search-empty">
              <p className="empty-hint">Search a team, player or sport — every reel fills with <strong>news, highlights, fixtures & gear</strong>.</p>
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

          {(!dashboard || hubLoading) && (
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
