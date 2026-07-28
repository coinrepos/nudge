import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/NudgeCashDisplay.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function NudgeCashDisplay() {
  const { accessToken } = useContext(AuthContext)
  const [balance, setBalance] = useState(0)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!accessToken) return

    const fetchBalance = async () => {
      try {
        const res = await fetch(`${API_URL}/nudge-cash/balance`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance || 0)
          setPending(data.pendingBalance || 0)
        }
      } catch (err) {
        // Silent fail — don't disrupt the UI
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [accessToken])

  if (!accessToken) return null

  return (
    <div className="nudge-cash-display" title={`Balance: $${balance.toFixed(2)} | Pending: $${pending.toFixed(2)}`}>
      <span className="cash-icon">💰</span>
      <span className="cash-amount">${balance.toFixed(2)}</span>
      {pending > 0 && <span className="cash-pending">+${pending.toFixed(2)} pending</span>}
    </div>
  )
}
