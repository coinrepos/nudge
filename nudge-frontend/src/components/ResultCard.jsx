import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/ResultCard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ResultCard({ result, compact, onOpenDetail }) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { accessToken } = useContext(AuthContext)

  const trackAffiliateClick = async () => {
    if (!accessToken || !result.affiliateUrl || !result.isAffiliateEligible) return

    try {
      await fetch(`${API_URL}/nudge-cash/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          originalUrl: result.url,
          affiliateUrl: result.affiliateUrl,
          merchant: result.merchant || result.sourceDomain,
          searchQuery: result.searchQuery || '',
        }),
      })
    } catch (err) {
      // Silent fail — don't block the click
    }
  }

  const handleVisit = (e) => {
    if (e) e.stopPropagation()
    if (result.url) {
      trackAffiliateClick()
      window.open(result.affiliateUrl || result.url, '_blank')
    }
  }

  const handleCardClick = () => {
    if (compact && onOpenDetail) {
      onOpenDetail(result)
    } else if (result.url) {
      trackAffiliateClick()
      window.open(result.affiliateUrl || result.url, '_blank')
    }
  }

  const handleShare = (e) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({ title: result.title, url: result.url })
    } else {
      navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Determine if this card should show a large thumbnail
  const hasThumbnail = result.thumbnail && !imgError
  const isImage = result.type === 'image'
  const isVideo = result.type === 'video'
  const isNews = result.type === 'news'
  const isShopping = result.type === 'shopping'
  const showLargeThumb = hasThumbnail && (isImage || isVideo || isShopping || isNews)

  if (compact) {
    const sourceName = isNews
      ? (result.source || result.sourceDomain || 'News')
      : (result.sourceDomain || result.source || 'Unknown')
    const authors = isNews && result.authors && result.authors.length > 0 ? result.authors.join(', ') : null

    return (
      <div className="result-card compact clickable" onClick={handleCardClick} title="Click for details">
        {/* Large thumbnail for image/video/shopping/news results */}
        {showLargeThumb && (
          <div className="compact-thumb-wrapper">
            <img
              src={result.thumbnail}
              alt=""
              className="compact-thumb"
              onError={() => setImgError(true)}
              loading="lazy"
            />
            {isVideo && <span className="compact-video-duration">▶</span>}
            {isImage && <span className="compact-type-badge">🖼️</span>}
            {isShopping && result.price && <span className="compact-price-tag">{result.price}</span>}
          </div>
        )}

        {isNews && !showLargeThumb && <span className="news-type-badge">📰 News</span>}
        {isVideo && !showLargeThumb && <span className="news-type-badge">🎬 Video</span>}

        <h3 className="result-title">{result.title || 'Untitled'}</h3>

        {isNews && authors && <span className="news-author">by {authors}</span>}

        <div className="compact-footer">
          <span className="result-source">{sourceName}</span>
          <div className="compact-actions">
            {result.date && (
              <span className="compact-date">
                {new Date(result.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span className="result-relevance">{((result.relevanceScore || 0) * 100).toFixed(0)}%</span>
            {result.isAffiliateEligible && (
              <span className="cashback-badge" title={`${result.cashbackRate}% cashback available`}>
                💰 {result.cashbackRate}%
              </span>
            )}
            <button className="share-btn compact-share" onClick={handleShare} title="Share">
              {copied ? '✓' : '📤'}
            </button>
          </div>
        </div>
        <span className="reel-symbol-click-hint">tap →</span>
      </div>
    )
  }

  return (
    <div className="result-card" onClick={handleCardClick}>
      {/* Large thumbnail at the top for image/video/shopping/news */}
      {showLargeThumb && (
        <img
          src={result.thumbnail}
          alt=""
          className="result-thumbnail-large"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}

      <div className="result-header">
        <h3 className="result-title">{result.title || 'Untitled'}</h3>
        <span className="result-source">{result.source || result.sourceDomain || 'Unknown'}</span>
      </div>

      <p className="result-snippet">
        {result.snippet || 'No description available'}
      </p>

      <div className="result-footer">
        <span className="result-relevance">
          Relevance: {((result.relevanceScore || 0) * 100).toFixed(0)}%
        </span>
        {result.date && (
          <span className="result-date">{new Date(result.date).toLocaleDateString()}</span>
        )}
        {isShopping && result.price && (
          <span className="cashback-badge">{result.price}</span>
        )}
        {result.isAffiliateEligible && (
          <span className="cashback-badge" title="Earn Nudge Cash on this purchase">
            💰 {result.cashbackRate}% Cashback
          </span>
        )}
      </div>

      <div className="result-links">
        <a
          href={result.affiliateUrl || result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="result-url"
          onClick={(e) => {
            e.stopPropagation()
            trackAffiliateClick()
          }}
        >
          {result.url?.substring(0, 40)}...
        </a>
        <button className="share-btn" onClick={handleShare} title="Share result">
          {copied ? '✓ Copied!' : '📤 Share'}
        </button>
      </div>
    </div>
  )
}
