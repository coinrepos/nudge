import React, { useState, useEffect, useRef } from 'react'
import ResultCard from './ResultCard'
import '../styles/ReelSpinner.css'

export default function ReelSpinner({ reels, isWinning, onSpinComplete }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [visibleResults, setVisibleResults] = useState([null, null, null])
  const intervalsRef = useRef([])

  useEffect(() => {
    if (reels && reels.length === 3) {
      setVisibleResults(reels.map((reel) => reel[0] || null))
    }
  }, [reels])

  useEffect(() => {
    return () => { intervalsRef.current.forEach(interval => clearInterval(interval)) }
  }, [])

  const spinReel = (reelIndex, duration) => {
    const reel = reels[reelIndex]
    if (!reel || reel.length === 0) return
    const steps = 20
    const intervalTime = duration / steps
    let currentStep = 0
    const spin = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * reel.length)
      setVisibleResults((prev) => {
        const newResults = [...prev]
        newResults[reelIndex] = reel[randomIndex]
        return newResults
      })
      currentStep++
      if (currentStep >= steps) {
        clearInterval(spin)
        intervalsRef.current = intervalsRef.current.filter(i => i !== spin)
      }
    }, intervalTime)
    intervalsRef.current.push(spin)
  }

  const handleSpin = async () => {
    if (isSpinning || !reels || reels.some((r) => !r || r.length === 0)) return
    setIsSpinning(true)
    const spinDuration = 1500
    for (let i = 0; i < 3; i++) {
      setTimeout(() => { spinReel(i, spinDuration) }, i * 200)
    }
    setTimeout(() => { setIsSpinning(false); onSpinComplete?.() }, spinDuration + 400)
  }

  if (!reels || reels.length === 0) {
    return <div className="reel-spinner empty">Enter a search query to begin</div>
  }

  return (
    <div className="reel-spinner-container">
      <div className="reels-wrapper">
        {visibleResults.map((result, index) => (
          <div key={index} className={`reel ${isSpinning ? 'spinning' : ''}`}>
            {result ? <ResultCard result={result} /> : <div className="reel-empty">No results</div>}
          </div>
        ))}
      </div>
      <button onClick={handleSpin} disabled={isSpinning} className={`spin-btn ${isWinning ? 'winning' : ''}`}>
        {isSpinning ? '🎰 Spinning...' : '🎰 SPIN'}
      </button>
      {isWinning && <div className="winning-banner">🎉 WINNING COMBINATION! +3 Credits</div>}
    </div>
  )
}
