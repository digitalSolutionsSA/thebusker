import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

// StrictMode is intentionally omitted: it double-mounts effects in development, which spins up
// duplicate WebGL contexts (hero scene, GL photos) and pinned ScrollTriggers.
createRoot(document.getElementById('root')!).render(<App />)
