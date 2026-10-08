import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DoorOpen, Pencil, Plus } from 'lucide-react'
import type { Show } from '../../../types'
import { listAllShows } from '../../../lib/admin'
import { formatLongDate, formatPrice } from '../../../lib/format'
import ShowPoster from '../../../components/shows/ShowPoster'
import { adminCard, badge, btnGold, btnOutline } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'

const todayInSA = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())

/** Every show, soonest first, with sales at a glance and links to edit it or open its guest list. */
export default function AdminShows() {
  const [shows, setShows] = useState<Show[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    listAllShows().then(setShows, (e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="text-red-200">{error}</p>
  if (!shows) return <p className="text-mist">Loading shows…</p>

  const today = todayInSA()
  const upcoming = shows.filter((s) => s.date >= today)
  const past = shows.filter((s) => s.date < today).reverse()

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-ivory">Shows</h1>
          <p className="mt-1 text-sm text-mist">Add and edit shows, see who bought tickets and check guests in at the door.</p>
        </div>
        <Link to={`${ADMIN_BASE}/shows/new`} className={btnGold}>
          <Plus size={14} /> Add show
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {upcoming.length === 0 && <p className="text-mist">No upcoming shows. Add one to put it on the website.</p>}
        {upcoming.map((s) => (
          <ShowRow key={s.id} show={s} tonight={s.date === today} />
        ))}
      </div>

      {past.length > 0 && (
        <div className="mt-10">
          <button type="button" onClick={() => setShowPast((v) => !v)} className="text-xs font-semibold uppercase tracking-[0.16em] text-mist hover:text-ivory">
            {showPast ? 'Hide' : 'Show'} past shows ({past.length})
          </button>
          {showPast && (
            <div className="mt-4 space-y-3 opacity-80">
              {past.map((s) => (
                <ShowRow key={s.id} show={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ShowRow({ show, tonight = false }: { show: Show; tonight?: boolean }) {
  const pct = show.capacity ? Math.min(100, Math.round((show.tickets_sold / show.capacity) * 100)) : 0

  return (
    <div className={`${adminCard} flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${tonight ? 'border-gold/60' : ''}`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ShowPoster show={show} className="aspect-[5/7] w-14 shrink-0 rounded-lg ring-1 ring-white/10" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {tonight && <span className={`${badge} bg-gold text-night`}>Tonight</span>}
            {show.is_published === false && <span className={`${badge} bg-white/10 text-mist`}>Hidden</span>}
          </div>
          <p className="mt-1 truncate font-display text-lg uppercase leading-tight text-ivory">{show.title}</p>
          <p className="text-xs text-mist">
            {formatLongDate(show.date)} · {show.doors_time} · {formatPrice(show.price_cents, show.currency)} per seat
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-ivory/80">
              {show.tickets_sold} / {show.capacity} seats sold
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to={`${ADMIN_BASE}/shows/${show.id}/guests`} className={`${tonight ? btnGold : btnOutline} flex-1 sm:flex-none`}>
          <DoorOpen size={14} /> Guests & door
        </Link>
        <Link to={`${ADMIN_BASE}/shows/${show.id}/edit`} className={`${btnOutline} flex-1 sm:flex-none`}>
          <Pencil size={14} /> Edit
        </Link>
      </div>
    </div>
  )
}
