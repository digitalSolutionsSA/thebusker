import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, Phone, Plus, Search, Undo2 } from 'lucide-react'
import type { Show } from '../../../types'
import { ADMIN_BASE } from '../../../config/site'
import {
  bookingRef,
  cancelBooking,
  getShow,
  listBookings,
  markPaid,
  setCheckedIn,
  sourceLabels,
  type Booking,
} from '../../../lib/admin'
import { formatLongDate, formatPrice } from '../../../lib/format'
import { describeSeats } from '../../../data/venueLayout'
import { adminCard, adminInput, badge, btnDanger, btnGold, btnGreen, btnOutline } from '../../../components/admin/ui'
import ManualSale from './ManualSale'

const REFRESH_MS = 15_000

type Filter = 'guests' | 'waiting' | 'in' | 'unfinished' | 'cancelled'

const filters: { id: Filter; label: string }[] = [
  { id: 'guests', label: 'All guests' },
  { id: 'waiting', label: 'Not arrived' },
  { id: 'in', label: 'Checked in' },
  { id: 'unfinished', label: 'Unfinished checkouts' },
  { id: 'cancelled', label: 'Cancelled' },
]

const isGuest = (b: Booking) => b.status === 'paid' || b.status === 'reserved'
const isCancelled = (b: Booking) => ['cancelled', 'failed', 'refunded', 'refund_failed'].includes(b.status)

const matches = (b: Booking, q: string) => {
  if (!q) return true
  const needle = q.toLowerCase()
  const digits = q.replace(/\D/g, '')
  return (
    b.name.toLowerCase().includes(needle) ||
    (b.email ?? '').toLowerCase().includes(needle) ||
    bookingRef(b.id).toLowerCase().includes(needle) ||
    (digits.length >= 3 && (b.phone ?? '').replace(/\D/g, '').includes(digits)) ||
    describeSeats(b.seat_ids).some((s) => s.toLowerCase().includes(needle))
  )
}

/**
 * One show's guest list: who bought, how many, paid or not, and a one-tap check-in for the door.
 * Refreshes every 15 seconds so several people can check guests in at the same time.
 */
export default function AdminShowGuests() {
  const { id } = useParams()
  const [show, setShow] = useState<Show | null>(null)
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('guests')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selling, setSelling] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [s, b] = await Promise.all([getShow(id), listBookings(id)])
      setShow(s)
      setBookings(b)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [id])

  useEffect(() => {
    load()
    const t = window.setInterval(load, REFRESH_MS)
    return () => window.clearInterval(t)
  }, [load])

  const stats = useMemo(() => {
    const guests = (bookings ?? []).filter(isGuest)
    const sum = (list: Booking[], f: (b: Booking) => number) => list.reduce((n, b) => n + f(b), 0)
    const paid = guests.filter((b) => b.status === 'paid')
    const reserved = guests.filter((b) => b.status === 'reserved')
    const arrived = guests.filter((b) => b.checked_in_at)
    return {
      seats: sum(guests, (b) => b.quantity),
      paidSeats: sum(paid, (b) => b.quantity),
      reservedSeats: sum(reserved, (b) => b.quantity),
      owed: sum(reserved, (b) => b.amount_cents),
      revenue: sum(paid, (b) => b.amount_cents),
      arrivedSeats: sum(arrived, (b) => b.quantity),
      bookings: guests.length,
      arrivedBookings: arrived.length,
    }
  }, [bookings])

  const visible = useMemo(() => {
    const list = (bookings ?? []).filter((b) => {
      switch (filter) {
        case 'guests':
          return isGuest(b)
        case 'waiting':
          return isGuest(b) && !b.checked_in_at
        case 'in':
          return isGuest(b) && Boolean(b.checked_in_at)
        case 'unfinished':
          return b.status === 'pending'
        case 'cancelled':
          return isCancelled(b)
      }
    })
    return list.filter((b) => matches(b, query.trim())).sort((a, b) => a.name.localeCompare(b.name))
  }, [bookings, filter, query])

  // Run an action on one booking, then reload the list
  const act = async (bookingId: string, action: () => Promise<unknown>) => {
    setBusyId(bookingId)
    try {
      await action()
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  if (error && !show) return <p className="text-red-200">{error}</p>
  if (!show || !bookings) return <p className="text-mist">Loading guest list…</p>

  return (
    <div>
      <Link to={ADMIN_BASE} className="inline-flex items-center gap-2 text-xs text-mist hover:text-ivory">
        <ArrowLeft size={14} /> All shows
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-[0.06em] sm:text-3xl">{show.title}</h1>
          <p className="mt-1 text-sm text-mist">
            {formatLongDate(show.date)} · {show.doors_time}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSelling(true)} className={btnGold}>
            <Plus size={14} /> Record a sale
          </button>
          <Link to={`${ADMIN_BASE}/shows/${show.id}/edit`} className={btnOutline}>
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* At a glance */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Checked in" value={`${stats.arrivedSeats} / ${stats.seats}`} hint={`people · ${stats.arrivedBookings} of ${stats.bookings} bookings`} highlight />
        <Stat label={show.seating === 'general' ? 'Tickets sold' : 'Seats sold'} value={`${stats.seats} / ${show.capacity}`} hint={`${stats.paidSeats} paid · ${stats.reservedSeats} reserved`} />
        <Stat label="Paid" value={formatPrice(stats.revenue, show.currency)} hint="online and recorded sales" />
        <Stat label="Still to pay" value={formatPrice(stats.owed, show.currency)} hint={`${stats.reservedSeats} reserved seats`} />
      </div>

      {/* Search + filters stay in reach while scrolling the list at the door */}
      <div className="sticky top-[65px] z-20 -mx-4 mt-6 border-b border-white/10 bg-night/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, booking ref or table"
            className={`${adminInput} pl-11 text-base`}
            autoComplete="off"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${filter === f.id ? 'bg-gold text-night' : 'border border-white/15 text-mist'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-200">Couldn't refresh: {error}</p>}

      <div className="mt-4 space-y-3">
        {visible.length === 0 && <p className="py-10 text-center text-mist">{query ? 'No one matches that search.' : 'Nobody here yet.'}</p>}
        {visible.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            busy={busyId === b.id}
            onCheckIn={(v) => act(b.id, () => setCheckedIn(b.id, v))}
            onPaid={() => act(b.id, () => markPaid(b.id))}
            onCancel={() => {
              const online = b.source === 'online' && b.status === 'paid'
              const msg = `Cancel ${b.name}'s booking and free ${b.quantity} seat(s)?${online ? '\n\nThis was paid online: refund it in your Yoco portal as well.' : ''}`
              if (confirm(msg)) act(b.id, () => cancelBooking(b.id))
            }}
          />
        ))}
      </div>

      {selling && (
        <ManualSale
          show={show}
          onClose={() => setSelling(false)}
          onSaved={() => {
            setSelling(false)
            setFilter('guests')
            load()
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, hint, highlight = false }: { label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <div className={`${adminCard} p-4 ${highlight ? 'border-gold/50' : ''}`}>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mist">{label}</p>
      <p className={`mt-1 font-display text-2xl tabular-nums ${highlight ? 'text-gold' : 'text-ivory'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-mist">{hint}</p>
    </div>
  )
}

const statusBadge: Record<Booking['status'], { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-300' },
  reserved: { label: 'Not paid yet', className: 'bg-amber-500/15 text-amber-300' },
  pending: { label: 'Checkout not finished', className: 'bg-white/10 text-mist' },
  cancelled: { label: 'Cancelled', className: 'bg-white/10 text-mist' },
  failed: { label: 'Failed', className: 'bg-white/10 text-mist' },
  refunded: { label: 'Refunded', className: 'bg-white/10 text-mist' },
  refund_failed: { label: 'Refund failed — check Yoco', className: 'bg-red-500/15 text-red-300' },
}

function BookingCard({
  booking: b,
  busy,
  onCheckIn,
  onPaid,
  onCancel,
}: {
  booking: Booking
  busy: boolean
  onCheckIn: (checkedIn: boolean) => void
  onPaid: () => void
  onCancel: () => void
}) {
  const guest = isGuest(b)
  const status = statusBadge[b.status]
  const arrived = Boolean(b.checked_in_at)

  return (
    <div className={`${adminCard} p-4 ${arrived ? 'border-emerald-500/40 bg-emerald-950/20' : ''}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg uppercase leading-tight text-ivory">{b.name}</p>
            <span className={`${badge} ${status.className}`}>{status.label}</span>
            {arrived && <span className={`${badge} bg-emerald-500 text-white`}>In {new Date(b.checked_in_at!).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <p className="mt-1 text-sm text-ivory/85">
            {b.seat_ids.length > 0 ? (
              <>
                <span className="font-semibold">{b.quantity} {b.quantity === 1 ? 'seat' : 'seats'}</span> · {describeSeats(b.seat_ids).join(', ')}
              </>
            ) : (
              <>
                <span className="font-semibold">{b.quantity} {b.quantity === 1 ? 'ticket' : 'tickets'}</span> · General admission
              </>
            )}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-mist">
            <span>Ref {bookingRef(b.id)}</span>
            <span>{formatPrice(b.amount_cents, b.currency)}</span>
            <span>{sourceLabels[b.source]}</span>
            {b.phone && (
              <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-ivory/80 hover:text-gold">
                <Phone size={11} /> {b.phone}
              </a>
            )}
            {b.email && <span className="break-all">{b.email}</span>}
          </p>
          {b.notes && <p className="mt-1 text-xs italic text-mist">“{b.notes}”</p>}
        </div>

        {guest && (
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            {b.status === 'reserved' && (
              <button type="button" onClick={onPaid} disabled={busy} className={btnOutline}>
                Mark paid
              </button>
            )}
            {arrived ? (
              <button type="button" onClick={() => onCheckIn(false)} disabled={busy} className={btnOutline}>
                <Undo2 size={14} /> Undo
              </button>
            ) : (
              <button type="button" onClick={() => onCheckIn(true)} disabled={busy} className={`${btnGreen} min-w-[9rem] py-3.5`}>
                <Check size={16} /> Check in
              </button>
            )}
          </div>
        )}
      </div>

      {(guest || b.status === 'pending') && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <button type="button" onClick={onCancel} disabled={busy} className={`${btnDanger} px-3 py-1.5 text-[0.62rem]`}>
            Cancel booking
          </button>
        </div>
      )}
    </div>
  )
}
