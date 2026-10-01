import { useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'

/** Fades each new page in as the route changes. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        root.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' },
      )
    },
    { dependencies: [pathname], scope: root },
  )

  return <div ref={root}>{children}</div>
}
