import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useCredits(accessToken) {
  const [balance, setBalance] = useState(0)
  const [stats, setStats] = useState(null)

  const recordSpin = useCallback(async (isWinning) => {
    try {
      const config = accessToken ? {
        headers: { Authorization: `Bearer ${accessToken}` },
      } : {}

      const response = await axios.post(
        `${API_URL}/credits/spin`,
        { isWinning },
        config
      )

      if (response.data.newBalance !== undefined) {
        setBalance(response.data.newBalance)
      }

      return response.data
    } catch (error) {
      console.error('Failed to record spin:', error)
    }
  }, [accessToken])

  const fetchBalance = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await axios.get(`${API_URL}/credits/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setBalance(response.data.balance)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }, [accessToken])

  const fetchStats = useCallback(async () => {
    if (!accessToken) return
    try {
      const response = await axios.get(`${API_URL}/credits/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      fetchBalance()
    }
  }, [accessToken, fetchBalance])

  return {
    balance,
    stats,
    recordSpin,
    fetchBalance,
    fetchStats,
  }
}
