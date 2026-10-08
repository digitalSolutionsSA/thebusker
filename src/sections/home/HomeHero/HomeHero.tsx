import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../../../lib/gsap'
import { introReady, registerAsset } from '../../../lib/intro'
import { HERO_SLIDES } from '../../../data/heroSlides'
import { HeroScene } from '../../../components/three/HeroScene'
import Button from '../../../components/ui/Button'
import HeroNextShow from '../HeroNextShow'

const AUTOPLAY = 8 // seconds per slide

/**
 * WebGL hero (Automotive Colour House engine): a smoky gold wipe between venue photos,
 * headlines that rise per slide, autoplay pager, layered scroll parallax.
 */
export default function HomeHero() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<HeroScene | null>(null)
  const [slide, setSlide] = useState(0)
  const busy = useRef(false)
  const first = useRef(true)
  const timer = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const ready = registerAsset()
    scene.current = new HeroScene(
      canvas.current!,
      HERO_SLIDES.map((s) => ({ src: s.image, focusX: s.focusX, dim: s.dim })),
      ready,
    )
    return () => {
      ready()
      scene.current?.dispose()
      scene.current = null
    }
  }, [])

  const go = useCallback((i: number) => {
    if (busy.current || !root.current) return
    busy.current = true
    scene.current?.goTo(i)
    gsap.to(root.current.querySelectorAll('[data-hero-line] > span'), {
      yPercent: -115,
      duration: 0.7,
      stagger: 0.06,
      ease: 'power3.in',
      onComplete: () => setSlide(i),
    })
  }, [])

  const startTimer = useCallback(
    (from: number) => {
      timer.current?.kill()
      if (!root.current) return
      root.current.querySelectorAll('[data-pager-bar]').forEach((el) => gsap.set(el, { scaleX: 0 }))
      const bar = root.current.querySelector(`[data-pager="${from}"] [data-pager-bar]`)
      if (!bar) return
      timer.current = gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1,
        duration: AUTOPLAY,
        ease: 'none',
        onComplete: () => go((from + 1) % HERO_SLIDES.length),
      })
    },
    [go],
  )

  // New headline rises in after each slide change
  useLayoutEffect(() => {
    if (first.current || !root.current) return
    gsap.fromTo(
      root.current.querySelectorAll('[data-hero-line] > span'),
      { yPercent: 115 },
      { yPercent: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', onComplete: () => void (busy.current = false) },
    )
    startTimer(slide)
  }, [slide, startTimer])

  // Intro after the preloader lifts, then scroll parallax
  useEffect(() => {
    const el = root.current
    if (!el) return
    let ctx: gsap.Context | undefined
    let alive = true
    introReady.then(() => {
      if (!alive) return
      scene.current?.intro()
      ctx = gsap.context(() => {
        if (!prefersReducedMotion()) {
          gsap
            .timeline({ defaults: { ease: 'expo.out' } })
            .from('[data-hero-eyebrow]', { opacity: 0, x: -30, duration: 1.4 }, 0.2)
            .from('[data-hero-line] > span', { yPercent: 115, duration: 1.6, stagger: 0.12 }, 0.3)
            .from('[data-hero-copy]', { opacity: 0, y: 30, duration: 1.4 }, 0.8)
            .from('[data-hero-cta] > *', { opacity: 0, y: 30, duration: 1.4, stagger: 0.1 }, 0.95)
            .from('[data-hero-next]', { opacity: 0, x: 80, duration: 1.8 }, 0.9)
            .from('[data-hero-fade]', { opacity: 0, duration: 1.6 }, 1.2)

          const scrub = { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
          gsap.to('[data-hero-canvas]', { yPercent: 18, ease: 'none', scrollTrigger: scrub })
          // Fade the copy and "Up next" away only on desktop, where both sit side by side in one screen.
          // On phones they stack into a tall hero, so fading here would dim "Up next" before you reach it.
          // Explicit start values: the intro above fades [data-hero-next] in *from* opacity 0, and a plain
          // .to() would record that 0 as its start — the shows then vanished on the first bit of scroll.
          gsap.matchMedia().add('(min-width: 1024px)', () => {
            gsap.fromTo(
              '[data-hero-content]',
              { yPercent: 0, opacity: 1 },
              { yPercent: -18, opacity: 0.15, ease: 'none', immediateRender: false, scrollTrigger: scrub },
            )
            gsap.fromTo(
              '[data-hero-next]',
              { yPercent: 0, opacity: 1 },
              { yPercent: -10, opacity: 0.2, ease: 'none', immediateRender: false, scrollTrigger: scrub },
            )
          })
        }
        first.current = false
        startTimer(0)
      }, el)
    })
    return () => {
      alive = false
      timer.current?.kill()
      ctx?.revert()
    }
  }, [startTimer])

  const current = HERO_SLIDES[slide]

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-night">
      <canvas data-hero-canvas ref={canvas} className="absolute inset-0 -z-20 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-transparent to-night/60" />
      <div className="absolute inset-0 -z-10 bg-night/35 lg:hidden" />
      {/* Desktop: darken behind the headline so it stands off the photo */}
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-night/85 via-night/40 to-transparent lg:block" />

      {/* Big headline leads; the upcoming shows cycle beside it. A narrower frame than the page keeps
          the two together on wide screens instead of pinned to opposite edges. */}
      <div className="relative mx-auto grid w-full max-w-[84rem] items-center gap-14 px-5 pt-32 pb-36 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:px-14 lg:pt-28 lg:pb-28 xl:gap-24">
        <div data-hero-content>
          <p data-hero-eyebrow className="eyebrow mb-7 flex items-center gap-5 text-[0.72rem] text-gold-light">
            Music Hall &amp; Venue · Vereeniging <span className="h-px w-12 bg-current opacity-70" />
          </p>
          <h1
            className="leading-[0.95] text-[clamp(2.1rem,5.2vw,5rem)] [filter:drop-shadow(0_6px_28px_rgb(0_0_0/0.7))]"
            aria-label={current.lines.map((l) => l.text).join(' ')}
          >
            {current.lines.map((l, i) => (
              <span key={`${slide}-${i}`} data-hero-line aria-hidden className="mask-line">
                <span className={l.weight === 'thin' ? 'type-thin text-ivory' : 'type-heavy text-gold-leaf'}>{l.text}</span>
              </span>
            ))}
          </h1>
          <p data-hero-copy className="mt-7 max-w-md font-serif text-lg leading-relaxed text-ivory/95 sm:text-xl [text-shadow:0_2px_16px_rgb(0_0_0/0.8)]">
            Good food, cold drinks and the best live acts in the Vaal — all under one roof at the Old Barnyard.
          </p>
          <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-4">
            <Button to="/shows" size="lg" magnetic>
              Upcoming shows <ArrowRight size={16} />
            </Button>
            <Button to="/about" variant="outline" size="lg">
              Our story
            </Button>
          </div>
        </div>

        {/* Right padding leaves room for the posters fanned out behind the front one */}
        <div data-hero-next className="lg:pr-10 xl:pr-14">
          <HeroNextShow />
        </div>
      </div>

      {/* Scroll cue */}
      <div data-hero-fade className="absolute bottom-10 left-5 hidden items-center gap-4 text-[0.6rem] uppercase tracking-[0.45em] text-ivory/60 sm:left-8 sm:flex lg:left-14">
        <span className="relative h-14 w-px overflow-hidden bg-ivory/20">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-gold" />
        </span>
        Scroll
      </div>

      {/* Slide pager with autoplay progress */}
      <div data-hero-fade className="absolute bottom-10 right-5 flex gap-5 sm:right-8 lg:right-14" role="tablist" aria-label="Hero slides">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            data-pager={i}
            role="tab"
            aria-selected={slide === i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => i !== slide && go(i)}
            className={`group flex flex-col items-start gap-2 text-[0.65rem] font-semibold tracking-[0.3em] transition-colors ${
              slide === i ? 'text-gold' : 'text-ivory/45 hover:text-ivory'
            }`}
          >
            0{i + 1}
            <span className="relative block h-px w-12 bg-ivory/20 sm:w-16">
              <span data-pager-bar className="absolute inset-0 origin-left scale-x-0 bg-gold" />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
