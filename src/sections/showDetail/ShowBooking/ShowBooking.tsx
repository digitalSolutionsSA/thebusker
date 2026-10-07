import { MapPin } from 'lucide-react'
import type { Show } from '../../../types'
import { mapsUrl, site } from '../../../config/site'
import { formatShortDate } from '../../../lib/format'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import BookingPanel from '../../../components/shows/BookingPanel'

/** Seat booking first (plan + order form), show details after, so buying takes as little scrolling as possible. */
export default function ShowBooking({ show }: { show: Show }) {
  const root = useSectionReveal<HTMLElement>([show.id])

  return (
    <section ref={root} id="book" className="relative scroll-mt-24 py-16 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-wood opacity-25" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
        <h2 className="text-center leading-[0.98] text-[clamp(2rem,4vw,3.2rem)]">
          <span className="mask-line">
            <span className="type-heavy text-gold-leaf">Get tickets</span>
          </span>
        </h2>
        <p data-sr="fade" className="mt-3 mb-8 text-center text-sm text-mist">
          {show.title} · {formatShortDate(show.date)} · from {show.doors_time}
        </p>

        <BookingPanel key={show.id} show={show} />

        <p data-sr="up" className="mt-10 max-w-2xl font-serif text-lg leading-relaxed text-ivory/80">
          {show.description}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-xs text-ivory/60 hover:text-gold"
        >
          <MapPin size={14} className="text-gold" /> {site.name} · {site.address.lines[1]}
        </a>
      </div>
    </section>
  )
}
