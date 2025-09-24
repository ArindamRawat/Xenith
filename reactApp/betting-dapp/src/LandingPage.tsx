import { useNavigate } from 'react-router-dom'
import './App.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center', paddingTop: '12vh' }}>
      <h1
        style={{
          fontSize: '4rem',
          color: '#ff6600',
          textShadow: '0 0 25px #ff0099, 0 0 50px #6a0dad',
          fontFamily: 'Orbitron, sans-serif',
          letterSpacing: '3px',
        }}
      >
        ✦ Xenith ✦
      </h1>

      <p
        style={{
          maxWidth: 650,
          margin: '30px auto',
          fontSize: '1.3rem',
          color: '#e0e0e0',
          lineHeight: '1.6',
          textShadow: '0 0 8px rgba(255, 102, 0, 0.8)',
        }}
      >
        Step into <b style={{ color: '#ff0099' }}>Xenith</b> — A
        sentiment betting protocol where markets pulse with social emotions.  
        Predict the crowd, place your bets, and rise on the leaderboard.
      </p>

      <button
        onClick={() => navigate('/app')}
        style={{
          fontSize: '1.3rem',
          marginTop: '40px',
          padding: '14px 28px',
          borderRadius: '14px',
          background: 'linear-gradient(90deg, #ff6600, #ff0099)',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 0 20px #ff0099, 0 0 25px #ff6600',
          transition: 'all 0.25s ease-in-out',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow =
            '0 0 30px #ff6600, 0 0 35px #ff0099')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow =
            '0 0 20px #ff0099, 0 0 25px #ff6600')
        }
      >
        Enter Xenith →
      </button>

      <div style={{ marginTop: '18px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            fontSize: '1.1rem',
            marginTop: '8px',
            padding: '12px 22px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #00f0ff, #ff00e5)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 18px rgba(0,240,255,0.6)',
            transition: 'all 0.25s ease-in-out',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 0 26px rgba(255,0,229,0.8)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 0 18px rgba(0,240,255,0.6)')
          }
        >
          View Sentiment Dashboard →
        </button>
      </div>

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={() => navigate('/bot')}
          style={{
            fontSize: '1.1rem',
            marginTop: '8px',
            padding: '12px 22px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #7dd3fc, #34d399)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 0 18px rgba(52,211,153,0.6)',
            transition: 'all 0.25s ease-in-out',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 0 26px rgba(125,211,252,0.8)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow =
              '0 0 18px rgba(52,211,153,0.6)')
          }
        >
          Open Trading Bot Simulation →
        </button>
      </div>
    </div>
  )
}
