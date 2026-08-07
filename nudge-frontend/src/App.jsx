import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'  // Keep main page eager (critical path)
import './styles/App.css'

// Lazy-load all secondary pages — keeps initial bundle small
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const NudgeCashPage = lazy(() => import('./pages/NudgeCashPage'))
const SportsPage = lazy(() => import('./pages/SportsPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
    <div className="spinner" />
  </div>
)

// Protected route wrapper — redirects to auth if not logged in
const ProtectedRoute = ({ user, children }) => {
  return user ? children : <Navigate to="/auth" replace />
}

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={<ProtectedRoute user={auth.user}><ProfilePage /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute user={auth.user}><LeaderboardPage /></ProtectedRoute>} />
                <Route path="/nudge-cash" element={<ProtectedRoute user={auth.user}><NudgeCashPage /></ProtectedRoute>} />
                <Route path="/sports" element={<ProtectedRoute user={auth.user}><SportsPage /></ProtectedRoute>} />
                <Route path="/shopping" element={<ProtectedRoute user={auth.user}><ShoppingPage /></ProtectedRoute>} />
                <Route path="/terms" element={<TermsPage />} />
              </Routes>
            </Suspense>
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
