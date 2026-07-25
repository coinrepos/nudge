import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useSearch(accessToken) {
  const [results, setResults] = useState(null)
  const [reels, setReels] = useState([[], [], []])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  async function search(query) {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
      const response = await axios.post(`${API_URL}/search/query`, { query }, config)
      setLastQuery(query)
      setReels(response.data.reels)
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed')
      setResults(null)
    } finally { setLoading(false) }
  }

  return { search, results, reels, loading, error, lastQuery }
}
