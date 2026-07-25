import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/LeaderboardPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchLeaderboard() }, [])

  async function fetchLeaderboard() {
    try {
      const response = await axios.get(`${API_URL}/leaderboard/top`)
      setTopUsers(response.data)
    } catch (err) { setError('Failed to load leaderboard') }
    finally { setLoading(false) }
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1>🏆 Leaderboard</h1>
        {loading ? <p>Loading...</p> : error ? <p className="leaderboard-error">{error}</p> : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr><th>Rank</th><th>Username</th><th>⭐ Credits</th><th>🎰 Spins</th><th>🎉 Wins</th></tr>
              </thead>
              <tbody>
                {topUsers.map((user, index) => (
                  <tr key={index} className={index < 3 ? 'top-rank' : ''}>
                    <td className="rank">{index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index + 1}</td>
                    <td className="username">{user.username}</td>
                    <td className="credits">{user.social_credits}</td>
                    <td className="spins">{user.total_spins || 0}</td>
                    <td className="wins">{user.winning_spins || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
