import { useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'

interface Props {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  /** Load immediately (above-the-fold images) */
  priority?: boolean
  /** Vertical parallax drift in % while the photo scrolls through the viewport (GSAP) */
  parallax?: number
  /** Slow zoom-out on load ("Ken Burns") for hero backgrounds */
  kenBurns?: boolean
}

/** Image that fades in once loaded, with optional GSAP parallax / Ken Burns. */
export default function Photo({ src, alt, className = '', imgClassName = '', priority, parallax = 0, kenBurns }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const img = root.current?.querySelector('img')
      if (!img) return
      if (kenBurns) gsap.fromTo(img, { scale: 1.18 }, { scale: 1.04, duration: 9, ease: 'power2.out' })
      if (parallax) {
        gsap.fromTo(
          img,
          { yPercent: -parallax },
          { yPercent: parallax, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      }
    },
    { scope: root, dependencies: [src] },
  )

  // Parallax needs a little extra image above and below so the edges never show
  const bleed = parallax ? { top: `-${parallax}%`, bottom: `-${parallax}%`, height: 'auto' } : undefined

  return (
    <div ref={root} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden bg-night-3 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        ref={(img) => {
          if (img?.complete) setLoaded(true)
        }}
        style={bleed}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  )
}
