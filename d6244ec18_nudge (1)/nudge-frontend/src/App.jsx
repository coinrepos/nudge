import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import Navbar from './components/Navbar'
import SearchPage from './pages/SearchPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import './styles/App.css'

function App() {
  const auth = useAuth()
  return (
    <AuthContext.Provider value={auth}>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={auth.user ? <ProfilePage /> : <AuthPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
