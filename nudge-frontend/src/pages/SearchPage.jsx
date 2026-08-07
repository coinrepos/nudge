import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import SearchBar from '../components/SearchBar'
import ReelSpinner from '../components/ReelSpinner'
import SuperNudge from '../components/SuperNudge'
import useSearch from '../hooks/useSearch'
import useCredits from '../hooks/useCredits'
import '../styles/SearchPage.css'
import AffiliateDisclosure from '../components/AffiliateDisclosure'
import SportsInfoCard from '../components/SportsInfoCard'
import TrendingNews from '../components/TrendingNews'

export default function SearchPage() {
  const { user, accessToken } = useContext(AuthContext)
  const { search, results, reels, loading, error, trending } = useSearch(accessToken)
  const { recordSpin, fetchBalance } = useCredits(accessToken)

  const [superNudgeActive, setSuperNudgeActive] = useState(false)
  const [keywords, setKeywords] = useState([])
  const [resultMode, setResultMode] = useState('top')
  const [streakBonus, setStreakBonus] = useState(null)

  useEffect(() => {
    if (accessToken) fetchBalance()
  }, [accessToken, fetchBalance])

  const handleSearch = (query) => {
    search(query, superNudgeActive ? keywords : [])
  }

  const addKeyword = (kw) => setKeywords([...keywords, kw])
  const removeKeyword = (i) => setKeywords(keywords.filter((_, idx) => idx !== i))

  const handleSpinComplete = async () => {
    if (results) {
      const spinResult = await recordSpin(results.isWinning)
      if (spinResult?.newBalance !== undefined) fetchBalance()
      if (spinResult?.streakBonus) {
        setStreakBonus(spinResult.streakBonus)
        setTimeout(() => setStreakBonus(null), 3000)
      }
    }
  }

  return (
    <div className="search-page">
      <div className="search-container">
        <h1 className="search-title">{user ? 'NudgeMe' : 'Nudge'}</h1>
        <p className="subtitle">Spin to discover. Explore to earn.</p>

        <SearchBar onSearch={handleSearch} loading={loading} />

        <SuperNudge
          active={superNudgeActive}
          onToggle={() => setSuperNudgeActive(!superNudgeActive)}
          keywords={keywords}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
        />

        {/* Streak bonus notification */}
        {streakBonus && (
          <div className="streak-bonus">
            🔥 Streak bonus! +{streakBonus} extra credit{streakBonus > 1 ? 's' : ''}!
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Searching the web...</p>
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="error-message">{error}</div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            <div className="results-info">
              Found <strong>{results.totalResults}</strong> results for "{results.query}"
              {results.enhancedQuery && (
                <span className="enhanced-query"> (SuperNudge: {results.enhancedQuery})</span>
              )}
              {results.isWinning && (
                <span className="winning-indicator">🎉 WINNING!</span>
              )}
            </div>

              <AffiliateDisclosure variant="compact" />
              {results?.sportsData && <SportsInfoCard sportsData={results.sportsData} />}

            <ReelSpinner
              reels={reels}
              isWinning={results.isWinning}
              onSpinComplete={handleSpinComplete}
              resultMode={resultMode}
              onResultModeChange={setResultMode}
            />
          </>
        )}

        {/* Empty state with trending */}
        {!results && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon">🎰</div>
            <p>Enter a search query and spin the reels to discover results across All, Images, Videos, News, and Shopping</p>
            {trending.length > 0 && (
              <div className="trending-searches">
                <p className="trending-label">🔥 Trending now</p>
                <div className="trending-chips">
                  {trending.map((t, i) => (
                    <button
                      key={i}
                      className="trending-chip"
                      onClick={() => handleSearch(t.query)}
                    >
                      {t.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <TrendingNews onSearch={handleSearch} />
          </div>
        )}

        {/* Sign-up prompt */}
        {!user && results && !loading && (
          <div className="signup-prompt">
            <p>Create an account to save your credits and compete on leaderboards!</p>
          </div>
        )}
      </div>
    </div>
  )
}
