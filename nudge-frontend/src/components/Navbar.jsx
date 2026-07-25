import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CreditDisplay from './CreditDisplay'
import '../styles/Navbar.css'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">🎰 Nudge</Link>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Search</Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
          {user ? (
            <>
              <CreditDisplay credits={user.socialCredits} />
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
