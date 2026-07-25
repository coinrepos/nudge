import React from 'react'
import '../styles/ResultCard.css'

export default function ResultCard({ result }) {
  const handleClick = () => { if (result.url) window.open(result.url, '_blank') }
  return (
    <div className="result-card" onClick={handleClick}>
      <div className="result-header">
        <h3 className="result-title">{result.title || 'Untitled'}</h3>
        <span className="result-source">{result.source || 'Unknown'}</span>
      </div>
      <p className="result-snippet">{result.snippet || 'No description available'}</p>
      <div className="result-footer">
        <span className="result-relevance">Relevance: {(result.relevanceScore * 100).toFixed(0)}%</span>
        {result.date && <span className="result-date">{new Date(result.date).toLocaleDateString()}</span>}
      </div>
      <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-url">{result.url?.substring(0, 40)}...</a>
    </div>
  )
}
