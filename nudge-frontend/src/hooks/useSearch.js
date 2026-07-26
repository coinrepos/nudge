import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useSearch(accessToken) {
  const [results, setResults] = useState(null)
  const [reels, setReels] = useState({
    all: [], images: [], videos: [], news: [], shopping: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')
  const [trending, setTrending] = useState([])

  // Fetch trending searches on mount
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await axios.get(`${API_URL}/search/trending`)
        setTrending(response.data)
      } catch (err) {
        console.error('Failed to fetch trending:', err)
      }
    }
    fetchTrending()
  }, [])

  async function search(query, keywords = []) {
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    try {
      const config = accessToken ? {
        headers: { Authorization: `Bearer ${accessToken}` },
      } : {}

      const response = await axios.post(
        `${API_URL}/search/query`,
        { query, keywords },
        config
      )

      setLastQuery(query)
      setReels(response.data.reels)
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return { search, results, reels, loading, error, lastQuery, trending }
}
