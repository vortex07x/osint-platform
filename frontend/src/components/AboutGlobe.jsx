import { useRef, useEffect, useState } from 'react'
import Globe from 'react-globe.gl'

const BLIP_POINTS = [
  { lat: 37.7749, lng: -122.4194, size: 0.4 },
  { lat: 40.7128, lng: -74.0060, size: 0.35 },
  { lat: 51.5074, lng: -0.1278, size: 0.35 },
  { lat: 48.8566, lng: 2.3522, size: 0.3 },
  { lat: 28.6139, lng: 77.2090, size: 0.4 },
  { lat: 23.5204, lng: 87.3119, size: 0.45 },
  { lat: 35.6762, lng: 139.6503, size: 0.35 },
  { lat: -33.8688, lng: 151.2093, size: 0.3 },
  { lat: -23.5505, lng: -46.6333, size: 0.3 },
  { lat: 55.7558, lng: 37.6173, size: 0.3 },
  { lat: 1.3521, lng: 103.8198, size: 0.3 },
]

function AboutGlobe() {
  const globeEl = useRef()
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
      controls.enablePan = false
      controls.enableRotate = false
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.5
      globeEl.current.pointOfView({ lat: 15, lng: 20, altitude: 2.1 }, 0)
    }
  }, [])

  return (
    <Globe
      ref={globeEl}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
      atmosphereColor="#00D9FF"
      atmosphereAltitude={0.2}
      pointsData={BLIP_POINTS}
      pointLat="lat"
      pointLng="lng"
      pointColor={() => '#00D9FF'}
      pointAltitude={0.01}
      pointRadius="size"
    />
  )
}

export default AboutGlobe