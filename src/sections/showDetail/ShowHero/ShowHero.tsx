import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, CalendarDays, Clock, Ticket } from 'lucide-react'
import type { Show } from '../../../types'
import { formatLongDate, showStart, ticketsRemaining, priceLabel } from '../../../lib/format'
import { gsap, prefersReducedMotion } from '../../../lib/gsap'
import { introReady, registerAsset } from '../../../lib/intro'
import { images } from '../../../data/images'
import { HeroScene } from '../../../components/three/HeroScene'
import ShowPoster from '../../../components/shows/ShowPoster'
import CountdownTimer from '../../../components/ui/CountdownTimer'
import Button from '../../../components/ui/Button'

// Venue photos behind each kind of show (the poster itself is shown crisp in front)
const backdrops: Record<Show['category'], string[]> = {
  'live-music': [images.hero.blueBand, images.hero.bandStage],
  'bok-town': [images.hero.stadium, images.venue.bigScreen],
  special: [images.hero.warmCrowd, images.hero.handsUp],
}

/**
 * Show page hero: WebGL venue scene (smoky gold wipe, dust, light sweep), headline rising out of masks,
 * and the real poster as a floating card that tilts toward the cursor with a moving glare.
 */
export default function ShowHero({ show }: { show: Show }) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const bok = show.category === 'bok-town'
  const soldOut = ticketsRemaining(show) === 0

  // Split "Gerhard Steyn & Liezel Pieters" → thin first word(s) + heavy rest
  const words = show.title.split(' ')
  const cut = words.length > 2 ? Math.ceil(words.length / 2) : words.length > 1 ? 1 : 0
  const thin = words.slice(0, cut).join(' ')
  const heavy = words.slice(cut).join(' ')

  // WebGL backdrop
  useEffect(() => {
    if (!canvas.current) return
    const ready = registerAsset()
    const list = backdrops[show.category]
    const scene = new HeroScene(
      canvas.current,
      list.map((src) => ({ src, focusX: 0.5, dim: 0.85 })),
      ready,
    )
    let i = 0
    const timer = window.setInterval(() => scene.goTo((i = (i + 1) % list.length)), 7000)
    introReady.then(() => scene.intro())
    return () => {
      window.clearInterval(timer)
      ready()
      scene.dispose()
    }
  }, [show.category])

  // Intro, scroll parallax and poster tilt
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    let ctx: gsap.Context | undefined
    let alive = true
    let cleanupTilt = () => {}

    introReady.then(() => {
      if (!alive) return
      ctx = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .from('[data-show-back]', { opacity: 0, x: -20, duration: 1 }, 0)
          .from('[data-show-eyebrow]', { opacity: 0, x: -30, duration: 1.3 }, 0.1)
          .from('[data-show-line] > span', { yPercent: 115, duration: 1.5, stagger: 0.12 }, 0.2)
          .from('[data-show-rule]', { scaleX: 0, duration: 1.3, ease: 'expo.inOut' }, 0.6)
          .from('[data-show-fade]', { opacity: 0, y: 26, duration: 1.2, stagger: 0.08 }, 0.7)
          .from('[data-show-card]', { opacity: 0, y: 120, rotateX: 25, rotateY: -20, duration: 2, ease: 'expo.out' }, 0.3)

        const scrub = { trigger: el, start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-show-canvas]', { yPercent: 18, ease: 'none', scrollTrigger: scrub })
        // Desktop only: on phones the poster stacks below the details and must not fade before you reach it
        gsap.matchMedia().add('(min-width: 1024px)', () => {
          gsap.to('[data-show-copy]', { yPercent: -20, opacity: 0.1, ease: 'none', scrollTrigger: scrub })
          gsap.to('[data-show-cardwrap]', { yPercent: -12, ease: 'none', scrollTrigger: scrub })
        })
      }, el)

      // Poster tilts toward the pointer, glare follows
      const c = card.current
      if (c && matchMedia('(pointer: fine)').matches) {
        const rx = gsap.quickTo(c, 'rotationX', { duration: 0.8, ease: 'power3.out' })
        const ry = gsap.quickTo(c, 'rotationY', { duration: 0.8, ease: 'power3.out' })
        const glare = c.querySelector<HTMLElement>('[data-glare]')
        const move = (e: PointerEvent) => {
          const r = c.getBoundingClientRect()
          const nx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth
          const ny = (e.clientY - (r.top + r.height / 2)) / window.innerHeight
          rx(-ny * 16)
          ry(nx * 22)
          if (glare) gsap.to(glare, { '--gx': `${50 + nx * 120}%`, '--gy': `${50 + ny * 120}%`, opacity: 0.4, duration: 0.6 })
        }
        window.addEventListener('pointermove', move)
        cleanupTilt = () => window.removeEventListener('pointermove', move)
      }
    })
    return () => {
      alive = false
      cleanupTilt()
      ctx?.revert()
    }
  }, [show.id])

  const scrollToBooking = () => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-night">
      <canvas data-show-canvas ref={canvas} className="absolute inset-0 -z-20 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/70 to-night/30" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-night to-transparent" />
      {bok && <div className="absolute inset-0 -z-10 bg-bok-green/25 mix-blend-multiply" />}

      <div className="mx-auto grid w-full max-w-[90rem] items-center gap-14 px-5 pt-32 pb-24 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:px-14">
        <div data-show-copy>
          <Link
            data-show-back
            to="/shows"
            className="group mb-10 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-mist hover:text-ivory"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> All shows
          </Link>
          <p data-show-eyebrow className={`eyebrow mb-7 flex items-center gap-5 ${bok ? 'text-bok-gold' : 'text-gold'}`}>
            {bok ? 'Bok Town screening' : show.artist === show.title ? 'Live at The Busker' : show.artist} <span className="h-px w-12 bg-current opacity-70" />
          </p>
          <h1 className="leading-[0.95] text-[clamp(2.4rem,6.2vw,6rem)]">
            {thin && (
              <span data-show-line className="mask-line">
                <span className="type-thin text-ivory/90">{thin}</span>
              </span>
            )}
            <span data-show-line className="mask-line">
              <span className="type-heavy text-gold-leaf">{heavy}</span>
            </span>
          </h1>
          <span data-show-rule className="gold-rule mt-8 max-w-[14rem]" />

          <ul data-show-fade className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/85">
            <li className="flex items-center gap-2 rounded-full border border-gold/30 bg-night/50 px-4 py-2 backdrop-blur">
              <CalendarDays size={14} className="text-gold" /> {formatLongDate(show.date)}
            </li>
            <li className="flex items-center gap-2 rounded-full border border-gold/30 bg-night/50 px-4 py-2 backdrop-blur">
              <Clock size={14} className="text-gold" /> From {show.doors_time}
            </li>
            <li className="flex items-center gap-2 rounded-full border border-gold/30 bg-night/50 px-4 py-2 backdrop-blur">
              <Ticket size={14} className="text-gold" /> {priceLabel(show)} pp
            </li>
          </ul>

          {!bok && (
            <div data-show-fade className="mt-8 max-w-md">
              <CountdownTimer compact target={showStart(show)} />
            </div>
          )}

          <div data-show-fade className="mt-10 flex flex-wrap items-center gap-4">
            <Button onClick={scrollToBooking} size="lg" magnetic disabled={soldOut}>
              {soldOut ? 'Sold out' : 'Book tickets'} {!soldOut && <ArrowDown size={16} />}
            </Button>
          </div>
        </div>

        {/* Floating poster */}
        <div data-show-cardwrap className="relative mx-auto w-[min(22rem,78vw)] [perspective:1200px]">
          {show.image_url && (
            <img
              src={show.image_url}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-10 h-full w-full scale-110 rounded-2xl object-cover opacity-60 blur-3xl"
            />
          )}
          <div data-show-card ref={card} className="relative [transform-style:preserve-3d]" data-cursor="Book">
            <div className="relative aspect-[1/1.414] overflow-hidden rounded-2xl ring-1 ring-gold/40 shadow-[0_60px_120px_-30px_rgb(0_0_0/0.95)]">
              <ShowPoster show={show} large priority className="absolute inset-0" />
              <div
                data-glare
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay"
                style={{ background: 'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.9), transparent 50%)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
