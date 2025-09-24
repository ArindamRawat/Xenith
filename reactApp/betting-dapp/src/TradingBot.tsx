import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchSentimentHistory, getCurrentSentiment, saveSentimentSample } from './aptos'
import type { SentimentSample } from './aptos'
import { Link } from 'react-router-dom'
import './App.css'

type Strategy = 'follow' | 'inverse'

type Position = {
  direction: 1 | -1 // 1 = long, -1 = short
  entryPrice: number
  entryTime: number
}

function generatePricePath(points: number, start = 100, vol = 0.5) {
  const arr: number[] = [start]
  for (let i = 1; i < points; i++) {
    const drift = 0
    const shock = (Math.random() - 0.5) * vol
    arr.push(Math.max(1, arr[i - 1] * (1 + drift + shock / 100)))
  }
  return arr
}

export default function TradingBot() {
  const [strategy, setStrategy] = useState<Strategy>('follow')
  const [running, setRunning] = useState(false)
  const [equity, setEquity] = useState(1000)
  const [pos, setPos] = useState<Position | null>(null)
  const [history, setHistory] = useState<SentimentSample[]>([])
  const [log, setLog] = useState<string[]>([])
  const [useMock, setUseMock] = useState(true)
  const [tickMs, setTickMs] = useState<number>(300)
  const priceSeries = useMemo(() => generatePricePath(1000, 100, 0.6), [])
  const priceIdx = useRef(0)
  const mockIdx = useRef(0)

  const appendLog = useCallback((s: string) => setLog(prev => [s, ...prev].slice(0, 200)), [])

  // Fetch / initialize sentiment history
  useEffect(() => {
    ;(async () => {
      if (useMock) {
        const now = Date.now()
        const xs: SentimentSample[] = []
        const total = 180
        for (let i = 0; i < total; i++) {
          const phase = (i / total) * Math.PI * 6
          const base = 50 + Math.sin(phase) * 10
          const noise = (Math.random() - 0.5) * 4
          const score = Math.max(0, Math.min(100, Math.round(base + noise)))
          const prev = xs[xs.length - 1]?.score ?? score
          const trend = score === prev ? 1 : score > prev ? 2 : 0
          const t = now - (total - i) * 15000
          xs.push({ t, score, trend })
        }
        setHistory(xs)
        return
      }
      try {
        const res = await fetchSentimentHistory()
        setHistory(res.history.slice(-300))
      } catch {
        setUseMock(true)
      }
    })()
  }, [useMock])

  const latestSentiment = useCallback(async (): Promise<number> => {
    if (useMock) {
      const i = mockIdx.current++
      const phase = (i % 240) / 240 * Math.PI * 4
      const base = 50 + Math.sin(phase) * 12
      const noise = (Math.random() - 0.5) * 5
      const score = Math.max(0, Math.min(100, Math.round(base + noise)))
      const prev = history[history.length - 1]?.score ?? score
      const trend = score === prev ? 1 : score > prev ? 2 : 0
      const sample: SentimentSample = { t: Date.now(), score, trend }
      setHistory(h => [...h, sample].slice(-500))
      return score
    }
    try {
      const cur = await getCurrentSentiment()
      const sample: SentimentSample = { t: Date.now(), score: cur.score, trend: cur.trend }
      setHistory(h => [...h, sample].slice(-500))
      try { await saveSentimentSample(sample) } catch {}
      return cur.score
    } catch {
      return history[history.length - 1]?.score ?? 50
    }
  }, [history, useMock])

  const step = useCallback(async () => {
    const score = await latestSentiment()
    const price = priceSeries[Math.min(priceIdx.current, priceSeries.length - 1)]
    priceIdx.current = Math.min(priceIdx.current + 1, priceSeries.length - 1)

    const wantLong = strategy === 'follow' ? score >= 55 : score <= 45
    const wantShort = strategy === 'follow' ? score <= 45 : score >= 55

    if (!pos && (wantLong || wantShort)) {
      const dir: 1 | -1 = wantLong ? 1 : -1
      setPos({ direction: dir, entryPrice: price, entryTime: Date.now() })
      appendLog(`Open ${dir === 1 ? 'LONG' : 'SHORT'} at ${price.toFixed(2)} (score ${score})`)
      return
    }

    if (pos) {
      const pnl = (price - pos.entryPrice) / pos.entryPrice * (pos.direction)
      const shouldExit = Math.abs(pnl) >= 0.02 || (strategy === 'follow' ? (wantShort && pos.direction === 1) || (wantLong && pos.direction === -1) : (wantLong && pos.direction === 1) || (wantShort && pos.direction === -1))
      if (shouldExit) {
        const gain = equity * pnl
        setEquity(e => e + gain)
        appendLog(`Close ${pos.direction === 1 ? 'LONG' : 'SHORT'} at ${price.toFixed(2)} | PnL ${(gain).toFixed(2)}`)
        setPos(null)
      }
    }
  }, [appendLog, equity, latestSentiment, pos, priceSeries, strategy])

  useEffect(() => {
    if (!running) return
    const id = setInterval(step, Math.max(50, tickMs))
    return () => clearInterval(id)
  }, [running, step, tickMs])

  const chart = useMemo(() => {
    const xs = history.slice(-200)
    if (xs.length === 0) return null
    const width = 1000
    const height = 300
    const padding = 32
    const stepX = (width - padding * 2) / Math.max(xs.length - 1, 1)
    const scaleY = (val: number) => padding + (100 - val) * ((height - padding * 2) / (100 - 0))
    const points = xs.map((s, i) => `${padding + i * stepX},${scaleY(s.score)}`).join(' ')
    return (
      <svg width={width} height={height} style={{ width: '100%', maxWidth: '100%' }}>
        <polyline points={points} fill="none" stroke="#7dd3fc" strokeWidth={3} />
      </svg>
    )
  }, [history])

  return (
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      
      {/* Nav Bar */}
      <div className="navbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div className="logo">
          <Link to="/app" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>Xenith</Link>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Sentiment</Link>
          <Link to="/bot" style={{ color: 'white', textDecoration: 'none' }}>Trading Bot</Link>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="hero-card" style={{
        backgroundColor: '#1e1e2f',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>🤖 Automated Trading Bot</h1>
        <p style={{ color: '#cbd5e1', marginBottom: 12 }}>Simulated strategy based on sentiment signals</p>
        <div className="row" style={{ gap: 16, flexWrap: 'wrap', fontSize: '1.2rem' }}>
          <div><b>Equity:</b> {equity.toFixed(2)}</div>
          <div><b>Position:</b> {pos ? (pos.direction === 1 ? 'LONG' : 'SHORT') : 'None'}</div>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24, minHeight: 250 }}>
          <h3>Settings</h3>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)}>
              <option value="follow">Follow crowd</option>
              <option value="inverse">Inverse crowd</option>
            </select>
            <button onClick={() => setRunning(r => !r)}>{running ? 'Stop' : 'Start'}</button>
            <label className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} />
              <span className="muted">Use mock data</span>
            </label>
            <label className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className="muted">Speed (ms)</span>
              <input
                type="number"
                value={tickMs}
                min={50}
                step={50}
                onChange={(e) => setTickMs(Number(e.target.value) || 300)}
                style={{ width: 90 }}
              />
            </label>
          </div>
        </div>

        <div className="card" style={{ padding: 24, minHeight: 350 }}>
          <h3>Recent Sentiment</h3>
          {chart ?? <div className="muted">Loading…</div>}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 20, minHeight: 220 }}>
        <h3>Log</h3>
        <div className="col" style={{ maxHeight: 250, overflowY: 'auto', gap: 6 }}>
          {log.map((l, i) => (
            <div key={i} className="muted">{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
