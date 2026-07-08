import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function ExpandablePanel({ title, children }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const handleEsc = (e) => e.key === 'Escape' && setExpanded(false)
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [expanded])

  return (
    <div className="expandable-panel">
      <button
        className="expand-trigger"
        onClick={() => setExpanded(true)}
        aria-label={`Expand ${title}`}
        title="Expand"
      >
        <ExpandIcon />
      </button>

      <div className="expandable-content">
        {children}
      </div>

      {expanded && createPortal(
        <div className="expand-modal-overlay" onClick={() => setExpanded(false)}>
          <div className="expand-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="expand-modal-header">
              <span className="expand-modal-title">{title}</span>
              <button className="expand-close-btn" onClick={() => setExpanded(false)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="expand-modal-body">
              {children}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ExpandablePanel