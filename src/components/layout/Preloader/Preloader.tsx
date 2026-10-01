import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { assetsSettled, markIntroDone } from '../../../lib/intro'
import Logo from '../../ui/Logo'

/**
 * Opening curtain (Automotive Colour House style): the logo wipes in, a gold line draws,
 * a counter runs to 100 once the hero's photos are loaded, then three wood panels lift away.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(() => prefersReducedMotion())

  useGSAP(
    (_, contextSafe) => {
      if (done) {
        markIntroDone()
        return
      }
      document.documentElement.style.overflow = 'hidden'
      const progress = { v: 0 }
      const paint = () => {
        if (count.current) count.current.textContent = String(Math.round(progress.v)).padStart(3, '0')
      }

      const intro = gsap
        .timeline()
        .from('[data-pre-logo]', { clipPath: 'inset(0 100% 0 0)', duration: 1.6, ease: 'expo.inOut' })
        .from('[data-pre-line]', { scaleX: 0, duration: 1.2, ease: 'expo.inOut' }, '-=0.9')
        .from('[data-pre-meta]', { opacity: 0, y: 10, duration: 0.8 }, '-=0.6')
        .to(progress, { v: 90, duration: 1.8, ease: 'power1.inOut', onUpdate: paint }, 0.4)

      const finish = contextSafe!(() => {
        gsap
          .timeline({
            onComplete: () => {
              document.documentElement.style.overflow = ''
              setDone(true)
            },
          })
          .to(progress, { v: 100, duration: 0.5, onUpdate: paint })
          .to('[data-pre-inner]', { opacity: 0, y: -30, duration: 0.7, ease: 'power3.in' })
          .add(markIntroDone)
          .to('[data-pre-panel]', { yPercent: -100, duration: 1.15, stagger: 0.08, ease: 'expo.inOut' }, '-=0.2')
      })

      let alive = true
      // Check for loading assets only after the intro: the (lazy) page has mounted and registered by then
      new Promise((r) => intro.eventCallback('onComplete', r))
        .then(() => assetsSettled())
        .then(() => alive && finish())
      return () => {
        alive = false
        document.documentElement.style.overflow = ''
      }
    },
    { scope: root },
  )

  if (done) return null

  return (
    <div ref={root} className="fixed inset-0 z-[300] grid place-items-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          data-pre-panel
          className="absolute inset-y-0 w-[34%] bg-night"
          style={{ left: `${i * 33.33}%` }}
        >
          <div className="absolute inset-0 bg-wood opacity-25" />
          {i < 2 && <div className="absolute inset-y-0 right-0 w-px bg-gold/15" />}
        </div>
      ))}
      <div data-pre-inner className="relative flex w-[min(360px,70vw)] flex-col items-center gap-7">
        <div data-pre-logo className="w-full">
          <Logo eager className="w-full" />
        </div>
        <span data-pre-line className="gold-rule" />
        <div data-pre-meta className="flex w-full justify-between text-[10px] uppercase tracking-[0.45em] text-mist">
          <span>Music Hall &amp; Venue</span>
          <span ref={count} className="tabular-nums text-gold">
            000
          </span>
        </div>
      </div>
    </div>
  )
}
