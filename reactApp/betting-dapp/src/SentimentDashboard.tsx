import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentSentiment, interpretSentiment, fetchSentimentHistory, saveSentimentSample } from './aptos'
import './App.css'

type Sample = { t: number; score: number; trend: number }

function useSentimentHistory() {
  const [samples, setSamples] = useState<Sample[]>(() => {
    try {
      const raw = localStorage.getItem('sentiment_history')
      return raw ? (JSON.parse(raw) as Sample[]) : []
    } catch {
      return []
    }
  })

  const pushSample = useCallback((s: Sample) => {
    setSamples(prev => {
      const next = [...prev, s].slice(-200)
      try { localStorage.setItem('sentiment_history', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSamples([])
    try { localStorage.removeItem('sentiment_history') } catch {}
  }, [])

  return { samples, pushSample, clear }
}

export default function SentimentDashboard() {
  const { samples, pushSample, clear } = useSentimentHistory()
  const [current, setCurrent] = useState<{ score: number; trend: number; lastUpdate: number } | null>(null)
  const [interp, setInterp] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const s = await getCurrentSentiment()
      setCurrent(s)
      pushSample({ t: Date.now(), score: s.score, trend: s.trend })
      const label = await interpretSentiment(s.score)
      setInterp(label)
      try { await saveSentimentSample({ t: Date.now(), score: s.score, trend: s.trend }) } catch {}
    } catch (e: any) {
      setError(e.message || String(e))
    }
  }, [pushSample])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchSentimentHistory()
        if (Array.isArray(data.history) && data.history.length) {
          const recent = data.history.slice(-200)
          for (const s of recent) pushSample(s)
        } else {
          const now = Date.now()
          const synthesized: { t: number; score: number; trend: number }[] = []
          const total = 120
          for (let i = 0; i < total; i++) {
            const phase = (i / total) * Math.PI * 4
            const base = 50 + Math.sin(phase) * 12
            const noise = (Math.random() - 0.5) * 6
            const score = Math.max(0, Math.min(100, Math.round(base + noise)))
            const prev = synthesized[synthesized.length - 1]?.score ?? score
            const trend = score === prev ? 1 : score > prev ? 2 : 0
            const t = now - (total - i) * 30000
            synthesized.push({ t, score, trend })
          }
          for (const s of synthesized) {
            pushSample(s)
            try { await saveSentimentSample(s) } catch {}
          }
        }
      } catch {}
      await poll()
    })()
    const id = setInterval(poll, 12000)
    return () => clearInterval(id)
  }, [poll, pushSample])

  const chart = useMemo(() => {
    if (samples.length === 0) return null
    const width = 800
    const height = 200
    const padding = 24
    const xs = samples
    const minScore = 0
    const maxScore = 100
    const stepX = (width - padding * 2) / Math.max(xs.length - 1, 1)
    const scaleY = (val: number) => padding + (maxScore - val) * ((height - padding * 2) / (maxScore - minScore))
    const points = xs.map((s, i) => `${padding + i * stepX},${scaleY(s.score)}`).join(' ')
    return (
      <svg width={width} height={height} style={{ width: '100%', maxWidth: width }}>
        <defs>
          <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#ff00e5" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="url(#grad)" strokeWidth={2} />
        <rect x={padding} y={scaleY(80)} width={width - padding * 2} height={scaleY(0) - scaleY(80)} fill="rgba(255,0,229,0.06)" />
        <rect x={padding} y={scaleY(20)} width={width - padding * 2} height={scaleY(20) - scaleY(100)} fill="rgba(0,240,255,0.06)" />
        <line x1={padding} y1={scaleY(50)} x2={width - padding} y2={scaleY(50)} stroke="#243047" strokeDasharray="4 4" />
        <text x={8} y={scaleY(80)} fill="#94a3b8" fontSize="10">80</text>
        <text x={8} y={scaleY(50)} fill="#94a3b8" fontSize="10">50</text>
        <text x={8} y={scaleY(20)} fill="#94a3b8" fontSize="10">20</text>
      </svg>
    )
  }, [samples])

  const contrarian = useMemo(() => {
    const s = current?.score ?? 50
    if (s < 20) return { label: 'Contrarian BUY (Extreme Fear)', color: '#22ff88' }
    if (s > 80) return { label: 'Contrarian SELL (Extreme Greed)', color: '#ff4d4d' }
    return { label: 'Neutral / Observe', color: '#94a3b8' }
  }, [current])

  return (
    <div className="bg-grid">

      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 20px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        borderRadius: '8px'
      }}>
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/app" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.2rem' }}>Xenith</Link>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Sentiment Dashboard</Link>
          <Link to="/bot" style={{ color: 'white', textDecoration: 'none' }}>Trading Bot</Link>
        </div>
      </nav>

      <div className="hero-card" style={{
  backgroundColor: '#1e1e2f',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '20px',
  color: 'white',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '20px'
}}>
  <div>
    <div className="tag" style={{ color: '#94a3b8', marginBottom: '4px' }}>Xenith • Analytics</div>
    <h1 style={{ fontSize: '2rem', margin: 0 }}>Sentiment Dashboard</h1>
    <p style={{ marginTop: '8px', color: '#cbd5e1' }}>Historical sentiment, trend bands, and contrarian highlights.</p>
  </div>
  <div className="current-sentiment" style={{
    backgroundColor: '#11121b',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '200px',
    textAlign: 'center'
  }}>
    <div className="muted" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Now</div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '4px 0' }}>
      Score: {current?.score ?? '-'}
    </div>
    <div style={{ fontSize: '1rem' }}>
      Trend: {current ? (current.trend === 0 ? 'Down' : current.trend === 1 ? 'Stable' : 'Up') : '-'}
    </div>
    <div className="muted" style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
      {interp}
    </div>
  </div>
</div>

      <div className="card">
        <h3>Fear/Greed Over Time</h3>
        {chart ?? <div className="muted">Collecting data…</div>}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <div className="muted">Last {samples.length} samples • saved locally</div>
          <button onClick={clear}>Clear History</button>
        </div>
      </div>

      <div className="card">
        <h3>Contrarian Signal</h3>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ color: contrarian.color }}>{contrarian.label}</div>
          <div className="muted">Rule: Buy {'<'} 20 • Sell {'>'} 80</div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: '#b91c1c' }}>
          <b style={{ color: '#fca5a5' }}>Error:</b> {error}
        </div>
      )}
    </div>
  )
}
