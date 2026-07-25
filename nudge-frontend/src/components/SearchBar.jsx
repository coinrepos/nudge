import React, { useState } from 'react'
import '../styles/SearchBar.css'

export default function SearchBar({ onSearch, loading }) {
  const [input, setInput] = useState('')
  const handleSubmit = (e) => { e.preventDefault(); onSearch(input) }
  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input type="text" placeholder="Enter your search query..." value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} className="search-input" />
      <button type="submit" disabled={loading} className="search-btn">{loading ? 'Searching...' : 'Search'}</button>
    </form>
  )
}
