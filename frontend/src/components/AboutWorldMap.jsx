import { useMemo, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

const BLIP_LOCATIONS = [
  { lat: 37.7749, lng: -122.4194, delay: 0 },
  { lat: 40.7128, lng: -74.0060, delay: 0.4 },
  { lat: 51.5074, lng: -0.1278, delay: 0.9 },
  { lat: 48.8566, lng: 2.3522, delay: 0.2 },
  { lat: 28.6139, lng: 77.2090, delay: 1.2 },
  { lat: 23.5204, lng: 87.3119, delay: 0.6 },
  { lat: 35.6762, lng: 139.6503, delay: 1.5 },
  { lat: 31.2304, lng: 121.4737, delay: 0.3 },
  { lat: -33.8688, lng: 151.2093, delay: 1.0 },
  { lat: -23.5505, lng: -46.6333, delay: 0.7 },
  { lat: 55.7558, lng: 37.6173, delay: 1.3 },
  { lat: 1.3521, lng: 103.8198, delay: 0.5 },
]

const MOBILE_BREAKPOINT = 768
// How much wider than the screen the map renders on mobile (2.4x = plenty to pan across)
const MOBILE_WIDTH_MULTIPLIER = 2.4

function AboutWorldMap() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = size.width <= MOBILE_BREAKPOINT
  const svgWidth = isMobile ? Math.round(size.width * MOBILE_WIDTH_MULTIPLIER) : size.width
  const svgHeight = size.height

  const { landPath, blips } = useMemo(() => {
    const world = feature(worldTopo, worldTopo.objects.countries)
    const projection = geoNaturalEarth1().fitSize([svgWidth, svgHeight * 0.9], world)
    const pathGenerator = geoPath(projection)

    const path = pathGenerator(world)
    const projectedBlips = BLIP_LOCATIONS.map((b) => {
      const [x, y] = projection([b.lng, b.lat])
      return { x, y, delay: b.delay }
    })

    return { landPath: path, blips: projectedBlips }
  }, [svgWidth, svgHeight])

  // Whole-page scroll progress drives horizontal pan — mobile only
  const { scrollYProgress } = useScroll()
  const maxPan = isMobile ? -(svgWidth - size.width) : 0
  const x = useTransform(scrollYProgress, [0, 1], [0, maxPan])

  return (
    <div className="about-world-map-wrap">
      <motion.svg
        width={svgWidth}
        height={svgHeight}
        className="about-world-map-svg"
        style={isMobile ? { x } : undefined}
      >
        <path d={landPath} className="about-world-map-fill" />
        {blips.map((b, i) => (
          <circle
            key={i}
            cx={b.x}
            cy={b.y}
            r={4}
            className="about-world-map-blip"
            style={{ animationDelay: `${b.delay}s` }}
          />
        ))}
      </motion.svg>
    </div>
  )
}

export default AboutWorldMap