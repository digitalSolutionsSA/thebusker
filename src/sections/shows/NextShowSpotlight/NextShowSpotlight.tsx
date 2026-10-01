import { useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import type { Show } from '../../../types'
import { formatLongDate, formatPrice, showStart } from '../../../lib/format'
import { stockPoster } from '../../../data/images'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { useReveal } from '../../../hooks/useReveal'
import Button from '../../../components/ui/Button'
import CountdownTimer from '../../../components/ui/CountdownTimer'
import PosterDeck from '../../../components/shows/PosterDeck'

interface Props {
  /** Upcoming shows, soonest first — the first one is "up next" */
  shows: Show[]
}

/** Featured upcoming shows: details + countdown beside a fanned deck of their posters. */
export default function NextShowSpotlight({ shows }: Props) {
  const ref = useReveal({ scale: 0.96, distance: '40px', duration: 1100 })
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const show = shows[active]
  const bok = show.category === 'bok-town'
  const go = (step: number) => setActive((i) => (i + step + shows.length) % shows.length)

  // Copy and ambient glow cross-fade when a different poster comes to the front
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo('[data-spot-copy] > *', { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo('[data-spot-glow]', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' })
    },
    { scope: root, dependencies: [active] },
  )

  const glowSrc = show.image_url || stockPoster(show)

  return (
    <div ref={ref}>
      <div
        ref={root}
        className="gold-frame relative isolate grid items-center gap-12 overflow-hidden rounded-[2rem] border border-gold/35 bg-night-3 px-6 py-12 sm:px-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:py-16 lg:pr-24"
      >
        {/* Ambient glow taken from the active poster's own colours */}
        <img
          key={glowSrc}
          data-spot-glow
          src={glowSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full scale-150 object-cover opacity-0 blur-3xl saturate-150"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night-3 via-night-3/75 to-night-3/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-3/80 via-transparent to-transparent" />

        <div data-spot-copy key={show.id}>
          <p className={`eyebrow mb-5 ${bok ? 'text-bok-gold' : 'text-gold'}`}>{active === 0 ? 'Up next' : 'Coming up'}</p>
          <h2 className="font-display uppercase text-4xl leading-[0.95] sm:text-6xl text-balance">{show.title}</h2>
          <ul className="mt-6 space-y-2 text-sm text-ivory/75">
            <li className="flex items-center gap-3">
              <Clock size={15} className="text-ember-light" /> {formatLongDate(show.date)} · From {show.doors_time}
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={15} className="text-ember-light" /> The Busker Music Hall &amp; Venue
            </li>
          </ul>

          {!bok && <CountdownTimer target={showStart(show)} className="mt-8 max-w-md" />}

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button to={`/shows/${show.slug}`} variant={bok ? 'bok' : 'primary'} size="lg" magnetic>
              Book this show <ArrowRight size={16} />
            </Button>
            <span className="font-display text-3xl">
              {formatPrice(show.price_cents, show.currency)} <span className="font-sans text-xs text-mist">pp</span>
            </span>
          </div>

          {shows.length > 1 && (
            <div className="mt-10 flex items-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous show"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ivory transition-colors hover:border-ember-light hover:bg-ember/20"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next show"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ivory transition-colors hover:border-ember-light hover:bg-ember/20"
              >
                <ChevronRight size={18} />
              </button>
              <div className="ml-2 flex gap-2" role="tablist" aria-label="Upcoming shows">
                {shows.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={s.title}
                    onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-8 bg-ember-light' : 'w-3 bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:pr-6">
          <PosterDeck shows={shows} active={active} onSelect={setActive} />
          {shows.length > 1 && (
            <p className="mt-6 text-center text-[0.65rem] uppercase tracking-[0.3em] text-mist lg:hidden">Tap a poster to see that show</p>
          )}
        </div>
      </div>
    </div>
  )
}
