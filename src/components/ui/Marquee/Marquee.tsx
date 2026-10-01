import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../../../lib/gsap'

interface Props {
  items: string[]
  /** seconds for one full loop */
  speed?: number
  tone?: 'ember' | 'gold' | 'bok'
  reverse?: boolean
  className?: string
}

const separatorTone = {
  ember: 'text-ember-light',
  gold: 'text-gold',
  bok: 'text-bok-gold',
}

/** Endless ticker that speeds up with scroll velocity (GSAP + ScrollTrigger). */
export default function Marquee({ items, speed = 40, tone = 'gold', reverse = false, className = '' }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!track.current || prefersReducedMotion()) return

      const loop = gsap.fromTo(
        track.current,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration: speed, ease: 'none', repeat: -1 },
      )

      // Kick the ticker forward when the page scrolls fast, then ease back to cruising speed.
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 5)
          gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true })
          gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' })
        },
      })
    },
    { scope: root, dependencies: [speed, reverse] },
  )

  const row = (hidden: boolean) =>
    items.map((item, i) => (
      <span key={`${hidden}-${i}`} aria-hidden={hidden || undefined} className="flex items-center gap-10 pr-10">
        <span className="font-display uppercase text-3xl sm:text-5xl tracking-wide whitespace-nowrap">{item}</span>
        <span className={`text-xl ${separatorTone[tone]}`}>✦</span>
      </span>
    ))

  return (
    <div ref={root} className={`relative overflow-hidden py-8 select-none ${className}`}>
      <div ref={track} className="flex w-max will-change-transform">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
