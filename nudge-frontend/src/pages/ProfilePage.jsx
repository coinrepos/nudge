import React, { useContext, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import useCredits from '../hooks/useCredits'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
  const { user, accessToken } = useContext(AuthContext)
  const { stats, fetchStats, balance, fetchBalance } = useCredits(accessToken)

  useEffect(() => {
    if (accessToken) { fetchStats(); fetchBalance() }
  }, [accessToken, fetchStats, fetchBalance])

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>{user.username}</h1>
        <p className="profile-email">{user.email}</p>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>⭐ Total Credits</h3>
            <p className="stat-value">{balance || user.socialCredits || 0}</p>
          </div>
          {stats && (
            <>
              <div className="stat-card"><h3>🎰 Total Spins</h3><p className="stat-value">{stats.totalSpins}</p></div>
              <div className="stat-card"><h3>🎉 Winning Spins</h3><p className="stat-value">{stats.winningSpins}</p></div>
              <div className="stat-card"><h3>📊 Win Rate</h3><p className="stat-value">{stats.winRate}%</p></div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
