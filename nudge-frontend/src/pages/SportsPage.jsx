import React, { useState, useEffect } from 'react'
import SportsReelSpinner from '../components/SportsReelSpinner'
import '../styles/SportsPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

  const handleFilterClick = (leagueId) => {
    setActiveFilter(leagueId)
    setStandings(null)
    if (leagueId !== 'all') {
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
