import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { images } from '../../../data/images'
import Photo from '../../../components/ui/Photo'

/**
 * Pinned scroll set-piece: while the section is held in place, a spotlight circle opens over the
 * stage photo, "THE STAGE" / "IS SET" split apart, and the closing line rises in.
 */
interface Props {
  image?: string
  heavy?: string
  thin?: string
  eyebrow?: string
  copy?: string
  /** gold-on-green for Bok Town */
  tone?: 'gold' | 'bok'
}

export default function Spotlight({
  image = images.hero.blueStage,
  heavy = 'The Stage',
  thin = 'is set.',
  eyebrow = 'The Busker · Music Hall & Venue',
  copy = 'A room built for live music — warm lights, a proper sound rig and a crowd that sings along.',
  tone = 'gold',
}: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=180%', scrub: 1, pin: true, anticipatePin: 1 },
      })
      tl.fromTo('[data-spot-photo]', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1 }, 0)
        .fromTo('[data-spot-photo] img', { scale: 1.35 }, { scale: 1, duration: 1 }, 0)
        .fromTo('[data-spot-left]', { xPercent: 0 }, { xPercent: -60, opacity: 0.12, duration: 0.8 }, 0.1)
        .fromTo('[data-spot-right]', { xPercent: 0 }, { xPercent: 60, opacity: 0.12, duration: 0.8 }, 0.1)
        .fromTo('[data-spot-ring]', { opacity: 1 }, { opacity: 0, duration: 0.25 }, 0)
        .from('[data-spot-copy] > *', { yPercent: 60, opacity: 0, stagger: 0.08, duration: 0.35 }, 0.62)
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative h-[100svh] overflow-hidden bg-night" aria-label={`${heavy} ${thin}`}>
      <div data-spot-photo className="absolute inset-0" style={{ clipPath: 'circle(75% at 50% 50%)' }}>
        <Photo src={image} alt="" className="absolute inset-0" />
        <div className={`absolute inset-0 ${tone === 'bok' ? 'bg-bok-night/55' : 'bg-night/45'}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgb(15_11_7/0.85)_75%)]" />
      </div>

      {/* Warm pinhole of light that marks where the spotlight will open */}
      <span
        data-spot-ring
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light shadow-[0_0_40px_12px_rgb(226_189_109/0.55)]"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[6vmin] px-5">
        <p data-spot-left className="type-heavy text-gold-leaf text-[clamp(3rem,12vw,11rem)] leading-none">
          {heavy}
        </p>
        <p data-spot-right className="type-thin text-ivory text-[clamp(3rem,12vw,11rem)] leading-none">
          {thin}
        </p>
      </div>

      <div data-spot-copy className="absolute inset-x-0 bottom-[12vh] mx-auto max-w-2xl px-5 text-center">
        <p className={`eyebrow ${tone === 'bok' ? 'text-bok-gold' : 'text-gold'}`}>{eyebrow}</p>
        <p className="mt-5 font-serif text-2xl leading-snug text-ivory sm:text-3xl">
          {copy}
        </p>
      </div>
    </section>
  )
}
