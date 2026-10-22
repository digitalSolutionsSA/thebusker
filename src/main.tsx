import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import { fetchShows } from './lib/api'
import { ADMIN_BASE } from './config/site'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

// Ask for the shows now rather than once the page's chunk has loaded and mounted; the request is
// shared, so the sections that need it pick up the same one
if (!location.pathname.startsWith(ADMIN_BASE)) fetchShows().catch(() => {})

// StrictMode is intentionally omitted: it double-mounts effects in development, which spins up
// duplicate WebGL contexts (hero scene, GL photos) and pinned ScrollTriggers.
createRoot(document.getElementById('root')!).render(<App />)
