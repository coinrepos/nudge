import React from 'react'
import '../styles/SportsPage.css'

export default function SportsInfoCard({ sportsData }) {
  if (!sportsData || !sportsData.matched) return null

  return (
    <div className="sports-info-card">
      <div className="sports-info-header">
        <span className="sports-info-icon">🏟️</span>
        <div>
          <h3 className="sports-info-title">Sports Results</h3>
          <p className="sports-info-subtitle">
            Detected: {sportsData.query} ({sportsData.type})
          </p>
        </div>
      </div>

      {sportsData.leagues.map((league, i) => (
        <div key={league.leagueId || i} className="sports-info-league">
          <p className="sports-info-league-name">{league.league}</p>

          {league.recent.length > 0 && (
            <>
              <p className="sports-info-section-label">Recent Results</p>
              {league.recent.map(e => (
                <div key={e.id} className="sports-info-event">
                  <span className="sio-teams">{e.homeTeam} vs {e.awayTeam}</span>
                  <span className="sio-score">{e.score}</span>
                  <span className="sio-date">{e.date}</span>
                </div>
              ))}
            </>
          )}

          {league.upcoming.length > 0 && (
            <>
              <p className="sports-info-section-label">Upcoming Fixtures</p>
              {league.upcoming.map(e => (
                <div key={e.id} className="sports-info-event">
                  <span className="sio-teams">{e.homeTeam} vs {e.awayTeam}</span>
                  <span className="sio-date">{e.date}{e.time ? ` ${e.time.slice(0, 5)}` : ''}</span>
                </div>
              ))}
            </>
          )}
        </div>
      ))}

      <a href="/sports" className="sports-info-link">View full Sports Hub →</a>
    </div>
  )
}
