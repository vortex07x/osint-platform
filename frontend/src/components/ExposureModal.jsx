import { createPortal } from 'react-dom'
import { PlatformIcon, getPlatformLabel } from '../utils/platformIcons'
import { getPlatformSettingsUrl } from '../utils/platformSettings'

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

const SEVERITY_COLORS = {
  critical: '#EF4444',
  high: '#FF4D2D',
  medium: '#FBBF24',
  low: '#4ADE80',
}

function ExposureModal({ exposure, platforms, onClose }) {
  if (!exposure) return null

  const color = SEVERITY_COLORS[exposure.severity] || '#888'

  return createPortal(
    <div className="expand-modal-overlay" onClick={onClose}>
      <div className="exposure-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="exposure-modal-severity-bar" style={{ background: color }} />

        <div className="expand-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span className="expand-modal-title">EXPOSURE DETAILS</span>
          <button className="expand-close-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="exposure-modal-body">
          <h2 className="exposure-modal-title">{exposure.title}</h2>

          <div className="exposure-modal-meta">
            <span
              className="exposure-modal-severity-pill"
              style={{ borderColor: color, color }}
            >
              {exposure.severity}
            </span>
            <span className="exposure-modal-score">
              RISK SCORE: <strong>{exposure.risk_score}</strong> / 100
            </span>
          </div>

          <p className="exposure-modal-section-label">// WHAT WE FOUND</p>
          <p className="exposure-modal-desc">{exposure.description}</p>

          {exposure.recommendations && (
            <>
              <p className="exposure-modal-section-label">// RECOMMENDATION</p>
              <p className="exposure-modal-rec">→ {exposure.recommendations}</p>
            </>
          )}

          {platforms && platforms.length > 0 && (
            <>
              <p className="exposure-modal-section-label">// CLEAN THIS UP</p>
              <div className="cleanup-links">
                {platforms.map((platform) => {
                  const url = getPlatformSettingsUrl(platform)
                  if (!url) return null
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="cleanup-link"
                    >
                      <PlatformIcon platform={platform} size={13} />
                      FIX ON {getPlatformLabel(platform)}
                    </a>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ExposureModal