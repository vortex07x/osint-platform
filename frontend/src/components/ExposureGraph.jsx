import { useRef, useEffect, useState, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

const NODE_COLORS = {
  target: '#FF4D2D',
  source: '#4ADE80',
  entity: '#60A5FA',
  exposure: '#FBBF24',
}

const NODE_SIZES = {
  target: 10,
  source: 6,
  entity: 5,
  exposure: 7,
}

function ExposureGraph({ scanId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 })
  const containerRef = useRef()
  const fgRef = useRef()

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await axios.get(`${API_URL}/scans/${scanId}/graph`)
        setGraphData(res.data)
      } catch (err) {
        console.error('Error fetching graph:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGraph()
  }, [scanId])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 550
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Spread nodes out more strongly
      fgRef.current.d3Force('charge').strength(-250)
      fgRef.current.d3Force('link').distance(90)

      // Auto-fit the view once physics settles
      const timer = setTimeout(() => {
        fgRef.current.zoomToFit(400, 60)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [graphData])

  const getNodeLabel = useCallback((node) => {
    if (node.type === 'target') return `TARGET: ${node.name}`
    if (node.type === 'source') return `SOURCE: ${node.platform}`
    if (node.type === 'entity') return `ENTITY: ${node.value}`
    if (node.type === 'exposure') return `EXPOSURE: ${node.title} (${node.severity})`
    return node.id
  }, [])

  if (loading) {
    return <p className="empty-state-small">Loading graph...</p>
  }

  if (graphData.nodes.length === 0) {
    return <p className="empty-state-small">No graph data available yet.</p>
  }

  return (
    <div
      ref={containerRef}
      style={{ border: '1px solid #2A2D35', borderRadius: '8px', overflow: 'hidden', background: '#0F1115', width: '100%' }}
    >
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        nodeLabel={getNodeLabel}
        nodeColor={(node) => NODE_COLORS[node.type] || '#888'}
        nodeVal={(node) => NODE_SIZES[node.type] || 4}
        linkColor={() => '#2A2D35'}
        linkWidth={1}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => '#FF4D2D'}
        backgroundColor="#0F1115"
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label =
            node.type === 'target' ? node.name :
            node.type === 'source' ? node.platform :
            node.type === 'entity' ? node.value :
            node.type === 'exposure' ? node.severity :
            ''
          const fontSize = 11 / globalScale
          ctx.font = `${fontSize}px 'JetBrains Mono', monospace`
          ctx.fillStyle = '#9CA3AF'
          ctx.textAlign = 'center'
          ctx.fillText(String(label).slice(0, 22), node.x, node.y + 12)
        }}
      />
    </div>
  )
}

export default ExposureGraph