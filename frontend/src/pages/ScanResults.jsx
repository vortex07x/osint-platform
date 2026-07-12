import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ExposureGraph from '../components/ExposureGraph'
import LocationMap from '../components/LocationMap'
import ExpandablePanel from '../components/ExpandablePanel'
import { useRef } from 'react'
import { PlatformIcon, getPlatformLabel } from '../utils/platformIcons'
import { getPlatformSettingsUrl } from '../utils/platformSettings'
import ExposureModal from '../components/ExposureModal'

const API_URL = import.meta.env.VITE_API_URL

function ScanResults() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const statusRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [selectedExposure, setSelectedExposure] = useState(null)

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/scans/${scanId}/full-report`)
      setReport(res.data)
      statusRef.current = res.data.status
      setError(null)
    } catch (err) {
      setError('Scan not found or failed to load.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMonitoring = async () => {
    setToggling(true)
    try {
      await axios.patch(`${API_URL}/scans/${scanId}/monitoring`, {
        is_monitored: !report.is_monitored,
        scan_interval_hours: report.scan_interval_hours || 24
      })
      fetchReport()
    } catch (err) {
      console.error('Error toggling monitoring:', err)
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    fetchReport()
    const interval = setInterval(() => {
      if (statusRef.current !== 'completed' && statusRef.current !== 'failed') {
        fetchReport()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [scanId])

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

  const getPlatformsForExposure = (exposure) => {
  const entityIds = new Set(exposure.affected_entities)
  const sourceIds = new Set(
    report.entities
      .filter((e) => entityIds.has(e.id) && e.source_id)
      .map((e) => e.source_id)
  )
  const platforms = new Set(
    report.sources.filter((s) => sourceIds.has(s.id)).map((s) => s.platform)
  )
  return [...platforms]
}

  return (
    <div className="page">
      <div className="dotted-grid" />

      <button className="back-link" onClick={() => navigate('/dashboard')}>← BACK TO DASHBOARD</button>

      <header className="dashboard-header">
        <div className="header-top-row">
          <div>
            <h1 className="brand-title">{report.target_identifier}</h1>
            <p className="brand-subtitle">
              SCAN TYPE: {report.scan_type.toUpperCase()} · STATUS:{' '}
              <span style={{ color: report.status === 'completed' ? '#4ADE80' : '#FF4D2D' }}>
                {report.status.toUpperCase()}
              </span>
            </p>
          </div>

          {report.scan_type === 'username' && (
            <button
              className={`monitor-toggle ${report.is_monitored ? 'active' : ''}`}
              onClick={handleToggleMonitoring}
              disabled={toggling}
            >
              <span className="monitor-dot" />
              {report.is_monitored ? 'MONITORING ACTIVE' : 'ENABLE MONITORING'}
            </button>
          )}
        </div>
        {report.is_monitored && (
          <p className="monitor-info">
            AUTO-RESCANNING EVERY {report.scan_interval_hours}H · LAST CHECKED:{' '}
            {report.last_scanned_at ? new Date(report.last_scanned_at).toLocaleString() : 'PENDING FIRST CHECK'}
          </p>
        )}
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
              .map((exp, i) => {
                const platforms = getPlatformsForExposure(exp)
                return (
                  <div
                    key={exp.id}
                    className="exposure-card"
                    style={{
                      borderLeftColor: severityColor(exp.severity),
                      animationDelay: `${i * 0.08}s`,
                      '--exp-color': severityColor(exp.severity),
                      '--exp-delay': `${i * 0.08}s`
                    }}
                    onClick={() => setSelectedExposure({ exposure: exp, platforms })}
                  >
                    <div className="exposure-header">
                      <span className="exposure-title">{exp.title}</span>
                      <span className="risk-score-badge">{exp.risk_score}</span>
                    </div>
                    <p className="exposure-desc">{exp.description}</p>
                    {exp.recommendations && (
                      <p className="exposure-rec">→ {exp.recommendations}</p>
                    )}
                    {platforms.length > 0 && (
                      <div className="cleanup-links">
                        {platforms.map((platform) => {
                          const url = getPlatformSettingsUrl(platform)
                          if (!url) return null
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="cleanup-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PlatformIcon platform={platform} size={13} />
                              FIX ON {getPlatformLabel(platform)}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
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
        {report.sources.map((src) => (
  <div key={src.id} className="source-row">
    <span className="source-platform-badge">
      <PlatformIcon platform={src.platform} />
      <span className="source-platform">{getPlatformLabel(src.platform)}</span>
    </span>
    <a href={src.url} target="_blank" rel="noreferrer" className="source-url">{src.url}</a>
    <span className="source-date">{new Date(src.collected_at).toLocaleString()}</span>
  </div>
))}
      </div>

      {/* Exposure Graph */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <h2 className="section-label">// EXPOSURE GRAPH</h2>
        <ExpandablePanel title="Exposure Graph">
          <ExposureGraph scanId={scanId} />
        </ExpandablePanel>
      </div>

      {/* Location Map */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <h2 className="section-label">// GEOLOCATION MAP</h2>
        <ExpandablePanel title="Geolocation Map">
          <LocationMap scanId={scanId} />
        </ExpandablePanel>
      </div>

      {selectedExposure && (
        <ExposureModal
          exposure={selectedExposure.exposure}
          platforms={selectedExposure.platforms}
          onClose={() => setSelectedExposure(null)}
        />
      )}
    </div>
  )
}

export default ScanResults