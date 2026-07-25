import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import '../styles/AuthPage.css'

export default function AuthPage() {
  const { login, register } = useContext(AuthContext)
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ email: '', password: '', username: '' })

  const handleChange = (e) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isLogin) { await login(formData.email, formData.password) }
      else { await register(formData.email, formData.username, formData.password) }
      navigate('/')
    } catch (err) { setError(err) } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            {!isLogin && <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />}
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <button type="submit" disabled={loading} className="auth-btn">{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="auth-toggle">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
