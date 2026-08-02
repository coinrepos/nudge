import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import NudgeCashPage from './pages/NudgeCashPage'
import SportsPage from './pages/SportsPage'
import TermsPage from './pages/TermsPage'
import './styles/App.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      <Router>
        <ErrorBoundary>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={auth.user ? <ProfilePage /> : <AuthPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/nudge-cash" element={auth.user ? <NudgeCashPage /> : <AuthPage />} />
              <Route path="/sports" element={<SportsPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>Nudge — Spin to discover. Explore to earn.</p>
            <p className="footer-note">Social credits are purely cosmetic. Nudge Cash is real cashback from shopping. No dark patterns.</p>
            <p className="footer-disclosure">
              Nudge participates in affiliate programs including Amazon Associates and Skimlinks. When you shop through links on the Shopping reel, we may earn a commission at no extra cost to you. This does not influence search results. <a href="/terms">Full disclosure &amp; Terms →</a>
            </p>
            <div className="footer-legal-links">
              <a href="/terms">Terms &amp; Conditions</a>
              <a href="/terms">Affiliate Disclosure</a>
              <a href="/terms">Privacy</a>
            </div>
          </footer>
        </ErrorBoundary>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
