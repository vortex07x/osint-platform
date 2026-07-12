import { useEffect, useRef } from 'react'

function NeonGridCursor() {
  const gridRef = useRef(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const handleMove = (e) => {
      grid.style.setProperty('--mouse-x', `${e.clientX}px`)
      grid.style.setProperty('--mouse-y', `${e.clientY}px`)
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return <div ref={gridRef} className="neon-grid-overlay" />
}

export default NeonGridCursor