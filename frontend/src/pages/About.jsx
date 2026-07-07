import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import AboutWorldMap from '../components/AboutWorldMap'
import WaveText from '../components/WaveText'

const STATS = [
  { value: '3', label: 'Independent scrapers running concurrently', sub: 'GitHub · Usernames · Image EXIF' },
  { value: '24/7', label: 'Autonomous monitoring via scheduled re-scans', sub: 'Celery Beat scheduler' },
  { value: '5', label: 'Exposure categories classified and scored', sub: 'Personal · Contact · Social · Behavioral' },
  { value: '2-3x', label: 'Higher correlation risk when data points combine', sub: 'Cross-reference engine' },
  { value: '100%', label: 'Self-hosted architecture, fully under your control', sub: 'Supabase · Neo4j · Redis' },
  { value: '10min', label: 'OTP-secured password reset window', sub: 'Brevo email delivery' },
]

const PIPELINE = [
  { step: '01', title: 'COLLECT', desc: 'Gather public data from GitHub, cross-platform usernames, and image metadata.' },
  { step: '02', title: 'ANALYZE', desc: 'Extract structured entities and assess risk severity for each finding.' },
  { step: '03', title: 'CORRELATE', desc: 'Detect when isolated data points combine into elevated re-identification risk.' },
  { step: '04', title: 'VISUALIZE', desc: 'Explore results through interactive graphs and precise geolocation mapping.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 60, scale: 0.94, rotateX: 8, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 }
  }
}

function About() {
  const heroRef = useRef(null)
  const pipelineRef = useRef(null)

  // Whole-page scroll progress -> top accent bar
  const { scrollYProgress: pageProgress } = useScroll()

  // Hero fades/lifts away as the user scrolls past it
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroOpacity = useTransform(heroProgress, [0, 1], [1, 0])
  const heroY = useTransform(heroProgress, [0, 1], [0, -120])
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.94])

  // Pipeline connector line draws in as its section enters view
  const { scrollYProgress: pipelineProgress } = useScroll({
    target: pipelineRef,
    offset: ['start 85%', 'start 25%']
  })

  return (
    <div className="about-page">
      <motion.div
        className="about-progress-bar"
        style={{ scaleX: pageProgress }}
      />

      {/* HERO */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero-map">
          <AboutWorldMap />
        </div>
        <motion.div
          className="about-hero-content"
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
        >
          <p className="about-tag">// ABOUT THE PLATFORM</p>
          <h1 className="about-hero-title">
            <WaveText text="AUTONOMOUS INTELLIGENCE" />
            <br />
            <WaveText text="FOR THE OPEN WEB" />
          </h1>
          <p className="about-hero-subtitle">
            <WaveText text="Every public trace tells part of a story. We connect them." />
          </p>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="about-stats">
        <motion.div
          className="about-stats-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              className="about-stat-card"
              variants={fadeUp}
              whileHover={{ y: -6, borderColor: 'rgba(0,217,255,0.6)' }}
            >
              <h3 className="about-stat-value">{s.value}</h3>
              <p className="about-stat-label">{s.label}</p>
              <p className="about-stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* LARGE PANEL */}
        <motion.div
          ref={pipelineRef}
          className="about-pipeline-panel"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <p className="about-tag">// HOW IT WORKS</p>
          <h2 className="about-panel-title">THE INTELLIGENCE PIPELINE</h2>

          <div className="about-pipeline-track">
            <motion.div
              className="about-pipeline-line"
              style={{ scaleX: pipelineProgress }}
            />
            <motion.div
              className="about-pipeline-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {PIPELINE.map((p, i) => (
                <motion.div key={i} className="about-pipeline-step" variants={fadeUp}>
                  <span className="about-pipeline-number">{p.step}</span>
                  <h3 className="about-pipeline-title">{p.title}</h3>
                  <p className="about-pipeline-desc">{p.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <motion.footer
        className="about-footer"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeUp}
      >
        <div className="about-footer-top">
          <div className="about-footer-brand">
            <h3>OSINT<span>//</span>PLATFORM</h3>
            <p>Mapping the invisible footprint, one trace at a time.</p>
          </div>

          <div className="about-footer-col">
            <h4>NAVIGATION</h4>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/about">About</Link>
            <Link to="/login">Login</Link>
          </div>

          <div className="about-footer-col about-footer-cta">
            <h4>START INVESTIGATING</h4>
            <p>Create an account and run your first scan in minutes.</p>
            <Link to="/login" className="about-footer-btn">GET STARTED →</Link>
          </div>
        </div>

        <div className="about-footer-bottom">
          <span>© 2026 OSINT PLATFORM</span>
          <span>BUILT FOR ETHICAL, TRANSPARENT INVESTIGATION</span>
        </div>
      </motion.footer>
    </div>
  )
}

export default About