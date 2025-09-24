import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import {
  connectWallet,
  getAccountAddress,
  getCurrentSentiment,
  getTradingSignal,
  getUserPosition,
  getTreasuryBalance,
  interpretSentiment,
  placeBet,
  resolveBet,
  aptToOctas,
  saveBet,
  fetchBets,
} from './aptos'

function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sentiment, setSentiment] = useState<{ score: number; trend: number; lastUpdate: number } | null>(null)
  const [signal, setSignal] = useState<{ type: number; confidence: number; generatedAt: number } | null>(null)
  const [position, setPosition] = useState<{ amount: number; direction: number; entrySentiment: number; active: boolean } | null>(null)
  const [treasury, setTreasury] = useState<number | null>(null)
  const [interpret, setInterpret] = useState<string>('')
  const [rpcUrl, setRpcUrl] = useState<string>(() => {
    try { return localStorage.getItem('aptos_rpc_url') || '' } catch { return '' }
  })
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)

  const [betDirection, setBetDirection] = useState<0 | 1>(1)
  const [betAmount, setBetAmount] = useState<string>('0.1')
  const [leaderboard, setLeaderboard] = useState<{ address: string; totalBets: number; totalVolumeOctas: number }[]>([])

  const fetchAll = useCallback(async (addr: string | null) => {
    try {
      if (Date.now() < cooldownUntil) return
      const [s, sig, t] = await Promise.all([
        getCurrentSentiment(),
        getTradingSignal(),
        getTreasuryBalance(),
      ])
      setSentiment(s)
      setSignal(sig)
      setTreasury(t)
      const interp = await interpretSentiment(s.score)
      setInterpret(interp)
      if (addr) {
        const pos = await getUserPosition(addr)
        setPosition(pos)
      } else {
        setPosition(null)
      }
      try {
        const data = await fetchBets()
        const map = new Map<string, { address: string; totalBets: number; totalVolumeOctas: number }>()
        for (const b of data.bets) {
          const prev = map.get(b.address) || { address: b.address, totalBets: 0, totalVolumeOctas: 0 }
          prev.totalBets += 1
          prev.totalVolumeOctas += Number(b.amountOctas)
          map.set(b.address, prev)
        }
        const arr = Array.from(map.values()).sort((a, b) => b.totalVolumeOctas - a.totalVolumeOctas)
        setLeaderboard(arr)
      } catch {}
    } catch (e: any) {
      const msg = e.message || String(e)
      setError(msg)
      if (msg.includes('429')) {
        setCooldownUntil(Date.now() + 30_000)
      }
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const addr = await getAccountAddress()
      setAddress(addr)
      await fetchAll(addr)
    })()
    const id = setInterval(async () => {
      await fetchAll(address)
    }, 12000)
    return () => clearInterval(id)
  }, [fetchAll])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const addr = await connectWallet()
      setAddress(addr)
      await fetchAll(addr)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setConnecting(false)
    }
  }, [fetchAll])

  const onPlaceBet = useCallback(async () => {
    if (!address) return setError('Connect wallet first')
    setLoading(true)
    setError(null)
    try {
      const octas = aptToOctas(Number(betAmount))
      const txHash = await placeBet(betDirection, octas)
      const entrySent = sentiment?.score ?? 0
      try {
        await saveBet({
          id: `${address}-${Date.now()}`,
          address,
          direction: betDirection,
          amountOctas: octas,
          entrySentiment: entrySent,
          createdAt: Date.now(),
          txHash,
          status: 'active',
        })
      } catch {}
      await fetchAll(address)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [address, betAmount, betDirection, fetchAll, sentiment])

  const onResolve = useCallback(async () => {
    if (!address) return setError('Connect wallet first')
    setLoading(true)
    setError(null)
    try {
      const txHash = await resolveBet()
      try {
        const data = await fetchBets()
        const last = [...data.bets].reverse().find(b => b.address === address && b.status === 'active')
        if (last) {
          await saveBet({ ...last, status: 'resolved', resolvedAt: Date.now(), txHash })
        }
      } catch {}
      await fetchAll(address)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [address, fetchAll])

  const trendText = useMemo(() => {
    if (!sentiment) return '-'
    return sentiment.trend === 0 ? 'Down' : sentiment.trend === 1 ? 'Stable' : 'Up'
  }, [sentiment])

  const signalText = useMemo(() => {
    if (!signal) return '-'
    return signal.type === 0 ? 'SELL' : signal.type === 1 ? 'HOLD' : 'BUY'
  }, [signal])

  return (
    <div className="container" style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
      
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
        <div className="nav-right">
          <button onClick={connect} disabled={connecting} style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            {connecting ? 'Connecting…' : address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* Main grid */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Live Sentiment - big card */}
        <div className="card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
          <h2>📊 Live Sentiment</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sentiment?.score ?? '-'}</div>
              <div>Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{trendText}</div>
              <div>Trend</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{signalText}</div>
              <div>Signal</div>
              <div>Confidence: {signal?.confidence ?? '-'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{treasury ?? '-'}</div>
              <div>Treasury</div>
              <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{interpret}</div>
            </div>
          </div>
        </div>

        {/* Betting */}
        <div className="card" style={{ padding: '20px' }}>
          <h2>🎯 Place Bet</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select value={betDirection} onChange={(e) => setBetDirection(Number(e.target.value) as 0 | 1)}>
              <option value={1}>UP</option>
              <option value={0}>DOWN</option>
            </select>
            <input
              type="number"
              step="0.00000001"
              min="0"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount in APT"
            />
            <button onClick={onPlaceBet} disabled={loading}>
              {loading ? 'Submitting…' : 'Place Bet'}
            </button>
            <button onClick={onResolve} disabled={loading}>
              {loading ? 'Resolving…' : 'Resolve Bet'}
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card" style={{ padding: '20px' }}>
          <h2>🏆 Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <div className="muted">No bets yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((r, i) => (
                <div key={r.address} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>#{i + 1}</div>
                  <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.address}</div>
                  <div><b>Bets:</b> {r.totalBets}</div>
                  <div><b>Volume:</b> {r.totalVolumeOctas}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="card" style={{ borderColor: '#b91c1c', marginTop: '20px', padding: '10px' }}>
            <b style={{ color: '#fca5a5' }}>Error:</b> {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
