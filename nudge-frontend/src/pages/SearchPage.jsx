import React, { useContext, useEffect, useMemo, useState } from 'react'
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Rotating status messages keep the user engaged while the search runs
const LOADING_MESSAGES = [
  'Searching the web…',
  'Spinning up the reels…',
  'Rounding up the freshest results…',
  'Checking live prices and deals…',
  'Digging through the latest news…',
  'Polishing your results…',
  'Almost there — lining up the reels…',
]

// Static teasers for the idle Shopping reel
const SALE_TEASERS = [
  { icon: '🔥', title: 'Flash sales — up to 70% off', tag: 'Today only', q: 'flash sales today' },
  { icon: '💰', title: 'Earn Nudge Cash on shopping', tag: 'Cashback', q: 'best cashback deals' },
  { icon: '🆓', title: 'Free shipping deals inside', tag: 'Free', q: 'free shipping deals' },
  { icon: '🏷️', title: 'Big brand clearance live now', tag: 'Sale', q: 'clearance sale' },
  { icon: '⚡', title: 'New drops land every hour', tag: 'Fresh', q: 'new arrivals' },
  { icon: '🎁', title: 'Bonus cashback on the Shopping reel', tag: 'Cashback', q: 'cashback offers' },
]

export default function SearchPage() {
  const { user, accessToken } = useContext(AuthContext)
  const { search, results, reels, loading, error, trending } = useSearch(accessToken)
  const { recordSpin, fetchBalance } = useCredits(accessToken)

  const [superNudgeActive, setSuperNudgeActive] = useState(false)
  const [keywords, setKeywords] = useState([])
  const [resultMode, setResultMode] = useState('top')
  const [streakBonus, setStreakBonus] = useState(null)

  // Rotating loading message
  const [msgIdx, setMsgIdx] = useState(0)
  useEffect(() => {
    if (!loading) { setMsgIdx(0); return }
    const iv = setInterval(() => {
      setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length)
    }, 1600)
    return () => clearInterval(iv)
  }, [loading])

  // Latest headlines for the idle News reel
  const [newsItems, setNewsItems] = useState([])
  useEffect(() => {
    fetch(`${API_URL}/search/trending-news`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setNewsItems(d.slice(0, 8)) })
      .catch(() => {})
  }, [])

  // Idle reel content — trending searches, latest headlines, and sale teasers
  const idleReels = useMemo(() => {
    const trendCards = trending.map(t => ({ icon: '📈', title: t.query, tag: 'Trending' }))
    const newsCards = newsItems.map(n => ({ icon: '📰', title: n.title, tag: n.source || 'News' }))
    return {
      all: [...(trendCards.slice(0, 4)), ...(newsCards.slice(0, 4)), ...SALE_TEASERS.slice(0, 2)],
      images: trendCards.slice(4, 10).length > 0 ? trendCards.slice(4, 10) : SALE_TEASERS.slice(0, 4),
      videos: trendCards.slice(0, 6),
      news: newsCards.length > 0 ? newsCards : [{ icon: '📰', title: 'Loading the latest headlines…', tag: 'News' }],
      shopping: SALE_TEASERS,
    }
  }, [trending, newsItems])

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
        <div className="search-header-row">
          <h1 className="search-title">{user ? 'NudgeMe' : 'Nudge'}</h1>
          <p className="subtitle">Spin to discover. Explore to earn.</p>
        </div>

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

        {/* Error message */}
        {error && !loading && (
          <div className="error-message">{error}</div>
        )}

        {/* Compact results info line — kept slim so the slot sits high on the page */}
        {results && !loading && (
          <div className="results-info compact-info">
            <strong>{results.totalResults}</strong> results for "{results.query}"
            {results.isWinning && <span className="winning-indicator">🎉 WINNING!</span>}
          </div>
        )}

        {/* ===== THE SLOT MACHINE — right under the search bar ===== */}
        {loading || !results ? (
          // Idle/live frame: drifts with latest sales + news, spins fast during search
          !error && (
            <ReelSpinner
              idle
              loading={loading}
              loadingMessage={LOADING_MESSAGES[msgIdx]}
              idleReels={idleReels}
              onIdleSearch={handleSearch}
            />
          )
        ) : (
          <ReelSpinner
            reels={reels}
            isWinning={results.isWinning}
            onSpinComplete={handleSpinComplete}
            resultMode={resultMode}
            onResultModeChange={setResultMode}
          />
        )}

        {/* Everything else sits BELOW the reels */}
        {results && !loading && (
          <>
            {results.enhancedQuery && (
              <div className="results-info enhanced-only">
                SuperNudge: {results.enhancedQuery}
              </div>
            )}
            {results?.sportsData && <SportsInfoCard sportsData={results.sportsData} />}
            <AffiliateDisclosure variant="compact" />
            {!user && (
              <div className="signup-prompt">
                <p>Create an account to save your credits and compete on leaderboards!</p>
              </div>
            )}
          </>
        )}

        {/* Trending chips + news below the idle frame */}
        {!results && !loading && !error && (
          <div className="empty-state below-frame">
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
      </div>
    </div>
  )
}
