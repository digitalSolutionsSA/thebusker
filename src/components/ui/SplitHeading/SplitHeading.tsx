import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '../../../lib/gsap'
import { introReady } from '../../../lib/intro'

interface Props {
  as?: 'h1' | 'h2' | 'p'
  children: ReactNode
  className?: string
  delay?: number
}

/** Heading whose words rise out of masked lines (GSAP SplitText) after the intro. */
export default function SplitHeading({ as: Tag = 'h1', children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: 'visible' })
        return
      }

      // Split only once fonts are in, or line breaks are measured with the fallback font.
      const run = contextSafe!(() => {
        const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
        gsap.set(el, { visibility: 'visible' })
        gsap.from(split.words, {
          yPercent: 115,
          rotate: 4,
          opacity: 0,
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.06,
          delay,
        })
      })
      let alive = true
      Promise.all([introReady, document.fonts?.ready]).then(() => alive && run())
      return () => {
        alive = false
      }
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} className={`invisible ${className}`}>
      {children}
    </Tag>
  )
}
