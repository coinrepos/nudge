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

const SYMBOL_HEIGHT = 110
const THUMB_SYMBOL_HEIGHT = 190  // Taller for cards with thumbnails (image/video/shopping/news)

function getReelHeight(catKey, reel) {
  if (!reel || reel.length === 0) return SYMBOL_HEIGHT
  const hasThumbs = reel.some(r => r.thumbnail)
  return hasThumbs ? THUMB_SYMBOL_HEIGHT : SYMBOL_HEIGHT
}

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

export default function ReelSpinner({ reels, isWinning, onSpinComplete, resultMode, onResultModeChange }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [spinningReels, setSpinningReels] = useState({})
  const [finalPositions, setFinalPositions] = useState({})
  const [selectedResult, setSelectedResult] = useState(null)
  const timersRef = useRef([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  const visibleCats = activeCategory === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.key === activeCategory)

  const visibleSymbols = activeCategory === 'all' ? 3 : 5

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

  const handleSpin = () => {
    if (isSpinning) return
    const hasResults = visibleCats.some(cat => {
      const reel = displayedReels[cat.key] || []
      return reel.length > 0
    })
    if (!hasResults) return

    setIsSpinning(true)
    const spinning = {}
    const positions = {}
    visibleCats.forEach(cat => {
      spinning[cat.key] = true
      positions[cat.key] = 0
    })
    setSpinningReels(spinning)
    setFinalPositions(positions)

    visibleCats.forEach((cat, index) => {
      const reel = displayedReels[cat.key] || []
      const stopDelay = 1200 + index * 250

      const timer = setTimeout(() => {
        const reelHeight = getReelHeight(cat.key, reel)
        const finalIndex = reel.length <= visibleSymbols
          ? 0
          : Math.floor(Math.random() * (reel.length - visibleSymbols + 1))
        setFinalPositions(prev => ({ ...prev, [cat.key]: finalIndex * reelHeight }))
        setSpinningReels(prev => ({ ...prev, [cat.key]: false }))
      }, stopDelay)
      timersRef.current.push(timer)
    })

    const totalDuration = 1200 + (visibleCats.length - 1) * 250 + 500
    const completeTimer = setTimeout(() => {
      setIsSpinning(false)
      onSpinComplete?.()
    }, totalDuration)
    timersRef.current.push(completeTimer)
  }

  const isEmpty = !reels || Object.values(reels).every(arr => !arr || arr.length === 0)

  if (isEmpty) {
    return null
  }

  return (
    <>
      <div className="slot-machine">
        {/* Category buttons + mode toggle */}
        <div className="reel-controls">
          <div className="category-buttons">
            {CATEGORIES.map(cat => {
              const count = (displayedReels[cat.key] || []).length
              return (
                <button
                  key={cat.key}
                  className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
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

        {/* Reels */}
        <div className="slot-reels">
          {visibleCats.map((cat) => {
            const reel = displayedReels[cat.key] || []
            return (
              <div className="slot-reel" key={cat.key}>
                <div className="reel-label">{cat.icon} {cat.label}</div>
                <div
                  className="reel-viewport"
                  style={{ height: visibleSymbols * getReelHeight(cat.key, reel) }}
                >
                  <div
                    className={`reel-track ${spinningReels[cat.key] ? 'spinning' : ''} ${reel.some(r => r.thumbnail) ? 'thumb-reel' : ''}`}
                    style={{
                      transform: spinningReels[cat.key]
                        ? undefined
                        : `translateY(-${finalPositions[cat.key] || 0}px)`,
                      transition: spinningReels[cat.key] ? 'none' : 'transform 0.5s ease-out',
                    }}
                  >
                    {reel.length > 0 ? (
                      reel.map((result, i) => (
                        <div className="reel-symbol" key={i} style={{ height: reel.some(r => r.thumbnail) ? THUMB_SYMBOL_HEIGHT : SYMBOL_HEIGHT }}>
                          <ResultCard
                            result={result}
                            compact
                            onOpenDetail={setSelectedResult}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="reel-symbol empty-symbol" style={{ height: reel.some(r => r.thumbnail) ? THUMB_SYMBOL_HEIGHT : SYMBOL_HEIGHT }}>
                        <span>No results</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`spin-btn ${isWinning ? 'winning' : ''}`}
        >
          {isSpinning ? '🎰 Spinning...' : '🎰 SPIN'}
        </button>

        {isWinning && (
          <div className="winning-banner">🎉 WINNING COMBINATION! +3 Credits</div>
        )}
      </div>

      {/* Result detail modal */}
      {selectedResult && <ResultModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
    </>
  )
}
