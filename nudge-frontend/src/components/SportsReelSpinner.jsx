import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../styles/ReelSpinner.css'

const SPORT_CATEGORIES = [
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'upcoming', label: 'Fixtures', icon: '⚽' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'live', label: 'Live', icon: '🔴' },
  { key: 'teams', label: 'Teams', icon: '🛡️' },
]

const SYMBOL_HEIGHT = 110

// === Match Detail Modal ===
function MatchModal({ event, onClose }) {
  if (!event) return null
  const homeWin = event.hasResult && event.homeScore > event.awayScore
  const awayWin = event.hasResult && event.awayScore > event.homeScore

  return (
    <div className="sports-modal-overlay" onClick={onClose}>
      <div className="sports-modal" onClick={e => e.stopPropagation()}>
        <button className="sports-modal-close" onClick={onClose}>✕</button>

        <div className="sports-modal-league">{event.league}{event.round ? ` · ${event.round}` : ''}</div>

        {event.thumb && (
          <img src={event.thumb} alt="" className="sports-modal-thumb" />
        )}

        <div className="sports-modal-teams">
          <div className={`sports-modal-team ${homeWin ? 'won' : ''}`}>
            <span className="sports-modal-team-name">{event.homeTeam}</span>
            {event.hasResult && <span className="sports-modal-score">{event.homeScore}</span>}
          </div>
          <div className="sports-modal-vs">{event.hasResult ? '' : 'vs'}</div>
          <div className={`sports-modal-team ${awayWin ? 'won' : ''}`}>
            <span className="sports-modal-team-name">{event.awayTeam}</span>
            {event.hasResult && <span className="sports-modal-score">{event.awayScore}</span>}
          </div>
        </div>

        <div className="sports-modal-info">
          <div className="sports-modal-info-row">
            <span className="info-label">📅 Date</span>
            <span className="info-value">{event.date}{event.time ? ` · ${event.time.slice(0,5)}` : ''}</span>
          </div>
          {event.venue && (
            <div className="sports-modal-info-row">
              <span className="info-label">🏟️ Venue</span>
              <span className="info-value">{event.venue}</span>
            </div>
          )}
          {event.country && (
            <div className="sports-modal-info-row">
              <span className="info-label">🌍 Country</span>
              <span className="info-value">{event.country}</span>
            </div>
          )}
          <div className="sports-modal-info-row">
            <span className="info-label">🏷️ Sport</span>
            <span className="info-value">{event.sport}</span>
          </div>
          <div className="sports-modal-info-row">
            <span className="info-label">📊 Status</span>
            <span className={`info-value status-${event.status}`}>{event.status}</span>
          </div>
        </div>

        {event.video && (
          <a href={event.video} target="_blank" rel="noopener noreferrer" className="sports-modal-video-btn">
            ▶️ Watch Highlights
          </a>
        )}

        <div className="sports-modal-actions">
          <a
            href={`https://nudge-xi-eight.vercel.app/search?q=${encodeURIComponent(event.homeTeam + ' vs ' + event.awayTeam)}`}
            className="sports-modal-action-btn"
          >
            🔍 Search this match
          </a>
        </div>
      </div>
    </div>
  )
}

// === Team Detail Modal ===
function TeamModal({ team, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!team?.teamId) {
      setLoading(false)
      return
    }
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    fetch(`${API_URL}/sports/team/${team.teamId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setDetails(data?.team || data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [team])

  if (!team) return null

  return (
    <div className="sports-modal-overlay" onClick={onClose}>
      <div className="sports-modal" onClick={e => e.stopPropagation()}>
        <button className="sports-modal-close" onClick={onClose}>✕</button>

        {loading ? (
          <div className="sports-modal-loading">Loading team details...</div>
        ) : details ? (
          <>
            {details.strBadge && <img src={details.strBadge} alt="" className="sports-modal-thumb" />}
            <h2 className="sports-modal-team-title">{details.strTeam}</h2>
            <div className="sports-modal-info">
              {details.strLeague && (
                <div className="sports-modal-info-row">
                  <span className="info-label">🏆 League</span>
                  <span className="info-value">{details.strLeague}</span>
                </div>
              )}
              {details.strStadium && (
                <div className="sports-modal-info-row">
                  <span className="info-label">🏟️ Stadium</span>
                  <span className="info-value">{details.strStadium}</span>
                </div>
              )}
              {details.strCountry && (
                <div className="sports-modal-info-row">
                  <span className="info-label">🌍 Country</span>
                  <span className="info-value">{details.strCountry}</span>
                </div>
              )}
              {details.strDescriptionEN && (
                <div className="sports-modal-team-desc">
                  {details.strDescriptionEN.slice(0, 300)}{details.strDescriptionEN.length > 300 ? '...' : ''}
                </div>
              )}
            </div>
            <div className="sports-modal-actions">
              <a
                href={`https://nudge-xi-eight.vercel.app/search?q=${encodeURIComponent(team.name)}`}
                className="sports-modal-action-btn"
              >
                🔍 Search {team.name}
              </a>
            </div>
          </>
        ) : (
          <>
            <h2 className="sports-modal-team-title">{team.name}</h2>
            <div className="sports-modal-team-desc">{team.league}</div>
            <div className="sports-modal-actions">
              <a
                href={`https://nudge-xi-eight.vercel.app/search?q=${encodeURIComponent(team.name)}`}
                className="sports-modal-action-btn"
              >
                🔍 Search {team.name}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// === Reel Symbols (clickable) ===
function EventSymbol({ event, onClick }) {
  const homeWin = event.hasResult && event.homeScore > event.awayScore
  const awayWin = event.hasResult && event.awayScore > event.homeScore
  return (
    <div
      className="reel-symbol sports-symbol clickable"
      style={{ height: SYMBOL_HEIGHT }}
      onClick={() => onClick(event)}
    >
      <div className="sports-symbol-league">{event.league}</div>
      <div className="sports-symbol-teams">
        <span className={`team ${homeWin ? 'won' : ''}`}>{event.homeTeam}</span>
        <span className="vs">vs</span>
        <span className={`team ${awayWin ? 'won' : ''}`}>{event.awayTeam}</span>
      </div>
      {event.hasResult ? (
        <div className="sports-symbol-score">{event.homeScore} - {event.awayScore}</div>
      ) : (
        <div className="sports-symbol-time">{event.date} {event.time?.slice(0, 5) || ''}</div>
      )}
      <span className={`sports-symbol-status ${event.status || 'upcoming'}`}>
        {event.status === 'finished' ? 'FT' : event.status === 'live' ? 'LIVE' : 'UPCOMING'}
      </span>
      <span className="sports-symbol-click-hint">tap →</span>
    </div>
  )
}

function TeamSymbol({ team, onClick }) {
  return (
    <div
      className="reel-symbol sports-symbol team-symbol clickable"
      style={{ height: SYMBOL_HEIGHT }}
      onClick={() => onClick(team)}
    >
      {team.badge && <img src={team.badge} alt="" className="team-badge" />}
      <div className="team-symbol-name">{team.name}</div>
      <div className="team-symbol-league">{team.league}</div>
      <span className="sports-symbol-click-hint">tap →</span>
    </div>
  )
}

export default function SportsReelSpinner({ dashboard, standings, teams }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeCategory, setActiveCategory] = useState('today')
  const [spinningReels, setSpinningReels] = useState({})
  const [finalPositions, setFinalPositions] = useState({})
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const timersRef = useRef([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  // Build reels from dashboard data
  const reels = useMemo(() => {
    const todayEvents = dashboard?.todayEvents || []
    const leagues = dashboard?.leagues || []

    const upcoming = leagues.flatMap(l => l.upcoming || [])
    const results = leagues.flatMap(l => l.recent || [])
    // Live = events with status 'live' from any source
    const live = [...todayEvents, ...upcoming, ...results].filter(e => e.status === 'live')
    const allTeams = teams || leagues.flatMap(l =>
      (l.upcoming || []).concat(l.recent || []).reduce((acc, e) => {
        if (e.homeTeam && !acc.find(t => t.name === e.homeTeam)) acc.push({ name: e.homeTeam, league: e.league, badge: e.homeBadge, teamId: e.homeTeamId })
        if (e.awayTeam && !acc.find(t => t.name === e.awayTeam)) acc.push({ name: e.awayTeam, league: e.league, badge: e.awayBadge, teamId: e.awayTeamId })
        return acc
      }, [])
    )

    return {
      today: todayEvents,
      upcoming,
      results,
      live,
      teams: allTeams,
    }
  }, [dashboard, standings, teams])

  const visibleCats = activeCategory === 'all'
    ? SPORT_CATEGORIES
    : SPORT_CATEGORIES.filter(c => c.key === activeCategory)

  const visibleSymbols = activeCategory === 'all' ? 3 : 5

  const handleSpin = () => {
    if (isSpinning) return
    const hasResults = visibleCats.some(cat => {
      const reel = reels[cat.key] || []
      return reel.length > 0
    })
    if (!hasResults) return

    setIsSpinning(true)
    const spinning = {}
    const positions = {}
    visibleCats.forEach(cat => {
      spinning[cat.key] = true
      positions[cat.key] = 0
    })
    setSpinningReels(spinning)
    setFinalPositions(positions)

    visibleCats.forEach((cat, index) => {
      const reel = reels[cat.key] || []
      const stopDelay = 1200 + index * 250

      const timer = setTimeout(() => {
        const finalIndex = reel.length <= visibleSymbols
          ? 0
          : Math.floor(Math.random() * (reel.length - visibleSymbols + 1))
        setFinalPositions(prev => ({ ...prev, [cat.key]: finalIndex * SYMBOL_HEIGHT }))
        setSpinningReels(prev => ({ ...prev, [cat.key]: false }))
      }, stopDelay)
      timersRef.current.push(timer)
    })

    const totalDuration = 1200 + (visibleCats.length - 1) * 250 + 500
    const completeTimer = setTimeout(() => {
      setIsSpinning(false)
    }, totalDuration)
    timersRef.current.push(completeTimer)
  }

  const isEmpty = Object.values(reels).every(arr => !arr || arr.length === 0)

  if (isEmpty) {
    return (
      <div className="sports-empty">
        <p>No sports data available right now. Try refreshing or selecting a different league.</p>
      </div>
    )
  }

  const renderSymbol = (cat, item, i) => {
    if (cat.key === 'teams') return <TeamSymbol key={i} team={item} onClick={setSelectedTeam} />
    return <EventSymbol key={i} event={item} onClick={setSelectedEvent} />
  }

  return (
    <>
      <div className="slot-machine">
        {/* Category buttons */}
        <div className="reel-controls">
          <div className="category-buttons">
            <button
              className={`cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >🏟️ All Reels</button>
            {SPORT_CATEGORIES.map(cat => {
              const count = (reels[cat.key] || []).length
              return (
                <button
                  key={cat.key}
                  className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.icon} {cat.label}
                  {count > 0 && <span className="cat-count">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reels */}
        <div className="slot-reels">
          {visibleCats.map((cat) => {
            const reel = reels[cat.key] || []
            return (
              <div className="slot-reel" key={cat.key}>
                <div className="reel-label">{cat.icon} {cat.label}</div>
                <div
                  className="reel-viewport"
                  style={{ height: visibleSymbols * SYMBOL_HEIGHT }}
                >
                  <div
                    className={`reel-track ${spinningReels[cat.key] ? 'spinning' : ''}`}
                    style={{
                      transform: spinningReels[cat.key]
                        ? undefined
                        : `translateY(-${finalPositions[cat.key] || 0}px)`,
                      transition: spinningReels[cat.key] ? 'none' : 'transform 0.5s ease-out',
                    }}
                  >
                    {reel.length > 0 ? (
                      reel.map((item, i) => renderSymbol(cat, item, i))
                    ) : (
                      <div className="reel-symbol empty-symbol" style={{ height: SYMBOL_HEIGHT }}>
                        <span>No {cat.label.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="spin-btn"
        >
          {isSpinning ? '🏈 Spinning...' : '🏈 SPIN'}
        </button>
      </div>

      {/* Modals */}
      {selectedEvent && <MatchModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {selectedTeam && <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
    </>
  )
}
