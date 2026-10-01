import { useEffect, useRef } from 'react'
import { ArrowRight, Beer, Shirt, Tv, Users } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { introReady, registerAsset } from '../../../lib/intro'
import { HeroScene } from '../../../components/three/HeroScene'
import Button from '../../../components/ui/Button'
import { images } from '../../../data/images'

const highlights = [
  { icon: Tv, label: 'Big screen viewing' },
  { icon: Beer, label: 'Food & drink specials' },
  { icon: Users, label: 'Great atmosphere' },
  { icon: Shirt, label: 'Support the Springboks' },
]

export default function BokTownHero() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  // WebGL stadium scene with gold dust, cycling stadium ↔ big-screen crowd
  useEffect(() => {
    if (!canvas.current) return
    const ready = registerAsset()
    const scene = new HeroScene(
      canvas.current,
      [
        { src: images.hero.stadium, focusX: 0.5 },
        { src: images.venue.bigScreen, focusX: 0.4, dim: 0.9 },
      ],
      ready,
    )
    let i = 0
    const timer = window.setInterval(() => scene.goTo((i = (i + 1) % 2)), 7000)
    introReady.then(() => scene.intro())
    return () => {
      window.clearInterval(timer)
      ready()
      scene.dispose()
    }
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      tl.from('[data-bok-word]', { yPercent: 120, rotate: -10, duration: 1.4, stagger: 0.16 }, 0.3)
        .from('[data-bok-fade]', { opacity: 0, y: 24, stagger: 0.1, duration: 1 }, 1)
        .from('[data-bok-highlight]', { opacity: 0, y: 30, stagger: 0.1, duration: 1 }, 1.25)
      introReady.then(() => tl.play())

      const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('[data-bok-photo]', { yPercent: 15, ease: 'none', scrollTrigger: scrub })
      gsap.to('[data-bok-copy]', { yPercent: -20, opacity: 0.2, ease: 'none', scrollTrigger: scrub })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-28">
      <canvas data-bok-photo ref={canvas} className="absolute inset-0 -z-30 h-full w-full" />
      {/* Deep green night grade over the stadium */}
      <div className="absolute inset-0 -z-20 opacity-60 mix-blend-multiply bg-[radial-gradient(100%_80%_at_50%_20%,#2aa35c_0%,#0b3d24_45%,#04140b_85%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/10 to-night/40" />

      <div data-bok-copy className="mx-auto w-full max-w-7xl px-5 text-center sm:px-8">
        <h1 className="relative inline-block font-brush text-[clamp(5rem,17vw,13rem)] leading-[0.8] -rotate-6">
          <span className="block overflow-hidden px-[0.15em] pb-3">
            <span data-bok-word className="relative inline-block px-[0.12em] text-gold-leaf">
              Bok
            </span>
          </span>
          <span className="block overflow-hidden pb-3 pl-[0.7em] pr-[0.15em]">
            <span data-bok-word className="relative inline-block px-[0.12em] text-gold-leaf">
              Town
            </span>
          </span>
        </h1>
        <p data-bok-fade className="mt-6 text-sm font-semibold uppercase tracking-[0.4em] text-ivory sm:text-base">
          Big games. Cold drinks. Great company.
        </p>
        <div data-bok-fade className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="#fixtures" size="lg" magnetic>
            See fixtures <ArrowRight size={16} />
          </Button>
          <Button to="/contact" variant="outline" size="lg">
            Book a table
          </Button>
        </div>
      </div>

      <ul className="relative mt-16 grid grid-cols-2 border-t border-gold/25 bg-night/70 backdrop-blur-md sm:grid-cols-4">
        {highlights.map(({ icon: Icon, label }) => (
          <li
            key={label}
            data-bok-highlight
            className="flex flex-col items-center gap-3 border-gold/15 px-4 py-7 text-center text-[0.62rem] font-semibold uppercase leading-snug tracking-[0.22em] text-ivory/85 [&:not(:last-child)]:border-r"
          >
            <Icon size={32} strokeWidth={1.1} className="text-gold" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
