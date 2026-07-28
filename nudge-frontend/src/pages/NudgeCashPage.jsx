import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/NudgeCashPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function NudgeCashPage() {
  const { accessToken } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [clicks, setClicks] = useState([])
  const [activeTab, setActiveTab] = useState('transactions')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    fetchAll()
  }, [accessToken])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [statsRes, txRes, clicksRes] = await Promise.all([
        fetch(`${API_URL}/nudge-cash/stats`, { headers }),
        fetch(`${API_URL}/nudge-cash/transactions`, { headers }),
        fetch(`${API_URL}/nudge-cash/clicks`, { headers }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (txRes.ok) setTransactions(await txRes.json())
      if (clicksRes.ok) setClicks(await clicksRes.json())
    } catch (err) {
      console.error('Failed to fetch Nudge Cash data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="nudge-cash-page"><p className="loading-text">Loading your Nudge Cash wallet...</p></div>
  }

  return (
    <div className="nudge-cash-page">
      <h1 className="page-title">💰 Nudge Cash Wallet</h1>
      <p className="page-subtitle">Earn real cashback when you shop through Nudge's Shopping reel.</p>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card stat-balance">
          <p className="stat-label">Available Balance</p>
          <p className="stat-value">${(stats?.balance || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card stat-pending">
          <p className="stat-label">Pending</p>
          <p className="stat-value">${(stats?.pendingBalance || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card stat-total">
          <p className="stat-label">Total Earned</p>
          <p className="stat-value">${(stats?.totalEarned || 0).toFixed(2)}</p>
        </div>
        <div className="stat-card stat-clicks">
          <p className="stat-label">Affiliate Clicks</p>
          <p className="stat-value">{stats?.totalClicks || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="cash-tabs">
        <button
          className={`cash-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Cashback Transactions ({transactions.length})
        </button>
        <button
          className={`cash-tab ${activeTab === 'clicks' ? 'active' : ''}`}
          onClick={() => setActiveTab('clicks')}
        >
          Click History ({clicks.length})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'transactions' && (
        <div className="transaction-list">
          {transactions.length === 0 ? (
            <p className="empty-state">No cashback transactions yet. Search for products and shop through the Shopping reel to earn Nudge Cash!</p>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-main">
                  <p className="tx-merchant">{tx.merchant || 'Unknown merchant'}</p>
                  <p className="tx-product">{tx.product_title || 'Purchase'}</p>
                  <p className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="tx-aside">
                  <p className="tx-amount">+${(tx.amount || 0).toFixed(2)}</p>
                  <span className={`tx-status status-${tx.status}`}>{tx.status}</span>
                  {tx.cashback_rate > 0 && <p className="tx-rate">{tx.cashback_rate}% cashback</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'clicks' && (
        <div className="click-list">
          {clicks.length === 0 ? (
            <p className="empty-state">No affiliate clicks yet. When you click on Shopping reel results, they'll appear here.</p>
          ) : (
            clicks.map(click => (
              <div key={click.id} className="click-item">
                <div className="click-main">
                  <p className="click-merchant">{click.merchant || 'Unknown'}</p>
                  <a href={click.affiliate_url} target="_blank" rel="noopener noreferrer" className="click-url">
                    {click.original_url?.substring(0, 60)}...
                  </a>
                  <p className="click-date">{new Date(click.clicked_at).toLocaleString()}</p>
                </div>
                {click.search_query && <span className="click-query">Searched: "{click.search_query}"</span>}
              </div>
            ))
          )}
        </div>
      )}

      <div className="cashback-info">
        <h3>How Nudge Cash Works</h3>
        <ul>
          <li>🔍 Search for products through Nudge's Shopping reel</li>
          <li>🛒 Click through to the merchant and complete your purchase</li>
          <li>💰 Earn a percentage of your purchase back as Nudge Cash</li>
          <li>⏳ Cashback starts as "pending" and moves to "confirmed" after the return window</li>
          <li>✅ Confirmed Nudge Cash can be withdrawn or used for rewards</li>
        </ul>
        <p className="info-note">Nudge Cash is separate from Social Credits. Social Credits are cosmetic; Nudge Cash has real value.</p>
      </div>
    </div>
  )
}
