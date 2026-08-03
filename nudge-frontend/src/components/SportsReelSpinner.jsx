import React, { useState, useEffect, useRef, useMemo } from 'react'
import '../styles/ReelSpinner.css'

const SPORT_CATEGORIES = [
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'upcoming', label: 'Fixtures', icon: '⚽' },
  { key: 'results', label: 'Results', icon: '📊' },
  { key: 'standings', label: 'Standings', icon: '🏆' },
  { key: 'teams', label: 'Teams', icon: '🛡️' },
]

const SYMBOL_HEIGHT = 110

function EventSymbol({ event }) {
  const homeWin = event.hasResult && event.homeScore > event.awayScore
  const awayWin = event.hasResult && event.awayScore > event.homeScore
  return (
    <div className="reel-symbol sports-symbol" style={{ height: SYMBOL_HEIGHT }}>
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
    </div>
  )
}

function StandingsSymbol({ row }) {
  return (
    <div className="reel-symbol sports-symbol standings-symbol" style={{ height: SYMBOL_HEIGHT }}>
      <div className="standings-rank">#{row.rank}</div>
      <div className="standings-team">{row.team}</div>
      <div className="standings-stats">
        <span>{row.played}P</span>
        <span>{row.win}W</span>
        <span>{row.draw}D</span>
        <span>{row.loss}L</span>
      </div>
      <div className="standings-points">{row.points}pts</div>
    </div>
  )
}

function TeamSymbol({ team }) {
  return (
    <div className="reel-symbol sports-symbol team-symbol" style={{ height: SYMBOL_HEIGHT }}>
      {team.badge && <img src={team.badge} alt="" className="team-badge" />}
      <div className="team-symbol-name">{team.name}</div>
      <div className="team-symbol-league">{team.league}</div>
    </div>
  )
}

export default function SportsReelSpinner({ dashboard, standings, teams }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeCategory, setActiveCategory] = useState('today')
  const [spinningReels, setSpinningReels] = useState({})
  const [finalPositions, setFinalPositions] = useState({})
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
    const table = standings || []
    const allTeams = teams || leagues.flatMap(l =>
      (l.upcoming || []).concat(l.recent || []).reduce((acc, e) => {
        if (e.homeTeam && !acc.find(t => t.name === e.homeTeam)) acc.push({ name: e.homeTeam, league: e.league, badge: e.homeBadge })
        if (e.awayTeam && !acc.find(t => t.name === e.awayTeam)) acc.push({ name: e.awayTeam, league: e.league, badge: e.awayBadge })
        return acc
      }, [])
    )

    return {
      today: todayEvents,
      upcoming,
      results,
      standings: table,
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
    if (cat.key === 'standings') return <StandingsSymbol key={i} row={item} />
    if (cat.key === 'teams') return <TeamSymbol key={i} team={item} />
    return <EventSymbol key={i} event={item} />
  }

  return (
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
  )
}
