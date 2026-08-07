import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import ResultCard from '../components/ResultCard'
import AffiliateDisclosure from '../components/AffiliateDisclosure'
import useSearch from '../hooks/useSearch'
import '../styles/ShoppingPage.css'

const TRENDING_SHOPPING = [
  'best wireless headphones 2026',
  'gaming laptop deals',
  'smart home devices',
  'running shoes',
  'iphone 17 case',
  'air fryer deals',
  'mechanical keyboard',
  'fitness tracker',
]

export default function ShoppingPage() {
  const { accessToken, user } = useContext(AuthContext)
  const { search, reels, loading, error, lastQuery } = useSearch(accessToken)
  const [query, setQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState(null)

  const handleSearch = (e) => {
    e?.preventDefault()
    if (query.trim()) search(query)
  }

  const handleTrendingClick = (q) => {
    setQuery(q)
    search(q)
  }

  const shoppingResults = reels.shopping || []
  const allResults = reels.all || []

  // Combine shopping + organic results that have affiliate eligibility
  const combinedResults = [
    ...shoppingResults,
    ...allResults.filter(r => r.isAffiliateEligible && !shoppingResults.find(s => s.url === r.url)),
  ]

  return (
    <div className="shopping-page">
      <div className="shopping-container">
        <h1 className="shopping-title">🛒 Shopping</h1>
        <p className="shopping-subtitle">Search for products and earn Nudge Cash on every purchase</p>

        <form className="shopping-search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : '🛍️ Search'}
          </button>
        </form>

        {/* Trending shopping chips */}
        {!lastQuery && !loading && (
          <div className="shopping-trending">
            <h3>🔥 Popular searches</h3>
            <div className="trending-chips">
              {TRENDING_SHOPPING.map(q => (
                <button key={q} className="trending-chip" onClick={() => handleTrendingClick(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="shopping-loading">
            <div className="spinner" />
            <p>Searching for the best deals...</p>
          </div>
        )}

        {/* Error */}
        {error && <div className="shopping-error">{error}</div>}

        {/* Results */}
        {!loading && lastQuery && (
          <>
            <div className="shopping-results-header">
              <h2>Results for "{lastQuery}"</h2>
              <span className="results-count">{combinedResults.length} products found</span>
            </div>

            {combinedResults.length > 0 ? (
              <>
                <div className="shopping-grid">
                  {combinedResults.map((result, i) => (
                    <div className="shopping-card-wrapper" key={i}>
                      <ResultCard result={result} onOpenDetail={setSelectedResult} />
                    </div>
                  ))}
                </div>
                <AffiliateDisclosure />
              </>
            ) : (
              <div className="shopping-empty">
                <p>No shopping results found for "{lastQuery}".</p>
                <p>Try a more specific product search, or check back as more merchants are added.</p>
              </div>
            )}
          </>
        )}

        {/* Detail modal */}
        {selectedResult && (
          <div className="shopping-modal-overlay" onClick={() => setSelectedResult(null)}>
            <div className="shopping-modal" onClick={e => e.stopPropagation()}>
              <button className="shopping-modal-close" onClick={() => setSelectedResult(null)}>✕</button>
              {selectedResult.thumbnail && (
                <img src={selectedResult.thumbnail} alt="" className="shopping-modal-thumb"
                  onError={(e) => { e.target.style.display = 'none' }} />
              )}
              <div className="shopping-modal-source">
                {selectedResult.sourceDomain || selectedResult.source || 'Shopping'}
              </div>
              <h2 className="shopping-modal-title">{selectedResult.title}</h2>
              {selectedResult.snippet && (
                <p className="shopping-modal-snippet">{selectedResult.snippet}</p>
              )}
              {selectedResult.price && (
                <div className="shopping-modal-price">{selectedResult.price}</div>
              )}
              {selectedResult.isAffiliateEligible && (
                <div className="shopping-modal-cashback">
                  💰 {selectedResult.cashbackRate}% Nudge Cash
                </div>
              )}
              <div className="shopping-modal-actions">
                <a href={selectedResult.affiliateUrl || selectedResult.url}
                  target="_blank" rel="noopener noreferrer" className="shopping-modal-visit">
                  🛒 Visit Store
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
