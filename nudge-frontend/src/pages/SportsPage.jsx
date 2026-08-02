import React, { useState, useEffect } from 'react'
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

function ScoreBadge({ status }) {
  const labels = {
    finished: 'FT',
    live: 'LIVE',
    upcoming: 'UPCOMING',
    postponed: 'PPD',
  }
  const colors = {
    finished: 'status-finished',
    live: 'status-live',
    upcoming: 'status-upcoming',
    postponed: 'status-postponed',
  }
  return <span className={`score-status ${colors[status] || 'status-upcoming'}`}>{labels[status] || status}</span>
}

function EventCard({ event }) {
  const homeWin = event.hasResult && event.homeScore > event.awayScore
  const awayWin = event.hasResult && event.awayScore > event.homeScore

  return (
    <div className="event-card">
      <div className="event-header">
        <span className="event-league">{event.league}</span>
        <ScoreBadge status={event.status} />
      </div>
      <div className="event-teams">
        <div className={`team-row ${homeWin ? 'team-won' : ''}`}>
          <span className="team-name">{event.homeTeam}</span>
          {event.hasResult && <span className="team-score">{event.homeScore}</span>}
        </div>
        <div className="event-vs">vs</div>
        <div className={`team-row ${awayWin ? 'team-won' : ''}`}>
          <span className="team-name">{event.awayTeam}</span>
          {event.hasResult && <span className="team-score">{event.awayScore}</span>}
        </div>
      </div>
      <div className="event-footer">
        <span className="event-date">{event.date}</span>
        {event.time && <span className="event-time">{event.time.slice(0, 5)}</span>}
        {event.venue && <span className="event-venue">{event.venue}</span>}
      </div>
    </div>
  )
}

function StandingsTable({ table }) {
  if (!table || table.length === 0) return null
  return (
    <div className="standings-card">
      <h3 className="standings-title">League Standings</h3>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => (
            <tr key={t.teamId || i} className={i < 4 ? 'qualifying' : ''}>
              <td className="rank">{t.rank}</td>
              <td className="team-name-cell">{t.team}</td>
              <td>{t.played}</td>
              <td>{t.win}</td>
              <td>{t.draw}</td>
              <td>{t.loss}</td>
              <td>{t.goalDiff > 0 ? '+' : ''}{t.goalDiff}</td>
              <td className="points">{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SportsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [standings, setStandings] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('fixtures')

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
        setStandings(data.table)
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

  const todayEvents = dashboard?.todayEvents || []
  const leagues = dashboard?.leagues || []

  // Filter events by league
  const filteredLeagues = activeFilter === 'all'
    ? leagues
    : leagues.filter(l => l.leagueId === parseInt(activeFilter))

  // If filter is a league not in the dashboard's top 5, fetch its data
  const filteredToday = activeFilter === 'all'
    ? todayEvents
    : todayEvents.filter(e => e.leagueId === parseInt(activeFilter))

  return (
    <div className="sports-page">
      <div className="sports-header">
        <h1 className="page-title">🏟️ Sports Hub</h1>
        <p className="page-subtitle">Live scores, fixtures, and standings powered by TheSportsDB</p>
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

      {/* View toggle */}
      <div className="sports-view-toggle">
        <button
          className={`view-btn ${view === 'fixtures' ? 'active' : ''}`}
          onClick={() => setView('fixtures')}
        >Fixtures & Results</button>
        <button
          className={`view-btn ${view === 'standings' ? 'active' : ''}`}
          onClick={() => setView('standings')}
        >Standings</button>
      </div>

      {view === 'standings' && activeFilter !== 'all' && (
        <StandingsTable table={standings} />
      )}

      {view === 'standings' && activeFilter === 'all' && (
        <div className="sports-empty">
          <p>Select a specific league to view standings</p>
        </div>
      )}

      {view === 'fixtures' && (
        <>
          {/* Today's events */}
          {filteredToday.length > 0 && (
            <div className="section">
              <h2 className="section-title">📅 Today's Events</h2>
              <div className="events-grid">
                {filteredToday.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}

          {/* League sections */}
          {filteredLeagues.map(league => (
            <div key={league.leagueId} className="section">
              <h2 className="section-title">
                {league.league} <span className="section-meta">{league.sport} · {league.country}</span>
              </h2>

              {league.recent.length > 0 && (
                <>
                  <h3 className="subsection-title">Recent Results</h3>
                  <div className="events-grid">
                    {league.recent.map(e => <EventCard key={e.id} event={e} />)}
                  </div>
                </>
              )}

              {league.upcoming.length > 0 && (
                <>
                  <h3 className="subsection-title">Upcoming Fixtures</h3>
                  <div className="events-grid">
                    {league.upcoming.map(e => <EventCard key={e.id} event={e} />)}
                  </div>
                </>
              )}

              {league.recent.length === 0 && league.upcoming.length === 0 && (
                <p className="no-events">No events available for {league.league}</p>
              )}
            </div>
          ))}

          {filteredLeagues.length === 0 && filteredToday.length === 0 && (
            <div className="sports-empty">
              <p>No events found. Try a different league or check back later.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
