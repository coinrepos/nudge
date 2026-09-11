import React, { useState, useEffect, useRef, useMemo } from 'react'
import ResultCard from './ResultCard'
import '../styles/ReelSpinner.css'

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🔍' },
  { key: 'images', label: 'Images', icon: '🖼️' },
  { key: 'videos', label: 'Videos', icon: '🎬' },
  { key: 'news', label: 'News', icon: '📰' },
  { key: 'shopping', label: 'Shopping', icon: '🛒' },
]

// Uniform symbol height for ALL reels — sized so a card's content fits without clipping
const SYMBOL_HEIGHT = 118

// All-view: 5 reels x 5 rows = 25 results on ONE screen
const ALL_ROWS = 5

// Single-category view: a grid of up to 30 results on one screen
const GRID_PAGE_SIZE = 30

// === Search Result Detail Modal ===
function ResultModal({ result, onClose }) {
  if (!result) return null

  const handleVisit = () => {
    if (result.url) window.open(result.affiliateUrl || result.url, '_blank')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: result.title, url: result.url })
    } else {
      navigator.clipboard.writeText(result.url)
    }
  }

  return (
    <div className="sports-modal-overlay" onClick={onClose}>
      <div className="sports-modal" onClick={e => e.stopPropagation()}>
        <button className="sports-modal-close" onClick={onClose}>✕</button>

        <div className="sports-modal-league">{result.sourceDomain || result.source || 'Search Result'}</div>

        {result.thumbnail && (
          <img src={result.thumbnail} alt="" className="sports-modal-thumb" onError={(e) => { e.target.style.display = 'none' }} />
        )}

        <h2 className="result-modal-title">{result.title || 'Untitled'}</h2>

        {result.snippet && (
          <p className="result-modal-snippet">{result.snippet}</p>
        )}

        <div className="sports-modal-info">
          <div className="sports-modal-info-row">
            <span className="info-label">📊 Relevance</span>
            <span className="info-value">{((result.relevanceScore || 0) * 100).toFixed(0)}%</span>
          </div>
          {result.date && (
            <div className="sports-modal-info-row">
              <span className="info-label">📅 Date</span>
              <span className="info-value">{new Date(result.date).toLocaleDateString()}</span>
            </div>
          )}
          {result.isAffiliateEligible && (
            <div className="sports-modal-info-row affiliate-row">
              <span className="info-label">💰 Cashback</span>
              <span className="info-value">{result.cashbackRate}% Nudge Cash</span>
            </div>
          )}
          <div className="sports-modal-info-row">
            <span className="info-label">🔗 URL</span>
            <span className="info-value result-modal-url">{result.url?.substring(0, 50)}{(result.url?.length > 50) ? '...' : ''}</span>
          </div>
        </div>

        <div className="sports-modal-actions">
          <button className="sports-modal-action-btn" onClick={handleVisit}>
            🔗 Visit Site
          </button>
          <button className="sports-modal-action-btn secondary" onClick={handleShare}>
            📤 Share
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReelSpinner({
  reels,
  isWinning,
  onSpinComplete,
  resultMode,
  onResultModeChange,
  // Idle/live mode props
  idle = false,
  loading = false,
  loadingMessage = '',
  idleReels = null,
  onIdleSearch,
}) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [spinningReels, setSpinningReels] = useState({})
  const [finalPositions, setFinalPositions] = useState({})
  const [selectedResult, setSelectedResult] = useState(null)
  const [gridPage, setGridPage] = useState(0)
  const [coinWin, setCoinWin] = useState(null)
  const timersRef = useRef([])

  // Per-reel pagination: which page (start index) each reel is currently showing.
  const pageStartsRef = useRef({})

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  const visibleSymbols = ALL_ROWS

  // New search → reset every reel back to the first page + clear any coin win
  useEffect(() => {
    pageStartsRef.current = {}
    setFinalPositions({})
    setGridPage(0)
    setCoinWin(null)
  }, [reels])

  const displayedReels = useMemo(() => {
    if (!reels) return {}
    if (resultMode === 'random') {
      const shuffled = {}
      for (const [key, results] of Object.entries(reels)) {
        shuffled[key] = [...results].sort(() => Math.random() - 0.5)
      }
      return shuffled
    }
    return reels
  }, [reels, resultMode])

  // ================= IDLE / LIVE MODE =================
  // A living slot frame that drifts slowly, showing the latest sales + news,
  // and spins fast while a search is in flight. Every card is tappable —
  // tapping searches that item.
  if (idle) {
    return (
      <div className="slot-machine idle-mode">
        <div className="slot-reels">
          {CATEGORIES.map((cat, idx) => {
            const items = idleReels?.[cat.key] || []
            const doubled = [...items, ...items] // duplicate for a seamless drift loop
            return (
              <div className="slot-reel" key={cat.key}>
                <div className="reel-label">
                  <span>{cat.icon} {cat.label}</span>
                </div>
                <div className="reel-viewport" style={{ height: ALL_ROWS * SYMBOL_HEIGHT }}>
                  <div
                    className={`reel-track idle-track ${loading ? 'loading-spin' : (idx % 2 === 0 ? 'drift-down' : 'drift-up')}`}
                  >
                    {doubled.length > 0 ? doubled.map((item, i) => (
                      <div
                        className="reel-symbol idle-symbol clickable"
                        key={i}
                        style={{ height: SYMBOL_HEIGHT }}
                        onClick={() => !loading && onIdleSearch?.(item.q || item.title)}
                        title={`Search: ${item.q || item.title}`}
                      >
                        <span className="idle-icon">{item.icon}</span>
                        <span className="idle-title">{item.title}</span>
                        {item.tag && <span className="idle-tag">{item.tag}</span>}
                        <span className="idle-tap-hint">tap to search</span>
                      </div>
                    )) : (
                      <div className="reel-symbol idle-symbol" style={{ height: SYMBOL_HEIGHT }}>
                        <span className="idle-icon">{cat.icon}</span>
                        <span className="idle-title">Warming up…</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className={`idle-caption ${loading ? 'searching' : ''}`}>
          {loading
            ? `🎰 ${loadingMessage || 'Searching the web…'}`
            : 'Live from around the web — search to spin, or tap any card to search it'}
        </div>
      </div>
    )
  }

  // ================= RESULTS MODE =================
  // Advance a reel to its next sequential page
  const advanceReel = (catKey, reelLength) => {
    const current = pageStartsRef.current[catKey] || 0
    let next = current + visibleSymbols
    if (next >= reelLength) next = 0 // wrap back to the first entries
    pageStartsRef.current[catKey] = next
    return next
  }

  const getDisplayStart = (catKey) => {
    const pos = finalPositions[catKey] || 0
    return pos / SYMBOL_HEIGHT
  }

  const handleSpin = () => {
    if (isSpinning) return
    const hasResults = CATEGORIES.some(cat => {
      const reel = displayedReels[cat.key] || []
      return reel.length > 0
    })
    if (!hasResults) return

    setIsSpinning(true)
    setCoinWin(null)
    const spinning = {}
    CATEGORIES.forEach(cat => { spinning[cat.key] = true })
    setSpinningReels(spinning)

    const positions = {}

    CATEGORIES.forEach((cat, index) => {
      const reel = displayedReels[cat.key] || []
      const stopDelay = 900 + index * 200

      const timer = setTimeout(() => {
        let finalIndex = 0
        if (resultMode === 'random') {
          finalIndex = reel.length <= visibleSymbols
            ? 0
            : Math.floor(Math.random() * (reel.length - visibleSymbols + 1))
        } else {
          finalIndex = advanceReel(cat.key, reel.length)
        }
        positions[cat.key] = finalIndex * SYMBOL_HEIGHT
        setFinalPositions(prev => ({ ...prev, [cat.key]: finalIndex * SYMBOL_HEIGHT }))
        setSpinningReels(prev => ({ ...prev, [cat.key]: false }))
      }, stopDelay)
      timersRef.current.push(timer)
    })

    const totalDuration = 900 + (CATEGORIES.length - 1) * 200 + 400
    const completeTimer = setTimeout(() => {
      setIsSpinning(false)

      // === SPONSOR COIN WIN CHECK ===
      // Count the coin cards (cashback/sponsor results) visible on screen
      // across ALL five reels. Three or more = a sponsor win the user can claim.
      const visibleCards = []
      CATEGORIES.forEach(cat => {
        const reel = displayedReels[cat.key] || []
        const startIdx = (positions[cat.key] || 0) / SYMBOL_HEIGHT
        for (let i = startIdx; i < Math.min(startIdx + visibleSymbols, reel.length); i++) {
          visibleCards.push(reel[i])
        }
      })
      const coins = visibleCards.filter(c => c && c.isAffiliateEligible && (c.affiliateUrl || c.url))
      if (coins.length >= 3) {
        const merchants = [...new Set(coins.map(c => c.merchantName || c.merchant).filter(Boolean))]
        setCoinWin({
          count: coins.length,
          merchants,
          url: coins[0].affiliateUrl || coins[0].url,
        })
      }

      onSpinComplete?.()
    }, totalDuration)
    timersRef.current.push(completeTimer)
  }

  // Instant (non-animated) advance to the next batch of results
  const handleNext = () => {
    if (isSpinning) return
    const positions = {}
    CATEGORIES.forEach(cat => {
      const reel = displayedReels[cat.key] || []
      if (reel.length === 0) return
      const next = resultMode === 'random'
        ? (reel.length <= visibleSymbols ? 0 : Math.floor(Math.random() * (reel.length - visibleSymbols + 1)))
        : advanceReel(cat.key, reel.length)
      positions[cat.key] = next * SYMBOL_HEIGHT
    })
    setFinalPositions(prev => ({ ...prev, ...positions }))
  }

  const isEmpty = !reels || Object.values(reels).every(arr => !arr || arr.length === 0)

  if (isEmpty) {
    return null
  }

  const handleCategoryChange = (key) => {
    setActiveCategory(key)
    setGridPage(0)
  }

  // ---------- Shared controls (category buttons + mode toggle) ----------
  const controls = (
    <div className="reel-controls">
      <div className="category-buttons">
        {CATEGORIES.map(cat => {
          const count = (displayedReels[cat.key] || []).length
          return (
            <button
              key={cat.key}
              className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.key)}
            >
              {cat.icon} {cat.label}
              {count > 0 && <span className="cat-count">{count}</span>}
            </button>
          )
        })}
      </div>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${resultMode === 'top' ? 'active' : ''}`}
          onClick={() => onResultModeChange('top')}
        >Top Results</button>
        <button
          className={`mode-btn ${resultMode === 'random' ? 'active' : ''}`}
          onClick={() => onResultModeChange('random')}
        >🎲 Random</button>
      </div>
    </div>
  )

  // ================= SINGLE-CATEGORY GRID VIEW =================
  // One category fills the whole frame as a grid — 25-30 results on one screen.
  if (activeCategory !== 'all') {
    const cat = CATEGORIES.find(c => c.key === activeCategory)
    const reel = displayedReels[cat.key] || []
    const gridStart = gridPage * GRID_PAGE_SIZE
    const gridItems = reel.slice(gridStart, gridStart + GRID_PAGE_SIZE)
    const gridPages = Math.max(1, Math.ceil(reel.length / GRID_PAGE_SIZE))

    return (
      <>
        <div className="slot-machine">
          {controls}

          <div className="category-grid-header">
            <span className="grid-header-label">{cat.icon} {cat.label}</span>
            {reel.length > 0 && (
              <span className="reel-page-badge">
                {gridStart + 1}–{Math.min(gridStart + GRID_PAGE_SIZE, reel.length)} of {reel.length}
              </span>
            )}
          </div>

          {reel.length > 0 ? (
            <div className="category-grid">
              {gridItems.map((result, i) => (
                <div className="grid-cell" key={i}>
                  <ResultCard result={result} compact onOpenDetail={setSelectedResult} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-empty">No {cat.label.toLowerCase()} results for this search</div>
          )}

          <div className="spin-controls">
            <button
              onClick={() => setGridPage(p => (p + 1) % gridPages)}
              className="next-btn"
              title="Show the next batch of results"
            >
              Next ▶
            </button>
            <span className="grid-page-indicator">page {gridPage + 1} / {gridPages}</span>
          </div>

          <div className="how-it-works">
            <span>🎰 SPIN shows 25 results on one screen</span>
            <span>🪙 3 sponsor coins on screen = claim a reward</span>
            <span>👆 Tap any card to open it</span>
          </div>
        </div>

        {selectedResult && <ResultModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
      </>
    )
  }

  // ================= ALL-CATEGORIES SLOT VIEW =================
  return (
    <>
      <div className="slot-machine">
        {controls}

        <div className="slot-body">
          <div className="slot-reels">
            {CATEGORIES.map((cat) => {
              const reel = displayedReels[cat.key] || []
              const start = getDisplayStart(cat.key)
              const end = Math.min(start + visibleSymbols, reel.length)
              return (
                <div className="slot-reel" key={cat.key}>
                  <div className="reel-label">
                    <span>{cat.icon} {cat.label}</span>
                    {reel.length > 0 && (
                      <span className="reel-page-badge">
                        {start + 1}–{end} / {reel.length}
                      </span>
                    )}
                  </div>
                  <div
                    className="reel-viewport"
                    style={{ height: visibleSymbols * SYMBOL_HEIGHT }}
                  >
                    <div
                      className={`reel-track ${spinningReels[cat.key] ? 'spinning' : ''}`}
                      style={{
                        transform: spinningReels[cat.key]
                          ? undefined
                          : `translateY(-${finalPositions[cat.key] || 0}px)`,
                        transition: spinningReels[cat.key] ? 'none' : 'transform 0.5s ease-out',
                      }}
                    >
                      {reel.length > 0 ? (
                        reel.map((result, i) => (
                          <div className="reel-symbol" key={i} style={{ height: SYMBOL_HEIGHT }}>
                            <ResultCard
                              result={result}
                              compact
                              onOpenDetail={setSelectedResult}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="reel-symbol empty-symbol" style={{ height: SYMBOL_HEIGHT }}>
                          <span>No results</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Side rail: SPIN + Next right beside the reels for easy browsing */}
          <div className="spin-rail">
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`spin-btn ${isWinning ? 'winning' : ''}`}
            >
              {isSpinning ? '🎰 …' : '🎰 SPIN'}
            </button>
            <button
              onClick={handleNext}
              disabled={isSpinning}
              className="next-btn"
              title="Show the next batch of results"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* SPONSOR COIN WIN — 3+ cashback coins landed on one screen */}
        {coinWin && (
          <div className="coin-win-banner">
            <span className="coin-win-emoji">🪙🪙🪙</span>
            <div className="coin-win-body">
              <strong>{coinWin.count} SPONSOR COINS — YOU WON!</strong>
              <p>
                {coinWin.merchants.length > 0
                  ? `Claim your reward at ${coinWin.merchants[0]}${coinWin.merchants.length > 1 ? ' and partners' : ''}.`
                  : 'Claim your reward from the sponsor.'}
              </p>
            </div>
            <button className="coin-claim-btn" onClick={() => window.open(coinWin.url, '_blank')}>
              Claim Reward →
            </button>
          </div>
        )}

        {/* Backend relevance win — explained in plain language */}
        {!coinWin && isWinning && (
          <div className="winning-banner">🔥 All 5 reels aligned — top results! +3 credits</div>
        )}

        <div className="how-it-works">
          <span>🎰 SPIN shows 25 results on one screen</span>
          <span>🪙 3 sponsor coins on screen = claim a reward</span>
          <span>👆 Tap any card to open it</span>
        </div>
      </div>

      {/* Result detail modal */}
      {selectedResult && <ResultModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
    </>
  )
}
