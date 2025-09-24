import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LandingPage from './LandingPage.tsx'
import SentimentDashboard from './SentimentDashboard.tsx'
import TradingBot from './TradingBot.tsx'

// define routes
const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/app', element: <App /> },
  { path: '/dashboard', element: <SentimentDashboard /> },
  { path: '/bot', element: <TradingBot /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
