import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'

/** Soft ember light that trails the cursor on desktop. */
export default function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const el = glow.current
    if (!el || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return

    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 })
    const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' })
    let shown = false

    const move = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY })
        gsap.to(el, { opacity: 1, duration: 1 })
        shown = true
      }
      xTo(e.clientX)
      yTo(e.clientY)
    }
    const leave = () => {
      gsap.to(el, { opacity: 0, duration: 0.6 })
      shown = false
    }

    window.addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  })

  return (
    <div
      ref={glow}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[34rem] w-[34rem] rounded-full opacity-0 mix-blend-screen [@media(pointer:fine)]:block"
      style={{ background: 'radial-gradient(closest-side, rgb(201 162 74 / 0.13), transparent)' }}
    />
  )
}
