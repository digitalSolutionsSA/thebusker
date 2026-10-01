import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Show } from '../../../types'
import { formatDay, formatMonth, formatPrice, ticketsRemaining } from '../../../lib/format'
import ShowPoster from '../ShowPoster'

/** Ticket-stub style row: date block · poster thumbnail · title & times · gold ticket button. */
export default function ShowRow({ show }: { show: Show }) {
  const soldOut = ticketsRemaining(show) === 0

  return (
    <Link
      to={`/shows/${show.slug}`}
      className="glass group relative grid grid-cols-[4rem_5.5rem_1fr] items-center overflow-hidden rounded-xl transition-[border-color,box-shadow] duration-500 hover:border-gold/70 hover:shadow-[0_20px_60px_-25px_rgb(201_162_74/0.6)] sm:grid-cols-[5.5rem_8.5rem_1fr_auto]"
    >
      {/* Date */}
      <div className="flex h-full flex-col items-center justify-center border-r border-gold/25 py-5 text-center leading-none">
        <span className="font-display text-3xl text-gold-leaf sm:text-4xl">{formatDay(show.date)}</span>
        <span className="mt-1 text-[0.65rem] font-semibold tracking-[0.3em] text-ivory">{formatMonth(show.date)}</span>
        <span className="mt-1 text-[0.6rem] text-mist">{show.date.slice(0, 4)}</span>
      </div>

      {/* Full poster at its own portrait shape (posters are ~1:1.41), so nothing is cropped */}
      <div className="py-3 pl-3 sm:py-4 sm:pl-4">
        <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-md ring-1 ring-gold/30 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.9)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg]">
          <ShowPoster show={show} className="absolute inset-0" />
        </div>
      </div>

      {/* Details */}
      <div className="min-w-0 px-5 py-5 sm:px-7">
        <h3 className="font-display text-lg uppercase leading-tight text-ivory sm:text-2xl">{show.title}</h3>
        <p className="mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.25em] text-mist">
          Starts {show.doors_time} <span className="mx-2 text-gold/60">|</span> {formatPrice(show.price_cents, show.currency)} pp
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] px-5 py-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-night sm:hidden">
          {soldOut ? 'Sold out' : 'Get tickets'} <ArrowRight size={12} />
        </span>
      </div>

      {/* CTA */}
      <div className="hidden pr-7 sm:block">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] transition-[filter] ${
            soldOut
              ? 'bg-white/10 text-ivory/50'
              : 'bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night group-hover:brightness-110'
          }`}
        >
          {soldOut ? 'Sold out' : 'Get tickets'}
          {!soldOut && <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />}
        </span>
      </div>
    </Link>
  )
}
