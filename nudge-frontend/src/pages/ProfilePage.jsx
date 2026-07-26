import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import useCredits from '../hooks/useCredits'
import '../styles/ProfilePage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ProfilePage() {
  const { user, accessToken } = useContext(AuthContext)
  const { stats, fetchStats, balance, fetchBalance } = useCredits(accessToken)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (accessToken) {
      fetchStats()
      fetchBalance()
      fetchHistory()
    }
  }, [accessToken, fetchStats, fetchBalance])

  async function fetchHistory() {
    try {
      const response = await axios.get(`${API_URL}/search/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setHistory(response.data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>{user.username}</h1>
        <p className="profile-email">{user.email}</p>

        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>⭐ Total Credits</h3>
            <p className="stat-value">{balance || user.socialCredits || 0}</p>
          </div>

          {stats && (
            <>
              <div className="stat-card">
                <h3>🎰 Total Spins</h3>
                <p className="stat-value">{stats.totalSpins}</p>
              </div>

              <div className="stat-card">
                <h3>🎉 Winning Spins</h3>
                <p className="stat-value">{stats.winningSpins}</p>
              </div>

              <div className="stat-card">
                <h3>📊 Win Rate</h3>
                <p className="stat-value">{stats.winRate}%</p>
              </div>

              {stats.streak > 0 && (
                <div className="stat-card streak-card">
                  <h3>🔥 Day Streak</h3>
                  <p className="stat-value">{stats.streak}</p>
                  {stats.streak >= 7 && <p className="streak-bonus-label">+{stats.streak >= 30 ? 2 : 1} bonus per spin</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Search history */}
        {history.length > 0 && (
          <div className="history-section">
            <h2>Recent Searches</h2>
            <div className="history-list">
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <span className="history-query">{h.query}</span>
                  <div className="history-meta">
                    <span className="history-date">{new Date(h.created_at).toLocaleDateString()}</span>
                    {h.is_winning && <span className="history-win">🎉</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
