import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [scans, setScans] = useState([])
  const [targetIdentifier, setTargetIdentifier] = useState('')
  const [scanType, setScanType] = useState('username')
  const [loading, setLoading] = useState(false)

  const fetchScans = async () => {
    try {
      const response = await axios.get(`${API_URL}/scans/`)
      setScans(response.data)
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
      await axios.post(`${API_URL}/scans/`, {
        target_identifier: targetIdentifier,
        scan_type: scanType,
        config_json: {}
      })
      setTargetIdentifier('')
      fetchScans()
    } catch (error) {
      console.error('Error creating scan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>OSINT Platform</h1>

      <form onSubmit={handleCreateScan} style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Enter username, email, etc."
          value={targetIdentifier}
          onChange={(e) => setTargetIdentifier(e.target.value)}
          style={{ padding: '8px', marginRight: '10px', width: '250px' }}
        />
        <select
          value={scanType}
          onChange={(e) => setScanType(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="domain">Domain</option>
        </select>
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Creating...' : 'Start Scan'}
        </button>
      </form>

      <h2>Scans</h2>
      {scans.length === 0 ? (
        <p>No scans yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {scans.map((scan) => (
            <li key={scan.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '8px', borderRadius: '4px' }}>
              <strong>{scan.target_identifier}</strong> ({scan.scan_type}) — 
              <span style={{ marginLeft: '8px', color: scan.status === 'completed' ? 'green' : '#888' }}>
                {scan.status}
              </span>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Created: {new Date(scan.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App