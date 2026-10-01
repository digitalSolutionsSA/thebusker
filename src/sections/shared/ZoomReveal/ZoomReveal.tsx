import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import Photo from '../../../components/ui/Photo'

interface Props {
  image: string
  alt?: string
  /** big words either side of the photo while it's small */
  left: string
  right: string
  caption?: string
  tone?: 'gold' | 'bok'
}

/**
 * Pinned "step inside" moment: a small framed photo grows to fill the screen as you scroll,
 * the words either side slide out, then a caption rises in.
 */
export default function ZoomReveal({ image, alt = '', left, right, caption, tone = 'gold' }: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=160%', scrub: 1, pin: true, anticipatePin: 1 },
      })
      tl.fromTo(
        '[data-zoom-frame]',
        { clipPath: 'inset(30% 36% 30% 36% round 1.5rem)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0rem)', duration: 1 },
        0,
      )
        .fromTo('[data-zoom-frame] img', { scale: 1.6 }, { scale: 1, duration: 1 }, 0)
        .to('[data-zoom-left]', { xPercent: -120, opacity: 0, duration: 0.6 }, 0.15)
        .to('[data-zoom-right]', { xPercent: 120, opacity: 0, duration: 0.6 }, 0.15)
        .fromTo('[data-zoom-shade]', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.6)
        .from('[data-zoom-caption] > *', { yPercent: 80, opacity: 0, stagger: 0.08, duration: 0.3 }, 0.7)
    },
    { scope: root },
  )

  const heavy = tone === 'bok' ? 'text-bok-gold' : 'text-gold-leaf'

  return (
    <section ref={root} className="relative h-[100svh] overflow-hidden bg-night" aria-label={`${left} ${right}`}>
      <div data-zoom-frame className="absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
        <Photo src={image} alt={alt} className="absolute inset-0" />
        <div data-zoom-shade className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/20" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-5 sm:px-10">
        <p data-zoom-left className={`type-heavy ${heavy} text-[clamp(1.8rem,5.6vw,5.6rem)] leading-none`}>
          {left}
        </p>
        <p data-zoom-right className="type-thin text-ivory text-[clamp(1.8rem,5.6vw,5.6rem)] leading-none">
          {right}
        </p>
      </div>

      {caption && (
        <div data-zoom-caption className="absolute inset-x-0 bottom-[12vh] mx-auto max-w-2xl px-5 text-center">
          <span className="mx-auto mb-6 block h-px w-16 bg-gold" />
          <p className="font-serif text-2xl leading-snug text-ivory sm:text-3xl">{caption}</p>
        </div>
      )}
    </section>
  )
}
