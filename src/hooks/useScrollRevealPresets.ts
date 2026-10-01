import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ScrollReveal from 'scrollreveal'
import { prefersReducedMotion, ScrollTrigger } from '../lib/gsap'

const base: scrollReveal.ScrollRevealObjectOptions = {
  distance: '50px',
  duration: 1400,
  easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
  opacity: 0,
  viewFactor: 0.15,
  cleanup: true,
}

const presets: Record<string, scrollReveal.ScrollRevealObjectOptions> = {
  up: { origin: 'bottom' },
  down: { origin: 'top' },
  left: { origin: 'left' },
  right: { origin: 'right' },
  fade: { distance: '0px' },
  zoom: { distance: '0px', scale: 0.88 },
  flip: { distance: '30px', origin: 'bottom', rotate: { x: 25, y: 0, z: 0 } },
}

/**
 * ScrollReveal wired to markup: any element with data-sr="up|down|left|right|fade|zoom|flip"
 * (and optional data-sr-delay="150") reveals as it scrolls into view.
 * Re-scans on every route change, and again shortly after for content that loads late.
 */
export function useScrollRevealPresets() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (prefersReducedMotion()) return
    const sr = ScrollReveal()
    const done = new WeakSet<Element>()

    const scan = () => {
      document.querySelectorAll<HTMLElement>('[data-sr]').forEach((el) => {
        if (done.has(el)) return
        done.add(el)
        const preset = presets[el.dataset.sr ?? 'up'] ?? presets.up
        sr.reveal(el, { ...base, ...preset, delay: Number(el.dataset.srDelay ?? 0) })
      })
    }

    // ScrollReveal measures element positions once and only re-measures on window resize.
    // Pinned GSAP scenes, lazy images and route changes all move things afterwards, which would
    // leave stale positions (and sections stuck hidden), so re-measure after every layout refresh.
    const remeasure = () => (sr as unknown as { delegate?: (e: { type: string }) => void }).delegate?.({ type: 'resize' })

    scan()
    const timers = [300, 900, 2000].map((ms) =>
      window.setTimeout(() => {
        scan()
        remeasure()
      }, ms),
    )
    ScrollTrigger.addEventListener('refresh', remeasure)
    return () => {
      timers.forEach(clearTimeout)
      ScrollTrigger.removeEventListener('refresh', remeasure)
    }
  }, [pathname])
}
