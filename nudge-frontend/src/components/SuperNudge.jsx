import React, { useState } from 'react'
import '../styles/SuperNudge.css'

export default function SuperNudge({ active, onToggle, keywords, onAddKeyword, onRemoveKeyword }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      onAddKeyword(input.trim())
      setInput('')
    }
  }

  return (
    <div className="supernudge-wrapper">
      <button
        className={`supernudge-btn ${active ? 'active' : ''}`}
        onClick={onToggle}
      >
        ⚡ SuperNudge {active && '✓'}
      </button>

      {active && (
        <div className="supernudge-panel">
          <input
            type="text"
            placeholder="Add keywords to refine your search... (press Enter)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="supernudge-input"
          />
          {keywords.length > 0 && (
            <div className="keyword-chips">
              {keywords.map((kw, i) => (
                <span className="keyword-chip" key={i}>
                  {kw}
                  <button
                    onClick={() => onRemoveKeyword(i)}
                    className="chip-remove"
                    aria-label="Remove keyword"
                  >×</button>
                </span>
              ))}
            </div>
          )}
          <p className="supernudge-hint">
            Keywords are combined with your search using smart operators (site:, quotes, etc.) to pinpoint results
          </p>
        </div>
      )}
    </div>
  )
}
