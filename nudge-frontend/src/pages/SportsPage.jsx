import React, { useState, useEffect, useMemo } from 'react'
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

export default function SportsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/sports/dashboard`)
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Failed to fetch sports data:', err)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="sports-page">
        <div className="sports-loading">
          <div className="sports-spinner" />
          <p>Loading sports data...</p>
        </div>
      </div>
    )
  }

  // Lazy-load the spinner to keep the initial bundle small
  const SportsReelSpinner = React.lazy(() => import('../components/SportsReelSpinner'))

  return (
    <div className="sports-page">
      <div className="sports-header">
        <h1 className="page-title">🏟️ Sports Hub</h1>
        <p className="page-subtitle">Live scores, fixtures, and results — tap any card for details</p>
      </div>

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

      {/* Slot machine reels */}
      <React.Suspense fallback={<div className="sports-loading"><div className="sports-spinner" /></div>}>
        <SportsReelSpinner
          dashboard={filteredDashboard}
        />
      </React.Suspense>
    </div>
  )
}
