import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Show } from '../types'
import { fetchShows } from '../lib/api'
import ShowCard from './ShowCard'
import BookingModal from './BookingModal'

export default function UpcomingShowsSummary() {
  const [shows, setShows] = useState<Show[]>([])
  const [selected, setSelected] = useState<Show | null>(null)

  useEffect(() => {
    fetchShows().then((data) => setShows(data.slice(0, 3)))
  }, [])

  if (shows.length === 0) return null

  return (
    <section className="py-28 bg-ink-2">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="uppercase tracking-[0.5em] text-brass-light text-xs mb-4">What's On</p>
            <h2 className="font-display text-4xl text-cream">Upcoming Shows</h2>
          </div>
          <Link
            to="/shows"
            className="text-brass-light uppercase tracking-widest text-sm border-b border-brass/40 pb-1 hover:border-brass whitespace-nowrap"
          >
            View All Shows →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} onBook={setSelected} />
          ))}
        </div>
      </div>

      {selected && <BookingModal show={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
