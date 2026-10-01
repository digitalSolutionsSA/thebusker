import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShows } from '../../../hooks/useShows'
import { formatPrice, formatShortDate, showStart } from '../../../lib/format'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import PosterDeck from '../../../components/shows/PosterDeck'
import CountdownTimer from '../../../components/ui/CountdownTimer'

/** Compact "Up next" for the home hero: fanned poster deck + the active show's details and countdown. */
export default function HeroNextShow() {
  const { shows } = useShows()
  const upcoming = shows.slice(0, 5)
  const [active, setActive] = useState(0)
  const info = useRef<HTMLDivElement>(null)
  const show = upcoming[active]

  // Details cross-fade when another poster comes to the front
  useGSAP(
    () => {
      if (!show || prefersReducedMotion()) return
      gsap.fromTo(info.current!.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'power3.out' })
    },
    { dependencies: [active, show?.id] },
  )

  if (!show) return null
  const go = (step: number) => setActive((i) => (i + step + upcoming.length) % upcoming.length)
  const bok = show.category === 'bok-town'

  return (
    <div className="flex flex-col items-center">
      <div className="w-[13.5rem] sm:w-[15rem]">
        <PosterDeck shows={upcoming} active={active} onSelect={setActive} />
      </div>

      <div className="glass gold-frame relative mt-8 w-full max-w-[22rem] rounded-2xl p-5">
        <div ref={info} className="relative z-[2]">
          <p className="eyebrow text-[0.6rem] text-gold">{active === 0 ? 'Up next' : 'Coming up'}</p>
          <Link to={`/shows/${show.slug}`} className="mt-2 block font-display text-xl uppercase leading-tight text-ivory hover:text-gold">
            {show.title}
          </Link>
          <p className="mt-1 text-xs text-mist">
            {formatShortDate(show.date)} · From {show.doors_time} · {formatPrice(show.price_cents, show.currency)}
          </p>
          {!bok && <CountdownTimer compact target={showStart(show)} className="mt-4" />}
        </div>

        <div className="relative z-[2] mt-4 flex items-center justify-between gap-3">
          <Link
            to={`/shows/${show.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] px-5 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-night transition-[filter] hover:brightness-110"
          >
            Book this show <ArrowRight size={13} />
          </Link>
          {upcoming.length > 1 && (
            <div className="flex gap-2">
              <button type="button" onClick={() => go(-1)} aria-label="Previous show" className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-ivory hover:bg-gold/15">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next show" className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-ivory hover:bg-gold/15">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
