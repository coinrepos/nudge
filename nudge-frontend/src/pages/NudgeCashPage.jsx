import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/NudgeCashPage.css'
import AffiliateDisclosure from '../components/AffiliateDisclosure'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const MERCHANT_RATES = [
  { merchant: 'Amazon', rate: '4.0%', domains: 'amazon.com, amazon.co.uk, amazon.ca' },
  { merchant: 'eBay', rate: '2.5%', domains: 'ebay.com' },
  { merchant: 'Etsy', rate: '3.0%', domains: 'etsy.com' },
  { merchant: 'Walmart', rate: '2.0%', domains: 'walmart.com' },
  { merchant: 'Target', rate: '2.0%', domains: 'target.com' },
  { merchant: 'Best Buy', rate: '1.5%', domains: 'bestbuy.com' },
  { merchant: 'AliExpress', rate: '5.0%', domains: 'aliexpress.com' },
  { merchant: 'Alibaba', rate: '4.5%', domains: 'alibaba.com' },
  { merchant: 'Booking.com', rate: '3.0%', domains: 'booking.com' },
  { merchant: 'Expedia', rate: '3.0%', domains: 'expedia.com' },
  { merchant: 'Hotels.com', rate: '3.0%', domains: 'hotels.com' },
  { merchant: 'Thousands more via Skimlinks', rate: 'Up to 5%+', domains: '48,500+ merchants' },
]

const MIN_WITHDRAWAL = 10.00

export default function NudgeCashPage() {
  const { accessToken, user } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [clicks, setClicks] = useState([])
  const [activeTab, setActiveTab] = useState('transactions')
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('paypal')
  const [withdrawEmail, setWithdrawEmail] = useState('')
  const [withdrawStatus, setWithdrawStatus] = useState(null)
  const [toast, setToast] = useState(null)

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)

    if (!amount || amount < MIN_WITHDRAWAL) {
      setWithdrawStatus({ type: 'error', message: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}` })
      return
    }

    if (amount > (stats?.balance || 0)) {
      setWithdrawStatus({ type: 'error', message: 'Insufficient balance' })
      return
    }

    if (withdrawMethod === 'paypal' && !withdrawEmail) {
      setWithdrawStatus({ type: 'error', message: 'PayPal email required' })
      return
    }

    try {
      const res = await fetch(`${API_URL}/nudge-cash/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          paypalEmail: withdrawMethod === 'paypal' ? withdrawEmail : null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setWithdrawStatus({ type: 'success', message: `Withdrawal request for $${amount.toFixed(2)} submitted! You'll receive it within 5-7 business days.` })
        setWithdrawAmount('')
        setWithdrawEmail('')
        setShowWithdraw(false)
        fetchAll()
      } else {
        setWithdrawStatus({ type: 'error', message: data.error || 'Withdrawal failed' })
      }
    } catch (err) {
      setWithdrawStatus({ type: 'error', message: 'Network error. Please try again.' })
    }
  }

  if (loading) {
    return (
      <div className="nudge-cash-page">
        <div className="nc-loading">
          <div className="nc-spinner" />
          <p>Loading your Nudge Cash wallet...</p>
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="nudge-cash-page">
        <div className="nc-auth-prompt">
          <h1>💰 Nudge Cash Wallet</h1>
          <p>Log in to view your cashback balance, track earnings, and request withdrawals.</p>
          <a href="/auth" className="nc-login-btn">Log In / Sign Up</a>
        </div>
      </div>
    )
  }

  return (
    <div className="nudge-cash-page">
      {/* Toast */}
      {toast && (
        <div className={`nc-toast nc-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="nc-header">
        <div>
          <h1 className="page-title">💰 Nudge Cash Wallet</h1>
          <p className="page-subtitle">Earn real cashback when you shop through Nudge's Shopping reel.</p>
        </div>
        {stats?.balance >= MIN_WITHDRAWAL && (
          <button className="nc-withdraw-btn" onClick={() => setShowWithdraw(!showWithdraw)}>
            {showWithdraw ? 'Cancel' : 'Request Withdrawal'}
          </button>
        )}
      </div>

      {/* Stats grid */}
      {/* FTC Affiliate Disclosure */}
      <AffiliateDisclosure variant="banner" />

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

      {/* Withdrawal form */}
      {showWithdraw && (
        <div className="nc-withdraw-form">
          <h3>Request Withdrawal</h3>
          <p className="nc-withdraw-hint">Available: ${(stats?.balance || 0).toFixed(2)} · Minimum: ${MIN_WITHDRAWAL.toFixed(2)}</p>
          {withdrawStatus && (
            <div className={`nc-withdraw-status nc-withdraw-${withdrawStatus.type}`}>
              {withdrawStatus.message}
            </div>
          )}
          <form onSubmit={handleWithdraw}>
            <div className="nc-form-row">
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min={MIN_WITHDRAWAL}
                max={stats?.balance || 0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="nc-form-row">
              <label>Withdrawal Method</label>
              <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
                <option value="giftcard">Gift Card</option>
              </select>
            </div>
            {withdrawMethod === 'paypal' && (
              <div className="nc-form-row">
                <label>PayPal Email</label>
                <input
                  type="email"
                  value={withdrawEmail}
                  onChange={(e) => setWithdrawEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            )}
            <button type="submit" className="nc-submit-withdraw">Submit Withdrawal Request</button>
          </form>
        </div>
      )}

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
        <button
          className={`cash-tab ${activeTab === 'merchants' ? 'active' : ''}`}
          onClick={() => setActiveTab('merchants')}
        >
          Cashback Rates
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'transactions' && (
        <div className="transaction-list">
          {transactions.length === 0 ? (
            <div className="nc-empty">
              <span className="nc-empty-icon">🛒</span>
              <p>No cashback transactions yet.</p>
              <p className="nc-empty-hint">Search for products and shop through the Shopping reel to earn Nudge Cash!</p>
            </div>
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
            <div className="nc-empty">
              <span className="nc-empty-icon">🖱️</span>
              <p>No affiliate clicks yet.</p>
              <p className="nc-empty-hint">When you click on Shopping reel results, they'll appear here.</p>
            </div>
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

      {activeTab === 'merchants' && (
        <div className="merchant-rates">
          <p className="merchant-intro">Nudge Cash rates vary by merchant. Here's what you can earn:</p>
          <div className="merchant-grid">
            {MERCHANT_RATES.map((m, i) => (
              <div key={i} className="merchant-card">
                <div className="merchant-info">
                  <p className="merchant-name">{m.merchant}</p>
                  <p className="merchant-domains">{m.domains}</p>
                </div>
                <span className="merchant-rate-badge">{m.rate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="cashback-info">
        <h3>How Nudge Cash Works</h3>
        <div className="nc-steps">
          <div className="nc-step">
            <span className="nc-step-icon">🔍</span>
            <p>Search for products through Nudge's Shopping reel</p>
          </div>
          <div className="nc-step">
            <span className="nc-step-icon">🛒</span>
            <p>Click through to the merchant and complete your purchase</p>
          </div>
          <div className="nc-step">
            <span className="nc-step-icon">💰</span>
            <p>Earn a percentage of your purchase back as Nudge Cash</p>
          </div>
          <div className="nc-step">
            <span className="nc-step-icon">⏳</span>
            <p>Cashback starts as "pending" and moves to "confirmed" after the return window</p>
          </div>
          <div className="nc-step">
            <span className="nc-step-icon">✅</span>
            <p>Withdraw confirmed Nudge Cash via PayPal, bank transfer, or gift card</p>
          </div>
        </div>
        <p className="info-note">Nudge Cash is separate from Social Credits. Social Credits are cosmetic; Nudge Cash has real value.</p>
      </div>

      {/* FTC Affiliate Disclosure */}
      <div className="nc-disclosure">
        <h4>Affiliate Disclosure</h4>
        <p>
          Nudge earns affiliate commissions on some shopping links displayed in the Shopping reel.
          These commissions are shared with users in the form of Nudge Cash cashback.
          This does not affect the price you pay, and Nudge does not curate or bias search results
          based on affiliate relationships — all search results are shown as returned by the search provider.
        </p>
      </div>
    </div>
  )
}
