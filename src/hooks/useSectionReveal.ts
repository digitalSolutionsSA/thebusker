import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'

/**
 * GSAP scroll reveals scoped to one section (the Automotive Colour House technique).
 * Mark elements inside the returned ref with these data attributes:
 *
 *   .mask-line > span       heading lines rise out of a mask, staggered
 *   [data-wipe]             image/panel uncovered by a clip-path wipe (value: left | right | up | down)
 *   [data-rule]             gold rule draws in from the left
 *   [data-zoom]             zooms down from 1.15 as it enters (parallax-ish settle)
 *   [data-parallax="12"]    drifts ±N% vertically while scrolling through (scrubbed)
 *   [data-stagger] > *      children rise in one after another
 *
 * Plain fade/slide reveals still use ScrollReveal via data-sr (see useScrollRevealPresets).
 */
export function useSectionReveal<T extends HTMLElement = HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const root = ref.current
      if (!root || prefersReducedMotion()) return
      const q = gsap.utils.selector(root)

      // Heading lines: group by their nearest heading so each heading triggers on its own
      const headings = new Set(q('.mask-line').map((l) => (l as HTMLElement).closest('h1,h2,h3,p,div') as HTMLElement))
      headings.forEach((h) => {
        gsap.from(h.querySelectorAll('.mask-line > span'), {
          yPercent: 115,
          rotate: 2,
          duration: 1.4,
          stagger: 0.11,
          ease: 'expo.out',
          scrollTrigger: { trigger: h, start: 'top 85%' },
        })
      })

      const wipeFrom: Record<string, string> = {
        left: 'inset(0 100% 0 0)',
        right: 'inset(0 0 0 100%)',
        up: 'inset(100% 0 0 0)',
        down: 'inset(0 0 100% 0)',
      }
      q('[data-wipe]').forEach((el) => {
        const dir = (el as HTMLElement).dataset.wipe || 'up'
        const img = el.querySelector('img')
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%' } })
        tl.fromTo(el, { clipPath: wipeFrom[dir] ?? wipeFrom.up }, { clipPath: 'inset(0 0 0 0)', duration: 1.5, ease: 'expo.inOut' })
        // clearProps hands the transform back to CSS afterwards, so hover zooms keep working
        if (img) tl.from(img, { scale: 1.35, duration: 2, ease: 'expo.out', clearProps: 'transform' }, 0.15)
      })

      q('[data-rule]').forEach((el) => {
        gsap.from(el, { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 90%' } })
      })

      q('[data-zoom]').forEach((el) => {
        gsap.fromTo(el, { scale: 1.15 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true },
        })
      })

      q('[data-parallax]').forEach((el) => {
        const amt = Number((el as HTMLElement).dataset.parallax) || 10
        gsap.fromTo(el, { yPercent: -amt }, {
          yPercent: amt,
          ease: 'none',
          scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })

      q('[data-stagger]').forEach((el) => {
        gsap.from(el.children, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      // Lazy images change heights after mount
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 400)
      return () => window.clearTimeout(t)
    },
    { scope: ref, dependencies: deps },
  )

  return ref
}
