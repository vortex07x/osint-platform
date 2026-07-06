import { useEffect, useState } from 'react'

// Random dummy "blips" that light up periodically to simulate scanning activity
function generateBlips(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    radius: 15 + Math.random() * 75,
  }))
}

function RadarHUD() {
  const [blips, setBlips] = useState(() => generateBlips(6))
  const [statusText, setStatusText] = useState('SCANNING')

  useEffect(() => {
    const blipInterval = setInterval(() => {
      setBlips(generateBlips(6))
    }, 3000)

    const statusMessages = ['SCANNING', 'CORRELATING', 'ANALYZING', 'INDEXING']
    let i = 0
    const statusInterval = setInterval(() => {
      i = (i + 1) % statusMessages.length
      setStatusText(statusMessages[i])
    }, 2000)

    return () => {
      clearInterval(blipInterval)
      clearInterval(statusInterval)
    }
  }, [])

  return (
    <div className="radar-hud">
      <div className="radar-hud-inner">
        {/* Equalizer bars */}
        <div className="radar-bars">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="radar-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>

        {/* Radar sweep circle */}
        <div className="radar-circle">
          <div className="radar-ring radar-ring-1" />
          <div className="radar-ring radar-ring-2" />
          <div className="radar-ring radar-ring-3" />
          <div className="radar-sweep" />
          {blips.map((b) => {
            const rad = (b.angle * Math.PI) / 180
            const x = 50 + b.radius * Math.cos(rad) * 0.01 * 100
            const y = 50 + b.radius * Math.sin(rad) * 0.01 * 100
            return (
              <span
                key={b.id}
                className="radar-blip"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            )
          })}
        </div>

        {/* Status text */}
        <div className="radar-status">
          <p className="radar-status-label">{statusText}</p>
          <p className="radar-status-sub">AUTONOMOUS MODE · ACTIVE</p>
        </div>
      </div>
    </div>
  )
}

export default RadarHUD