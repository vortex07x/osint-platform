import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://127.0.0.1:8000'

function Dashboard() {
  const [scans, setScans] = useState([])
  const [targetIdentifier, setTargetIdentifier] = useState('')
  const [scanType, setScanType] = useState('username')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)

  const fetchScans = async () => {
    try {
      const response = await axios.get(`${API_URL}/scans/`)
      const sorted = [...response.data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
      setScans(sorted)
    } catch (error) {
      console.error('Error fetching scans:', error)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [])

  const handleCreateScan = async (e) => {
    e.preventDefault()

    if (scanType === 'image') {
      if (!selectedFile) return
      setLoading(true)
      try {
        const scanRes = await axios.post(`${API_URL}/scans/`, {
          target_identifier: selectedFile.name,
          scan_type: 'image',
          config_json: {}
        })

        const formData = new FormData()
        formData.append('file', selectedFile)

        await axios.post(`${API_URL}/scans/${scanRes.data.id}/scan-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        setSelectedFile(null)
        fetchScans()
      } catch (error) {
        console.error('Error creating image scan:', error)
      } finally {
        setLoading(false)
      }
      return
    }

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
        <div className="header-top-row">
          <div>
            <h1 className="brand-title">OSINT // PLATFORM</h1>
            <p className="brand-subtitle">MAPPING THE INVISIBLE FOOTPRINT</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
              {user?.email}
            </p>
            <button onClick={logout} className="back-link" style={{ marginBottom: 0 }}>
              LOGOUT →
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleCreateScan} className="scan-form">
        {scanType === 'image' ? (
          <label className="file-input-label">
            {selectedFile ? selectedFile.name : 'CHOOSE IMAGE FILE...'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
        ) : (
          <input
            type="text"
            placeholder="ENTER TARGET (username, email...)"
            value={targetIdentifier}
            onChange={(e) => setTargetIdentifier(e.target.value)}
            className="input-field"
          />
        )}
        <select
          value={scanType}
          onChange={(e) => setScanType(e.target.value)}
          className="select-field"
        >
          <option value="username">USERNAME</option>
          <option value="email">EMAIL</option>
          <option value="domain">DOMAIN</option>
          <option value="image">IMAGE</option>
        </select>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (scanType === 'image' ? 'ANALYZING IMAGE...' : 'QUEUING...') : 'START SCAN'}
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