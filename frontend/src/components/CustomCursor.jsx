import { useEffect, useRef } from 'react'

function CustomCursor() {
  const cursorRef = useRef(null)
  const followerRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const follower = followerRef.current

    let mouseX = 0, mouseY = 0
    let followerX = 0, followerY = 0

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`
    }

    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.15
      followerY += (mouseY - followerY) * 0.15
      follower.style.transform = `translate(${followerX}px, ${followerY}px)`
      requestAnimationFrame(animateFollower)
    }

    const handleMouseDown = () => {
      follower.classList.add('cursor-active')
    }
    const handleMouseUp = () => {
      follower.classList.remove('cursor-active')
    }

    const handleHoverable = () => {
      follower.classList.add('cursor-hover')
    }
    const handleUnhoverable = () => {
      follower.classList.remove('cursor-hover')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    const hoverables = document.querySelectorAll('a, button, input, select, .scan-card, [data-cursor-hover]')
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', handleHoverable)
      el.addEventListener('mouseleave', handleUnhoverable)
    })

    animateFollower()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      hoverables.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverable)
        el.removeEventListener('mouseleave', handleUnhoverable)
      })
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="custom-cursor-dot" />
      <div ref={followerRef} className="custom-cursor-square" />
    </>
  )
}

export default CustomCursor