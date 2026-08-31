import { useEffect, useState } from 'react'
import type { Show } from '../types'
import { fetchShows } from '../lib/api'
import ShowCard from '../components/ShowCard'
import BookingModal from '../components/BookingModal'

type Filter = 'all' | 'live-music' | 'bok-town'

export default function ShowsPage() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Show | null>(null)

  useEffect(() => {
    fetchShows().then((data) => {
      setShows(data)
      setLoading(false)
    })
  }, [])

  const filtered = shows.filter((s) => filter === 'all' || s.category === filter)

  return (
    <div className="pt-32 pb-24 min-h-screen bg-ink">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="uppercase tracking-[0.5em] text-brass-light text-xs mb-4">What's On</p>
          <h1 className="font-headline text-5xl sm:text-6xl brass-text mb-4">UPCOMING SHOWS</h1>
          <p className="text-cream/60 max-w-xl mx-auto">
            Grab your tickets before they're gone. Live music, big-screen rugby, and everything in
            between.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-12">
          {[
            { key: 'all', label: 'All' },
            { key: 'live-music', label: 'Live Music' },
            { key: 'bok-town', label: 'Bok Town' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as Filter)}
              className={`px-5 py-2 rounded-full text-sm uppercase tracking-widest border transition-colors ${
                filter === f.key
                  ? 'brass-gradient text-ink border-transparent'
                  : 'border-brass/30 text-cream/70 hover:border-brass'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-cream/50">Loading shows…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-cream/50">No shows in this category yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((show) => (
              <ShowCard key={show.id} show={show} onBook={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && <BookingModal show={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
