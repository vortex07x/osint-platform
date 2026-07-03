import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

function ScanResults() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/scans/${scanId}/full-report`)
      setReport(res.data)
      setError(null)
    } catch (err) {
      setError('Scan not found or failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    const interval = setInterval(() => {
      if (report?.status !== 'completed' && report?.status !== 'failed') {
        fetchReport()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [scanId, report?.status])

  const severityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#EF4444'
      case 'high': return '#FF4D2D'
      case 'medium': return '#FBBF24'
      case 'low': return '#4ADE80'
      default: return '#888'
    }
  }

  if (loading) return <div className="page"><p className="empty-state">LOADING REPORT...</p></div>
  if (error) return <div className="page"><p className="empty-state">{error}</p></div>
  if (!report) return null

  const avgRisk = report.exposures.length
    ? Math.round(report.exposures.reduce((sum, e) => sum + e.risk_score, 0) / report.exposures.length)
    : 0

  const severityCounts = report.exposures.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page">
      <div className="dotted-grid" />

      <button className="back-link" onClick={() => navigate('/')}>← BACK TO DASHBOARD</button>

      <header className="dashboard-header">
        <h1 className="brand-title">{report.target_identifier}</h1>
        <p className="brand-subtitle">
          SCAN TYPE: {report.scan_type.toUpperCase()} · STATUS:{' '}
          <span style={{ color: report.status === 'completed' ? '#4ADE80' : '#FF4D2D' }}>
            {report.status.toUpperCase()}
          </span>
        </p>
      </header>

      {/* Risk Overview */}
      <div className="risk-overview">
        <div className="risk-stat">
          <span className="risk-stat-value">{report.exposures.length}</span>
          <span className="risk-stat-label">EXPOSURES</span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-value">{avgRisk}</span>
          <span className="risk-stat-label">AVG RISK SCORE</span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-value">{report.entities.length}</span>
          <span className="risk-stat-label">ENTITIES FOUND</span>
        </div>
        <div className="risk-stat">
          <span className="risk-stat-value">{report.sources.length}</span>
          <span className="risk-stat-label">SOURCES</span>
        </div>
      </div>

      <div className="severity-pills">
        {['critical', 'high', 'medium', 'low'].map((sev) =>
          severityCounts[sev] ? (
            <span key={sev} className="pill" style={{ borderColor: severityColor(sev), color: severityColor(sev) }}>
              {sev.toUpperCase()}: {severityCounts[sev]}
            </span>
          ) : null
        )}
      </div>

      <div className="results-grid">
        {/* Exposures */}
        <div className="panel">
          <h2 className="section-label">// EXPOSURES</h2>
          {report.exposures.length === 0 ? (
            <p className="empty-state-small">No exposures found yet.</p>
          ) : (
            [...report.exposures]
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((exp) => (
                <div key={exp.id} className="exposure-card" style={{ borderLeftColor: severityColor(exp.severity) }}>
                  <div className="exposure-header">
                    <span className="exposure-title">{exp.title}</span>
                    <span className="risk-score-badge">{exp.risk_score}</span>
                  </div>
                  <p className="exposure-desc">{exp.description}</p>
                  {exp.recommendations && (
                    <p className="exposure-rec">→ {exp.recommendations}</p>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Entities */}
        <div className="panel">
          <h2 className="section-label">// ENTITIES</h2>
          {report.entities.length === 0 ? (
            <p className="empty-state-small">No entities extracted yet.</p>
          ) : (
            report.entities.map((ent) => (
              <div key={ent.id} className="entity-row">
                <span className="entity-type">{ent.entity_type.replace('_', ' ').toUpperCase()}</span>
                <span className="entity-value">{ent.value}</span>
                <span className="entity-confidence">{Math.round(ent.confidence_score * 100)}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sources */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <h2 className="section-label">// SOURCES</h2>
        {report.sources.length === 0 ? (
          <p className="empty-state-small">No sources collected yet.</p>
        ) : (
          report.sources.map((src) => (
            <div key={src.id} className="source-row">
              <span className="source-platform">{src.platform.toUpperCase()}</span>
              <a href={src.url} target="_blank" rel="noreferrer" className="source-url">{src.url}</a>
              <span className="source-date">{new Date(src.collected_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ScanResults