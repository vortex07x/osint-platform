import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

function Dashboard() {
  const [scans, setScans] = useState([])
  const [targetIdentifier, setTargetIdentifier] = useState('')
  const [scanType, setScanType] = useState('username')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchScans = async () => {
    try {
      const response = await axios.get(`${API_URL}/scans/`)
      setScans(response.data.reverse())
    } catch (error) {
      console.error('Error fetching scans:', error)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [])

  const handleCreateScan = async (e) => {
    e.preventDefault()
    if (!targetIdentifier.trim()) return

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/scans/`, {
        target_identifier: targetIdentifier,
        scan_type: scanType,
        config_json: {}
      })

      if (scanType === 'username') {
        await axios.post(`${API_URL}/scans/${res.data.id}/scan-github-async/${targetIdentifier}`)
      }

      setTargetIdentifier('')
      fetchScans()
    } catch (error) {
      console.error('Error creating scan:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#4ADE80'
      case 'running': case 'queued': return '#FF4D2D'
      case 'failed': return '#EF4444'
      default: return '#888'
    }
  }

  return (
    <div className="page">
      <div className="dotted-grid" />

      <header className="dashboard-header">
        <h1 className="brand-title">OSINT // PLATFORM</h1>
        <p className="brand-subtitle">MAPPING THE INVISIBLE FOOTPRINT</p>
      </header>

      <form onSubmit={handleCreateScan} className="scan-form">
        <input
          type="text"
          placeholder="ENTER TARGET (username, email...)"
          value={targetIdentifier}
          onChange={(e) => setTargetIdentifier(e.target.value)}
          className="input-field"
        />
        <select
          value={scanType}
          onChange={(e) => setScanType(e.target.value)}
          className="select-field"
        >
          <option value="username">USERNAME</option>
          <option value="email">EMAIL</option>
          <option value="domain">DOMAIN</option>
        </select>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'QUEUING...' : 'START SCAN'}
        </button>
      </form>

      <h2 className="section-label">// INVESTIGATIONS</h2>

      {scans.length === 0 ? (
        <p className="empty-state">NO SCANS YET</p>
      ) : (
        <div className="scan-list">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="scan-card"
              onClick={() => navigate(`/scan/${scan.id}`)}
            >
              <div className="scan-card-main">
                <span className="scan-target">{scan.target_identifier}</span>
                <span className="scan-type">{scan.scan_type}</span>
              </div>
              <div className="scan-card-meta">
                <span
                  className="status-badge"
                  style={{ borderColor: statusColor(scan.status), color: statusColor(scan.status) }}
                >
                  {scan.status}
                </span>
                <span className="scan-date">
                  {new Date(scan.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard