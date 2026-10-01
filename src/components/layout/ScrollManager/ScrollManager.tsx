import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from '../../../lib/gsap'

/** Scrolls to the top (or to a #hash) on navigation and re-measures ScrollTriggers. */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  useEffect(() => {
    // Lazy pages, fonts and images change the layout after mount.
    const timers = [100, 600, 1500].map((ms) => window.setTimeout(() => ScrollTrigger.refresh(), ms))
    return () => timers.forEach(clearTimeout)
  }, [pathname])

  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return null
}
