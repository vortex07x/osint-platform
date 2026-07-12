import { useEffect, useRef } from 'react'

function NeonGridCursor() {
  const gridRef = useRef(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    let targetX = -500
    let targetY = -500
    let currentX = -500
    let currentY = -500
    let rafId

    const handleMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const animate = () => {
      // lower = more delay/trail. was 0.08, now 0.05 for a laggier feel
      currentX += (targetX - currentX) * 0.05
      currentY += (targetY - currentY) * 0.05
      grid.style.setProperty('--mouse-x', `${currentX}px`)
      grid.style.setProperty('--mouse-y', `${currentY}px`)
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMove)
    animate()

    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return <div ref={gridRef} className="neon-grid-overlay" />
}

export default NeonGridCursor