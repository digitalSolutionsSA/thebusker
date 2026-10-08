import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Show } from '../../../types'
import { parseFixture } from '../../../data/teams'
import { formatShortDate, ticketsRemaining, priceLabel } from '../../../lib/format'
import TeamBadge from '../../ui/TeamBadge'

/** Match-day row on the Bok Town page: crests · date & teams · gold "Book a table". */
export default function FixtureCard({ show }: { show: Show }) {
  const fixture = parseFixture(show.title)
  const soldOut = ticketsRemaining(show) === 0

  return (
    <Link
      to={`/shows/${show.slug}`}
      className="glass group flex flex-col items-center gap-5 rounded-xl px-6 py-5 transition-[border-color,box-shadow] duration-500 hover:border-gold/70 hover:shadow-[0_20px_60px_-25px_rgb(201_162_74/0.6)] sm:flex-row"
    >
      {fixture ? (
        <div className="flex shrink-0 items-center gap-3">
          <TeamBadge team={fixture.home} size="sm" />
          <span className="font-display text-sm text-gold">vs</span>
          <TeamBadge team={fixture.away} size="sm" />
        </div>
      ) : (
        <span className="font-brush text-2xl text-gold-leaf">Match Day</span>
      )}

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em] text-gold">
          {formatShortDate(show.date)} · From {show.doors_time}
        </p>
        <h3 className="mt-1 font-display text-lg uppercase text-ivory">
          {fixture ? `${fixture.home.name} vs ${fixture.away.name}` : show.title}
        </h3>
        <p className="mt-1 text-xs text-mist">{priceLabel(show)} pp · platter &amp; drinks included</p>
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] ${
          soldOut
            ? 'bg-white/10 text-ivory/50'
            : 'bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night group-hover:brightness-110'
        }`}
      >
        {soldOut ? 'Fully booked' : 'Book a table'}
        {!soldOut && <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />}
      </span>
    </Link>
  )
}
