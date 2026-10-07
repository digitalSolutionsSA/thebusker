import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, prefersReducedMotion } from '../../../lib/gsap'
import { introReady, registerAsset } from '../../../lib/intro'
import { HeroScene } from '../../../components/three/HeroScene'

interface Props {
  eyebrow: string
  /** First line, set in thin italic */
  thin?: string
  /** Main title, set in heavy gold capitals (long titles wrap onto masked lines) */
  title: string
  subtitle?: ReactNode
  children?: ReactNode
  compact?: boolean
  /** Short banner so the content below (e.g. the shows list) is visible straight away */
  slim?: boolean
  centered?: boolean
  /** One or more photos; several cross-fade with the smoky gold wipe */
  images: string[]
  focusX?: number
  dim?: number
}

const SLIDE_SECONDS = 7

/**
 * Inner-page header on the same WebGL engine as the home hero: warm-graded photo with gold dust,
 * light sweep and pointer parallax; headline lines rise out of masks; content lifts away on scroll.
 */
export default function PageHero({
  eyebrow,
  thin,
  title,
  subtitle,
  children,
  compact = false,
  slim = false,
  centered = false,
  images,
  focusX = 0.5,
  dim,
}: Props) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  const words = title.split(' ')
  const titleLines =
    words.length > 2
      ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
      : [title]

  // WebGL scene + optional slideshow
  useEffect(() => {
    if (!canvas.current) return
    const ready = registerAsset()
    const scene = new HeroScene(
      canvas.current,
      images.map((src) => ({ src, focusX, dim })),
      ready,
    )
    let i = 0
    const timer =
      images.length > 1
        ? window.setInterval(() => {
            i = (i + 1) % images.length
            scene.goTo(i)
          }, SLIDE_SECONDS * 1000)
        : 0
    introReady.then(() => scene.intro())
    return () => {
      window.clearInterval(timer)
      ready()
      scene.dispose()
    }
    // images is a static list per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Intro + scroll parallax
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    let ctx: gsap.Context | undefined
    let alive = true
    introReady.then(() => {
      if (!alive) return
      ctx = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .from('[data-hero-eyebrow]', { opacity: 0, x: -30, duration: 1.4 }, 0.1)
          .from('[data-hero-line] > span', { yPercent: 115, duration: 1.5, stagger: 0.12 }, 0.2)
          .from('[data-hero-rule]', { scaleX: 0, duration: 1.4, ease: 'expo.inOut' }, 0.6)
          .from('[data-hero-fade]', { opacity: 0, y: 26, duration: 1.3, stagger: 0.1 }, 0.75)

        if (slim) return
        const scrub = { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-hero-content]', { yPercent: -22, opacity: 0.1, ease: 'none', scrollTrigger: scrub })
        gsap.to('[data-hero-canvas]', { yPercent: 18, ease: 'none', scrollTrigger: scrub })
      }, el)
    })
    return () => {
      alive = false
      ctx?.revert()
    }
  }, [slim])

  return (
    <section
      ref={root}
      className={`relative isolate flex overflow-hidden bg-night ${centered ? 'items-center' : 'items-end'} ${
        slim ? 'pt-28 pb-8 sm:pt-32 sm:pb-10' : `${compact ? 'min-h-[62vh]' : 'min-h-[86vh]'} pt-36 pb-20`
      }`}
    >
      <canvas data-hero-canvas ref={canvas} className="absolute inset-0 -z-20 h-full w-full" />
      <div className={`absolute inset-0 -z-10 ${centered ? 'bg-night/45' : 'bg-gradient-to-r from-night/85 via-night/40 to-transparent'}`} />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-night to-transparent" />

      <div data-hero-content className={`mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-14 ${centered ? 'text-center' : ''}`}>
        <p data-hero-eyebrow className={`eyebrow ${slim ? 'mb-4' : 'mb-7'} flex items-center gap-5 text-gold ${centered ? 'justify-center' : ''}`}>
          {centered && <span className="h-px w-12 bg-current opacity-70" />}
          {eyebrow}
          <span className="h-px w-12 bg-current opacity-70" />
        </p>
        <h1 className={`leading-[0.95] ${slim ? 'text-[clamp(2.2rem,5vw,4.2rem)]' : 'text-[clamp(2.6rem,7.4vw,7rem)]'} ${centered ? '' : 'max-w-5xl'}`}>
          {thin && (
            <span data-hero-line className="mask-line">
              <span className="type-thin text-ivory/90">{thin}</span>
            </span>
          )}
          {titleLines.map((line) => (
            <span key={line} data-hero-line className="mask-line">
              <span className="type-heavy text-gold-leaf">{line}</span>
            </span>
          ))}
        </h1>
        <span data-hero-rule className={`gold-rule ${slim ? 'mt-5' : 'mt-8'} max-w-[14rem] ${centered ? 'mx-auto' : ''}`} />
        {subtitle && (
          <p
            data-hero-fade
            className={`${slim ? 'mt-4 text-lg sm:text-xl' : 'mt-7 text-xl sm:text-2xl'} font-serif leading-relaxed text-ivory/80 ${centered ? 'mx-auto max-w-xl' : 'max-w-xl'}`}
          >
            {subtitle}
          </p>
        )}
        {children && (
          <div data-hero-fade className="mt-10">
            {children}
          </div>
        )}
      </div>

      {!slim && (
        <div data-hero-fade className="absolute bottom-10 right-5 hidden items-center gap-4 text-[0.6rem] uppercase tracking-[0.45em] text-ivory/60 sm:right-8 sm:flex lg:right-14">
          <span className="relative h-14 w-px overflow-hidden bg-ivory/20">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-gold" />
          </span>
          Scroll
        </div>
      )}
    </section>
  )
}
