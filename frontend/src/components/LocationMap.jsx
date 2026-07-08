import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_API_URL

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function FitBounds({ locations }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lon], 12)
    } else {
      const bounds = locations.map(loc => [loc.lat, loc.lon])
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [locations, map])

  return null
}

function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })

    const container = map.getContainer()
    observer.observe(container)

    return () => observer.disconnect()
  }, [map])

  return null
}

function LocationMap({ scanId }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_URL}/scans/${scanId}/locations`)
        setLocations(res.data.locations)
      } catch (err) {
        console.error('Error fetching locations:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [scanId])

  if (loading) {
    return <p className="empty-state-small">Loading map...</p>
  }

  if (locations.length === 0) {
    return <p className="empty-state-small">No geolocation data found for this scan.</p>
  }

  const center = [locations[0].lat, locations[0].lon]

  return (
    <div style={{ border: '1px solid #2A2D35', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={10} className="location-map-container">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitBounds locations={locations} />
        <MapResizeHandler />
        {locations.map((loc) => (
          <Marker key={loc.entity_id} position={[loc.lat, loc.lon]}>
            <Popup>
              <strong>{loc.label}</strong><br />
              Source: {loc.source === 'exif' ? 'Image GPS metadata' : 'Geocoded from text'}<br />
              {loc.lat.toFixed(6)}, {loc.lon.toFixed(6)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default LocationMap