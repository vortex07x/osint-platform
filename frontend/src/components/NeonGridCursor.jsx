import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const ENABLED_PATHS = ['/dashboard', '/scan']

function NeonGridCursor() {
  const gridRef = useRef(null)
  const location = useLocation()

  const isEnabled = ENABLED_PATHS.some((path) => location.pathname.startsWith(path))

  useEffect(() => {
    if (!isEnabled) return

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
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
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
  }, [isEnabled])

  if (!isEnabled) return null

  return <div ref={gridRef} className="neon-grid-overlay" />
}

export default NeonGridCursor