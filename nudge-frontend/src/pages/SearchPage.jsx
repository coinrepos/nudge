import React, { useContext, useEffect } from 'react'
import { AuthContext } from '../context/AuthContext'
import SearchBar from '../components/SearchBar'
import ReelSpinner from '../components/ReelSpinner'
import useSearch from '../hooks/useSearch'
import useCredits from '../hooks/useCredits'
import '../styles/SearchPage.css'

export default function SearchPage() {
  const { user, accessToken } = useContext(AuthContext)
  const { search, results, reels, loading, error } = useSearch(accessToken)
  const { recordSpin, fetchBalance } = useCredits(accessToken)

  useEffect(() => { if (accessToken) fetchBalance() }, [accessToken, fetchBalance])

  const handleSpinComplete = async () => {
    if (results) {
      const spinResult = await recordSpin(results.isWinning)
      if (spinResult?.newBalance !== undefined) fetchBalance()
    }
  }

  return (
    <div className="search-page">
      <div className="search-container">
        <h1>🎰 Nudge Search</h1>
        <p className="subtitle">Spin to discover. Explore to earn.</p>
        <SearchBar onSearch={search} loading={loading} />
        {error && <div className="error-message">{error}</div>}
        {results && (
          <>
            <div className="results-info">
              Found <strong>{results.totalResults}</strong> results for "{results.query}"
              {results.isWinning && <span className="winning-indicator">🎉 WINNING COMBINATION!</span>}
            </div>
            <ReelSpinner reels={reels} isWinning={results.isWinning} onSpinComplete={handleSpinComplete} />
          </>
        )}
        {!user && results && (
          <div className="signup-prompt">
            <p>📱 Create an account to save your credits and compete on leaderboards!</p>
          </div>
        )}
      </div>
    </div>
  )
}
