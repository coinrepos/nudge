import React, { useState, useEffect } from 'react'
import '../styles/TrendingNews.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function TrendingNews({ onSearch }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/search/trending-news`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNews(data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Trending news fetch error:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="trending-news-section">
        <h3 className="trending-news-header">📰 Latest News</h3>
        <div className="trending-news-loading">Loading headlines...</div>
      </div>
    )
  }

  if (error || news.length === 0) return null

  const handleNewsClick = (item) => {
    // Extract a search query from the headline
    const query = item.title.split(' - ').slice(0, -1).join(' - ') || item.title
    if (onSearch) {
      onSearch(query)
    } else if (item.url) {
      window.open(item.url, '_blank')
    }
  }

  return (
    <div className="trending-news-section">
      <h3 className="trending-news-header">📰 Latest News</h3>
      <div className="trending-news-scroll">
        {news.map((item, i) => (
          <div
            key={i}
            className="news-bulletin-card"
            onClick={() => handleNewsClick(item)}
            title="Click to search this topic"
          >
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="news-bulletin-thumb"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <div className="news-bulletin-content">
              <span className="news-bulletin-source">{item.source}</span>
              <p className="news-bulletin-title">{item.title}</p>
              {item.date && (
                <span className="news-bulletin-date">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
