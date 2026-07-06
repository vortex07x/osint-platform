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
      case 'running': case 'queued': return '#00D9FF'
      case 'failed': return '#EF4444'
      default: return '#5A7A8C'
    }
  }

  return (
    <div className="page">
      <div className="dotted-grid" />

      <header className="dashboard-header">
        <p className="page-tag">// INVESTIGATION CONSOLE</p>
        <h1 className="page-title">ACTIVE SCANS</h1>
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