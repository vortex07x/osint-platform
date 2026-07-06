import { useMemo } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopo from 'world-atlas/countries-110m.json'

const WIDTH = 950
const HEIGHT = 460

// Real city coordinates so blips sit exactly where the projection puts them
const BLIP_LOCATIONS = [
  { lat: 37.7749, lng: -122.4194, delay: 0 },    // San Francisco
  { lat: 40.7128, lng: -74.0060, delay: 0.4 },   // New York
  { lat: 51.5074, lng: -0.1278, delay: 0.9 },    // London
  { lat: 48.8566, lng: 2.3522, delay: 0.2 },     // Paris
  { lat: 28.6139, lng: 77.2090, delay: 1.2 },    // New Delhi
  { lat: 23.5204, lng: 87.3119, delay: 0.6 },    // Durgapur
  { lat: 35.6762, lng: 139.6503, delay: 1.5 },   // Tokyo
  { lat: 31.2304, lng: 121.4737, delay: 0.3 },   // Shanghai
  { lat: -33.8688, lng: 151.2093, delay: 1.0 },  // Sydney
  { lat: -23.5505, lng: -46.6333, delay: 0.7 },  // São Paulo
  { lat: 55.7558, lng: 37.6173, delay: 1.3 },    // Moscow
  { lat: 1.3521, lng: 103.8198, delay: 0.5 },    // Singapore
]

function WorldMapHUD() {
  const { landPath, blips } = useMemo(() => {
    const world = feature(worldTopo, worldTopo.objects.countries)
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], world)
    const pathGenerator = geoPath(projection)

    const path = pathGenerator(world)
    const projectedBlips = BLIP_LOCATIONS.map((b) => {
      const [x, y] = projection([b.lng, b.lat])
      return { x, y, delay: b.delay }
    })

    return { landPath: path, blips: projectedBlips }
  }, [])

  return (
    <div className="world-map-hud">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="world-map-svg">
        <path d={landPath} className="world-map-fill" />

        {blips.map((b, i) => (
          <circle
            key={i}
            cx={b.x}
            cy={b.y}
            r={3}
            className="world-map-blip"
            style={{ animationDelay: `${b.delay}s` }}
          />
        ))}
      </svg>
      <span className="world-map-label">GLOBAL SCAN NETWORK · AUTO</span>
    </div>
  )
}

export default WorldMapHUD