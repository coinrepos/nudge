import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CreditDisplay from './CreditDisplay'
import NudgeCashDisplay from './NudgeCashDisplay'
import '../styles/Navbar.css'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const letters = user ? ['N', 'u', 'd', 'g', 'e', 'M', 'e'] : ['N', 'U', 'D', 'G', 'E']

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="nudge-logo">
          {letters.map((letter, i) => (
            <span className="logo-reel" key={i}>{letter}</span>
          ))}
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">Search</Link>

          {/* Leaderboard only visible when logged in */}
          {user && (
            <>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              <Link to="/nudge-cash" className="nav-link">Nudge Cash</Link>
            </>
          )}

          {user ? (
            <>
              <CreditDisplay credits={user.socialCredits} />
              <NudgeCashDisplay />
              <Link to="/profile" className="nav-link">{user.username}</Link>
              <button onClick={handleLogout} className="nav-btn logout">Logout</button>
            </>
          ) : (
            <Link to="/auth" className="nav-btn login">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
