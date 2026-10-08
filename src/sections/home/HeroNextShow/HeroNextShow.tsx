import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useShows } from '../../../hooks/useShows'
import { useCountdown } from '../../../hooks/useCountdown'
import { formatShortDate, showStart, priceLabel } from '../../../lib/format'
import { prefersReducedMotion } from '../../../lib/gsap'
import PosterDeck from '../../../components/shows/PosterDeck'
import type { Show } from '../../../types'

const MAX_SHOWS = 4
/** Each show: poster clear → blurred with its countdown on top → clear again → next show */
const PHASES = [
  { id: 'intro', ms: 1000 },
  { id: 'details', ms: 2000 },
  { id: 'outro', ms: 2500 },
] as const
const CYCLE_MS = PHASES.reduce((sum, p) => sum + p.ms, 0)

type Phase = (typeof PHASES)[number]['id']

/**
 * "Up next" beside the hero headline: the next four shows as a fanned poster deck. Each front poster
 * shows clear for a second, blurs for two while its countdown and booking button sit over it, shows
 * clear again, then the next show is dealt to the front. Hovering or focusing holds the details on screen.
 */
export default function HeroNextShow() {
  const { shows } = useShows()
  const upcoming = shows.slice(0, MAX_SHOWS)
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  // Hovering holds the countdown on screen; so does keyboard focus. A mouse click leaves focus on the
  // button it pressed, which must not keep the poster blurred once the pointer has moved away.
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const held = hovered || keyboardFocus
  const show = upcoming[active]
  const count = upcoming.length
  const still = prefersReducedMotion()

  // intro (clear) → details (blurred) → outro (clear) → next show's intro → …
  useEffect(() => {
    if (held || still || count === 0) return
    const i = PHASES.findIndex((p) => p.id === phase)
    const t = window.setTimeout(() => {
      if (i < PHASES.length - 1) setPhase(PHASES[i + 1].id)
      else {
        setActive((a) => (a + 1) % count)
        setPhase('intro')
      }
    }, PHASES[i].ms)
    return () => window.clearTimeout(t)
  }, [phase, active, held, still, count])

  if (!show) return null

  const select = (i: number) => {
    setActive(i)
    setPhase('intro')
  }
  const go = (step: number) => select((active + step + count) % count)
  const showDetails = held || still || phase === 'details'

  return (
    <div
      className="relative flex flex-col items-center"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(e) => setKeyboardFocus(e.target.matches(':focus-visible'))}
      onBlur={() => setKeyboardFocus(false)}
    >
      {/* Warm stage glow behind the deck, so it sits in the scene rather than floating on it */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[130%] w-[170%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(closest-side, rgb(201 162 74 / 0.22), transparent)' }}
      />

      <p className="eyebrow mb-6 flex items-center gap-4 text-[0.62rem] text-gold">
        <span className="h-px w-8 bg-current opacity-70" /> On stage soon <span className="h-px w-8 bg-current opacity-70" />
      </p>

      <PosterDeck
        shows={upcoming}
        active={active}
        onSelect={select}
        sizeClassName="w-[min(16.5rem,64vw)] sm:w-[18rem] xl:w-[19.5rem] 2xl:w-[21rem]"
        overlay={<PosterDetails key={show.id} show={show} visible={showDetails} first={active === 0} />}
      />

      {count > 1 && (
        <div className="mt-6 flex items-center gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous show" className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-ivory transition-colors hover:border-gold hover:bg-gold/15">
            <ChevronLeft size={16} />
          </button>
          <span className="w-12 text-center font-display text-xs tabular-nums tracking-[0.2em] text-ivory/70">
            {String(active + 1).padStart(2, '0')}
            <span className="text-ivory/35"> / {String(count).padStart(2, '0')}</span>
          </span>
          <div className="flex gap-2" role="tablist" aria-label="Upcoming shows">
            {upcoming.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={s.title}
                onClick={() => select(i)}
                className="relative h-[3px] w-9 overflow-hidden rounded-full bg-ivory/20"
              >
                {i === active && (
                  <span
                    key={`${active}-${held}`}
                    className="absolute inset-0 origin-left rounded-full bg-gold"
                    style={held || still ? undefined : { animation: `deckprogress ${CYCLE_MS}ms linear forwards` }}
                  />
                )}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label="Next show" className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 text-ivory transition-colors hover:border-gold hover:bg-gold/15">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/** Blur + darken over the front poster with the show's countdown, details and booking button. */
function PosterDetails({ show, visible, first }: { show: Show; visible: boolean; first: boolean }) {
  const bok = show.category === 'bok-town'
  return (
    <div
      aria-hidden={!visible}
      className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-night/95 via-night/70 to-night/35 p-5 backdrop-blur-[6px] transition-opacity duration-500 ease-out ${
        visible ? 'pointer-events-auto opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`transition-transform duration-500 ease-out ${visible ? 'translate-y-0' : 'translate-y-4'}`}>
        <p className="eyebrow text-[0.58rem] text-gold">{first ? 'Up next' : 'Coming up'}</p>
        <Link
          to={`/shows/${show.slug}`}
          tabIndex={visible ? 0 : -1}
          className="mt-2 block font-display text-xl uppercase leading-tight text-ivory hover:text-gold"
        >
          {show.title}
        </Link>
        <p className="mt-1 text-xs text-mist">
          {formatShortDate(show.date)} · From {show.doors_time} · {priceLabel(show)}
        </p>
        {!bok && <MiniCountdown target={showStart(show)} />}
        <Link
          to={`/shows/${show.slug}`}
          tabIndex={visible ? 0 : -1}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] px-5 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-night transition-[filter] hover:brightness-110"
        >
          Get tickets <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/** Countdown slim enough to sit on a poster */
function MiniCountdown({ target }: { target: Date }) {
  const c = useCountdown(target)
  if (!c) return null
  const units = [
    { label: 'Days', value: c.days },
    { label: 'Hrs', value: c.hours },
    { label: 'Min', value: c.minutes },
    { label: 'Sec', value: c.seconds },
  ]
  return (
    <div className="mt-4 grid grid-cols-4 gap-1.5" role="timer" aria-live="off">
      {units.map((u) => (
        <div key={u.label} className="rounded-lg border border-white/15 bg-night/50 py-2 text-center">
          <div className="font-display text-xl leading-none tabular-nums text-ivory">{String(u.value).padStart(2, '0')}</div>
          <div className="mt-1.5 text-[0.55rem] uppercase tracking-[0.2em] text-mist">{u.label}</div>
        </div>
      ))}
    </div>
  )
}
