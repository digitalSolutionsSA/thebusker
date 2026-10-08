import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useShows } from '../../../hooks/useShows'
import { formatDay, formatMonth, priceLabel } from '../../../lib/format'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '../../../lib/gsap'
import ShowPoster from '../../../components/shows/ShowPoster'

/**
 * Pinned horizontal gallery of upcoming show posters (desktop): vertical scroll drives the track
 * sideways while a gold progress line fills. Phones get a native swipe row.
 */
interface Props {
  /** leave this show out (on its own page) */
  excludeSlug?: string
  thin?: string
  heavy?: string
}

export default function ShowsTrack({ excludeSlug, thin = "What's", heavy = 'On Stage' }: Props) {
  const { shows: all } = useShows()
  const shows = all.filter((s) => s.slug !== excludeSlug)
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = track.current
      if (!el || !shows.length || prefersReducedMotion()) return
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth + 80)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance() + window.innerHeight * 0.5}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
        tl.to(el, { x: () => -distance(), ease: 'none' }, 0).fromTo('[data-track-progress]', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)

        // each card tilts in as it enters the frame
        gsap.utils.toArray<HTMLElement>('[data-track-card]').forEach((card) => {
          gsap.fromTo(
            card.querySelector('[data-track-poster]'),
            { rotate: 4, scale: 0.9 },
            {
              rotate: 0,
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: card, containerAnimation: tl, start: 'left right', end: 'center center', scrub: true },
            },
          )
        })
      })
      ScrollTrigger.refresh()
      return () => mm.revert()
    },
    { scope: root, dependencies: [shows.length, excludeSlug] },
  )

  if (!shows.length) return null

  return (
    <section ref={root} id={excludeSlug ? 'more-shows' : 'upcoming'} className="relative overflow-hidden lg:h-[100svh]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-wood opacity-25" />
      <div className="relative flex h-full flex-col justify-center py-24 lg:py-0">
        <div className="mx-auto flex w-full max-w-[90rem] items-end justify-between gap-6 px-5 sm:px-8 lg:px-14">
          <h2 className="leading-[0.95] text-[clamp(2.4rem,5.4vw,5.2rem)]">
            <span className="mask-line" data-sr="up">
              <span className="type-thin text-ivory/90">{thin}</span>
            </span>
            <span className="mask-line" data-sr="up" data-sr-delay="120">
              <span className="type-heavy text-gold-leaf">{heavy}</span>
            </span>
          </h2>
          <Link to="/shows" data-sr="left" className="group mb-3 hidden items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold hover:text-ivory sm:inline-flex">
            All shows <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 overflow-x-auto pb-4 [scrollbar-width:none] lg:mt-14 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          <div ref={track} className="flex w-max snap-x snap-mandatory gap-6 px-5 sm:px-8 lg:snap-none lg:gap-10 lg:px-14">
            {shows.map((show, i) => (
              <Link
                key={show.id}
                to={`/shows/${show.slug}`}
                data-track-card
                data-cursor="Book"
                className="group w-[68vw] shrink-0 snap-start sm:w-[22rem] lg:w-[clamp(18rem,24vw,24rem)]"
              >
                <div data-track-poster className="relative aspect-[1/1.414] overflow-hidden rounded-xl ring-1 ring-gold/30 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.95)]">
                  <ShowPoster show={show} className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-night/80 px-3 py-1 font-display text-xs tracking-[0.2em] text-gold backdrop-blur">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-5 flex items-start gap-4">
                  <div className="text-center leading-none">
                    <div className="font-display text-3xl text-gold-leaf">{formatDay(show.date)}</div>
                    <div className="mt-1 text-[0.6rem] font-semibold tracking-[0.3em] text-ivory">{formatMonth(show.date)}</div>
                  </div>
                  <div className="min-w-0 border-l border-gold/25 pl-4">
                    <h3 className="font-display text-lg uppercase leading-tight text-ivory group-hover:text-gold">{show.title}</h3>
                    <p className="mt-1 text-xs text-mist">
                      From {show.doors_time} · {priceLabel(show)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {/* closing card */}
            <Link
              to="/shows"
              className="group flex w-[60vw] shrink-0 snap-start flex-col items-center justify-center gap-5 rounded-xl border border-gold/30 text-center sm:w-[18rem] lg:w-[clamp(16rem,20vw,20rem)]"
              style={{ aspectRatio: '1 / 1.414' }}
            >
              <span className="grid h-20 w-20 place-items-center rounded-full border border-gold/50 text-gold transition-transform duration-500 group-hover:scale-110 group-hover:bg-gold group-hover:text-night">
                <ArrowRight size={26} />
              </span>
              <span className="type-heavy text-gold-leaf text-2xl">All Shows</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-12 hidden w-full max-w-[90rem] px-14 lg:block">
          <div className="relative h-px bg-ivory/15">
            <span data-track-progress className="absolute inset-0 origin-left scale-x-0 bg-gold" />
          </div>
        </div>
      </div>
    </section>
  )
}
