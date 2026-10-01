import { lazy, Suspense, useRef, type ReactNode } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { introReady } from '../../../lib/intro'

const AmbientScene = lazy(() => import('../../../components/three/AmbientScene'))

interface Props {
  eyebrow: string
  title: string
  body: ReactNode
  icon?: ReactNode
  actions: ReactNode
}

/** Full-screen centred message used by booking success / cancelled and 404 pages. */
export default function StatusMessage({ eyebrow, title, body, icon, actions }: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ paused: true }).from('[data-status]', { opacity: 0, y: 30, stagger: 0.12, duration: 1, ease: 'power3.out' })
      introReady.then(() => tl.play())
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-32 text-center grain">
      <div className="absolute inset-0 -z-20" style={{ background: 'radial-gradient(80% 60% at 50% 30%, #2e2112, #0f0b07 70%)' }} />
      <div className="absolute inset-0 -z-10">
        <Suspense fallback={null}>
          <AmbientScene />
        </Suspense>
      </div>
      <div className="max-w-xl">
        {icon && (
          <div data-status className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            {icon}
          </div>
        )}
        <p data-status className="eyebrow text-gold">
          {eyebrow}
        </p>
        <h1 data-status className="mt-5 font-display text-5xl uppercase leading-[0.95] sm:text-6xl text-balance">
          {title}
        </h1>
        <p data-status className="mt-6 text-mist">
          {body}
        </p>
        <div data-status className="mt-10 flex flex-wrap justify-center gap-4">
          {actions}
        </div>
      </div>
    </section>
  )
}
