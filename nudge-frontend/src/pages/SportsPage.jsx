import React, { useState, useEffect, useMemo } from 'react'
import SportsReelSpinner from '../components/SportsReelSpinner'
import '../styles/SportsPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Default leagues to auto-load standings for (all 8 major leagues)
const DEFAULT_LEAGUES = [
  { id: 4328, label: 'EPL' },
  { id: 4331, label: 'Bundesliga' },
  { id: 4332, label: 'Serie A' },
  { id: 4335, label: 'La Liga' },
  { id: 4334, label: 'Ligue 1' },
  { id: 4387, label: 'NBA' },
  { id: 4391, label: 'NFL' },
  { id: 4380, label: 'NHL' },
]

const LEAGUE_FILTERS = [
  { id: 'all', label: 'All Sports' },
  { id: 4328, label: 'EPL' },
  { id: 4331, label: 'Bundesliga' },
  { id: 4335, label: 'La Liga' },
  { id: 4332, label: 'Serie A' },
  { id: 4334, label: 'Ligue 1' },
  { id: 4387, label: 'NBA' },
  { id: 4391, label: 'NFL' },
  { id: 4380, label: 'NHL' },
  { id: 4370, label: 'F1' },
]

export default function SportsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [standings, setStandings] = useState(null)
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
        // Auto-load standings for all default leagues in parallel
        await fetchAllStandings()
      }
    } catch (err) {
      console.error('Failed to fetch sports data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStandings = async (leagueId) => {
    try {
      const res = await fetch(`${API_URL}/sports/league/${leagueId}/standings`)
      if (res.ok) {
        const data = await res.json()
        setStandings(data.table || [])
      }
    } catch (err) {
      console.error('Failed to fetch standings:', err)
    }
  }

  // Auto-load all default league standings in parallel
  // Interleaves results so the Standings reel has variety across leagues
  const fetchAllStandings = async () => {
    try {
      const promises = DEFAULT_LEAGUES.map(l => 
        fetch(`${API_URL}/sports/league/${l.id}/standings`)
          .then(res => res.ok ? res.json() : null)
          .then(data => data?.table || [])
          .catch(() => [])
      )
      const results = await Promise.all(promises)
      // Interleave: take top entries from each league, round-robin style
      const merged = []
      const maxLen = Math.max(...results.map(r => r.length))
      for (let i = 0; i < maxLen; i++) {
        for (let j = 0; j < results.length; j++) {
          if (results[j][i]) {
            merged.push({ ...results[j][i], league: DEFAULT_LEAGUES[j].label })
          }
        }
      }
      setStandings(merged.slice(0, 20)) // Cap at 20 for the reel
    } catch (err) {
      console.error('Failed to fetch all standings:', err)
    }
  }

  const handleFilterClick = (leagueId) => {
    setActiveFilter(leagueId)
    if (leagueId === 'all') {
      fetchAllStandings()
    } else {
      fetchStandings(leagueId)
    }
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

  return (
    <div className="sports-page">
      <div className="sports-header">
        <h1 className="page-title">🏟️ Sports Hub</h1>
        <p className="page-subtitle">Live scores, fixtures, and standings — spin the reels to explore</p>
      </div>

      {/* League filters */}
      <div className="league-filters">
        {LEAGUE_FILTERS.map(f => (
          <button
            key={f.id}
            className={`league-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => handleFilterClick(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Slot machine reels */}
      <SportsReelSpinner
        dashboard={dashboard}
        standings={standings}
        teams={null}
      />
    </div>
  )
}
