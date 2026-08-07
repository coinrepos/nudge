import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/ResultCard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ResultCard({ result, compact, onOpenDetail }) {
  const [copied, setCopied] = useState(false)
  const { accessToken } = useContext(AuthContext)

  const trackAffiliateClick = async () => {
    if (!accessToken || !result.affiliateUrl || !result.isAffiliateEligible) return

    try {
      await fetch(`${API_URL}/nudge-cash/track-click`, {
        method: 'Content-Type',
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

  // In compact mode (reels), clicking opens the detail modal instead of visiting
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

  if (compact) {
    const isNews = result.type === 'news'
    const sourceName = isNews ? (result.source || result.sourceDomain || 'News') : (result.sourceDomain || result.source || 'Unknown')
    const sourceIcon = isNews && result.thumbnail ? result.thumbnail : null
    const authors = isNews && result.authors && result.authors.length > 0 ? result.authors.join(', ') : null

    return (
      <div className="result-card compact clickable" onClick={handleCardClick} title="Click for details">
        {sourceIcon && (
          <div className="news-source-icon">
            <img src={sourceIcon} alt="" onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {isNews && <span className="news-type-badge">📰 News</span>}
        <h3 className="result-title">{result.title || 'Untitled'}</h3>
        {isNews && authors && <span className="news-author">by {authors}</span>}
        <div className="compact-footer">
          <span className="result-source">{sourceName}</span>
          <div className="compact-actions">
            {result.date && (
              <span className="compact-date">{new Date(result.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
      <div className="result-header">
        {result.type === 'news' && result.thumbnail && (
          <img src={result.thumbnail} alt="" className="news-thumbnail" onError={(e) => { e.target.style.display = 'none' }} />
        )}
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
