import React, { useState, useEffect, useRef } from 'react'
import '../styles/SearchBar.css'

export default function SearchBar({ onSearch, loading }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(input)
  }

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter your search query... (or press /)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading}
        className="search-input"
        autoFocus
      />
      <button type="submit" disabled={loading} className="search-btn">
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
