import { useRef, useEffect, useState, useCallback } from 'react'
import Globe from 'react-globe.gl'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HUDOverlay from '../components/HUDOverlay'
import RadarHUD from '../components/RadarHUD'
import WorldMapHUD from '../components/WorldMapHUD'

const SAMPLE_POINTS = [
  { lat: 37.7749, lng: -122.4194, size: 0.4, label: 'San Francisco' },
  { lat: 51.5074, lng: -0.1278, size: 0.3, label: 'London' },
  { lat: 28.6139, lng: 77.2090, size: 0.4, label: 'New Delhi' },
  { lat: 23.5204, lng: 87.3119, size: 0.5, label: 'Durgapur' },
  { lat: 35.6762, lng: 139.6503, size: 0.3, label: 'Tokyo' },
  { lat: -33.8688, lng: 151.2093, size: 0.3, label: 'Sydney' },
  { lat: 40.7128, lng: -74.0060, size: 0.4, label: 'New York' },
]

const SAMPLE_ARCS = [
  { startLat: 37.7749, startLng: -122.4194, endLat: 28.6139, endLng: 77.2090 },
  { startLat: 51.5074, startLng: -0.1278, endLat: 35.6762, endLng: 139.6503 },
  { startLat: 23.5204, startLng: 87.3119, endLat: 40.7128, endLng: -74.0060 },
]

const WAYPOINTS = [
  { lat: 15, lng: 10, altitude: 2.4 },
  { lat: 37.7749, lng: -122.4194, altitude: 1.4 },
  { lat: 51.5074, lng: -0.1278, altitude: 1.3 },
  { lat: 23.5204, lng: 87.3119, altitude: 1.1 },
  { lat: 15, lng: 10, altitude: 2.4 },
]

// Intro timing (seconds)
const INTRO = {
  rings: 0.5,
  globe: 1.3,
  hud: 2.5,
  hero: 3.1,
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut', delay: INTRO.hero } }
}

const fadeUpNoDelay = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
}

function Landing() {
  const globeEl = useRef()
  const scrollContainerRef = useRef()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls()
      controls.enableZoom = false
      controls.enableRotate = true
      controls.enablePan = false
      // Continuous idle rotation — runs independently of scroll-driven pointOfView calls below
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.6
      globeEl.current.pointOfView(WAYPOINTS[0], 0)
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || !globeEl.current) return

    const scrollableHeight = el.scrollHeight - window.innerHeight
    const progress = Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1)

    const segment = progress * (WAYPOINTS.length - 1)
    const i = Math.min(Math.floor(segment), WAYPOINTS.length - 2)
    const t = segment - i

    const from = WAYPOINTS[i]
    const to = WAYPOINTS[i + 1]

    globeEl.current.pointOfView({
      lat: lerp(from.lat, to.lat, t),
      lng: lerp(from.lng, to.lng, t),
      altitude: lerp(from.altitude, to.altitude, t)
    }, 0)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleEnter = () => {
    navigate(user ? '/dashboard' : '/login')
  }

  return (
    <div ref={scrollContainerRef} className="landing-scroll-container">
      <motion.div
        className="landing-globe-fixed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: INTRO.globe }}
      >
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#060B14"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#00D9FF"
          atmosphereAltitude={0.18}
          pointsData={SAMPLE_POINTS}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#00D9FF'}
          pointAltitude={0.01}
          pointRadius="size"
          pointLabel="label"
          arcsData={SAMPLE_ARCS}
          arcColor={() => ['#00D9FF', 'rgba(0,217,255,0.1)']}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2500}
          arcStroke={0.4}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: INTRO.rings }}
      >
        <HUDOverlay />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut', delay: INTRO.hud }}
      >
        <WorldMapHUD />
        {/* <RadarHUD /> */}
      </motion.div>

      <div className="landing-sections">
        <section className="landing-section landing-hero">
          <motion.div
            className="landing-glass"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <p className="landing-tag">// AUTONOMOUS OSINT INTELLIGENCE</p>
            <h1 className="landing-title">
              MAPPING THE<br />INVISIBLE FOOTPRINT
            </h1>
            <p className="landing-subtitle">Scroll to explore</p>
          </motion.div>
        </section>

        <section className="landing-section landing-align-right">
          <motion.div
            className="landing-glass"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUpNoDelay}
          >
            <p className="landing-tag">// 01 — COLLECT</p>
            <h2 className="landing-section-title">DIGITAL FOOTPRINTS,<br />ACROSS EVERY PLATFORM</h2>
            <p className="landing-subtitle">
              GitHub profiles, cross-platform usernames, and image metadata —
              gathered automatically and continuously, without manual commands.
            </p>
          </motion.div>
        </section>

        <section className="landing-section landing-align-left">
          <motion.div
            className="landing-glass"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUpNoDelay}
          >
            <p className="landing-tag">// 02 — ANALYZE</p>
            <h2 className="landing-section-title">RISK SCORING &<br />CORRELATION DETECTION</h2>
            <p className="landing-subtitle">
              Every finding is classified, scored, and cross-referenced —
              revealing when isolated data points combine into real exposure.
            </p>
          </motion.div>
        </section>

        <section className="landing-section landing-align-right">
          <motion.div
            className="landing-glass"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUpNoDelay}
          >
            <p className="landing-tag">// 03 — VISUALIZE</p>
            <h2 className="landing-section-title">EXPOSURE GRAPHS &<br />GEOLOCATION MAPPING</h2>
            <p className="landing-subtitle">
              Interactive relationship graphs and precise location pinpointing —
              turning raw data into actionable intelligence.
            </p>
          </motion.div>
        </section>

        <section className="landing-section landing-hero">
          <motion.div
            className="landing-glass"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUpNoDelay}
            style={{ textAlign: 'center' }}
          >
            <h2 className="landing-section-title">READY TO INVESTIGATE?</h2>
            <button className="landing-cta" onClick={handleEnter}>
              {user ? 'ENTER DASHBOARD' : 'GET STARTED'} →
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

export default Landing