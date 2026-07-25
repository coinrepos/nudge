import React from 'react'
import '../styles/CreditDisplay.css'

export default function CreditDisplay({ credits }) {
  return (
    <div className="credit-display">
      <span className="credit-icon">⭐</span>
      <span className="credit-value">{credits || 0}</span>
    </div>
  )
}
