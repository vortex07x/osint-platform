function HUDOverlay() {
  return (
    <div className="hud-overlay">
      <svg
        className="hud-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="hud-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer large ring - extends beyond viewport top/bottom */}
        <circle
          cx="500" cy="500" r="480"
          fill="none" stroke="#00D9FF" strokeOpacity="0.35" strokeWidth="1"
          filter="url(#hud-glow)"
        />

        {/* Middle ring, rotating */}
        <g className="hud-ring-rotate">
          <circle
            cx="500" cy="500" r="420"
            fill="none" stroke="#00D9FF" strokeOpacity="0.5" strokeWidth="1"
            strokeDasharray="2 14"
          />
        </g>

        {/* Inner ring, rotating opposite direction */}
        <g className="hud-ring-rotate-reverse">
          <circle
            cx="500" cy="500" r="360"
            fill="none" stroke="#00D9FF" strokeOpacity="0.25" strokeWidth="1"
            strokeDasharray="30 6"
          />
        </g>

        {/* Cardinal tick marks */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const x1 = 500 + 470 * Math.cos(rad)
          const y1 = 500 + 470 * Math.sin(rad)
          const x2 = 500 + 495 * Math.cos(rad)
          const y2 = 500 + 495 * Math.sin(rad)
          return (
            <line
              key={angle}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#00D9FF" strokeOpacity="0.8" strokeWidth="2"
              filter="url(#hud-glow)"
            />
          )
        })}

        {/* Corner bracket marks (top-left, top-right, bottom-left, bottom-right) */}
        {[
          { x: 40, y: 40, dx: 1, dy: 1 },
          { x: 960, y: 40, dx: -1, dy: 1 },
          { x: 40, y: 960, dx: 1, dy: -1 },
          { x: 960, y: 960, dx: -1, dy: -1 },
        ].map((c, i) => (
          <g key={i} stroke="#00D9FF" strokeOpacity="0.7" strokeWidth="2" filter="url(#hud-glow)">
            <line x1={c.x} y1={c.y} x2={c.x + 30 * c.dx} y2={c.y} />
            <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + 30 * c.dy} />
          </g>
        ))}
      </svg>
    </div>
  )
}

export default HUDOverlay