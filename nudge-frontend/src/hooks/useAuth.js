import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accessToken) { fetchProfile() } else { setLoading(false) }
  }, [accessToken])

  async function fetchProfile() {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      localStorage.removeItem('accessToken')
      setAccessToken(null)
    } finally { setLoading(false) }
  }

  async function register(email, username, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, username, password })
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      setAccessToken(response.data.accessToken)
      setUser(response.data.user)
      return response.data.user
    } catch (error) { throw error.response?.data?.error || 'Registration failed' }
  }

  async function login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      setAccessToken(response.data.accessToken)
      setUser(response.data.user)
      return response.data.user
    } catch (error) { throw error.response?.data?.error || 'Login failed' }
  }

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setAccessToken(null)
    setUser(null)
  }

  return { user, accessToken, loading, login, logout, register }
}
