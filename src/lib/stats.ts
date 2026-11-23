import { supabase } from './supabase'
import type { Show, ShowCategory } from '../types'
import type { BookingSource, BookingStatus } from './admin'
import { showStart } from './format'

// Sales figures for the staff portal's Sales & Stats page. Everything is worked out in the browser
// from the shows and bookings tables (read as staff, so row-level security applies as usual).
// Only bookings that hold seats count: paid (money in) and reserved (booked by hand, not paid yet).

export interface StatsBooking {
  id: string
  show_id: string
  quantity: number
  seat_ids: string[]
  amount_cents: number
  status: BookingStatus
  source: BookingSource
  checked_in_at: string | null
  created_at: string
}

export interface ShowStats {
  show: Show
  /** Tickets (seats) on paid and reserved bookings */
  tickets: number
  bookings: number
  /** Paid bookings only */
  revenueCents: number
  /** Reserved bookings: booked but not paid yet */
  outstandingCents: number
  /** Tickets on bookings that were checked in at the door */
  checkedIn: number
  /** 0–100, against the show's capacity */
  fillPct: number
  bySource: Partial<Record<BookingSource, { tickets: number; revenueCents: number }>>
  /** For each booking: whole days between booking and doors opening */
  leadDays: number[]
  /** Tickets were sold on another site, so they aren't in these numbers */
  external: boolean
}

export const categoryLabels: Record<ShowCategory, string> = {
  'live-music': 'Live music',
  'bok-town': 'Bok Town',
  special: 'Special',
}

const PAGE = 1000

async function fetchAll<T>(table: 'shows' | 'bookings', columns: string, filter?: (q: any) => any): Promise<T[]> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const rows: T[] = []
  // Supabase returns at most 1000 rows per request, so read page by page
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns).order('id').range(from, from + PAGE - 1)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

export async function loadShowStats(): Promise<ShowStats[]> {
  const [shows, bookings] = await Promise.all([
    fetchAll<Show>('shows', '*'),
    fetchAll<StatsBooking>('bookings', 'id, show_id, quantity, seat_ids, amount_cents, status, source, checked_in_at, created_at', (q) =>
      q.in('status', ['paid', 'reserved']),
    ),
  ])

  const byShow = new Map<string, StatsBooking[]>()
  for (const b of bookings) byShow.set(b.show_id, [...(byShow.get(b.show_id) ?? []), b])

  return shows
    .map((show) => buildShowStats(show, byShow.get(show.id) ?? []))
    .sort((a, b) => b.show.date.localeCompare(a.show.date))
}

export const ticketsOf = (b: StatsBooking) => b.seat_ids?.length || b.quantity || 0

function buildShowStats(show: Show, bookings: StatsBooking[]): ShowStats {
  const start = showStart(show).getTime()
  const stats: ShowStats = {
    show,
    tickets: 0,
    bookings: bookings.length,
    revenueCents: 0,
    outstandingCents: 0,
    checkedIn: 0,
    fillPct: 0,
    bySource: {},
    leadDays: [],
    external: !!show.external_ticket_url,
  }
  for (const b of bookings) {
    const t = ticketsOf(b)
    stats.tickets += t
    if (b.status === 'paid') stats.revenueCents += b.amount_cents
    else stats.outstandingCents += b.amount_cents
    if (b.checked_in_at) stats.checkedIn += t
    const src = (stats.bySource[b.source] ??= { tickets: 0, revenueCents: 0 })
    src.tickets += t
    if (b.status === 'paid') src.revenueCents += b.amount_cents
    stats.leadDays.push(Math.max(0, Math.floor((start - new Date(b.created_at).getTime()) / 86_400_000)))
  }
  stats.fillPct = show.capacity ? Math.min(100, Math.round((stats.tickets / show.capacity) * 100)) : 0
  return stats
}

/** How far ahead people book, in buckets of days before doors open */
export const leadBuckets = [
  { label: 'Same day', max: 0 },
  { label: '1–3 days', max: 3 },
  { label: '4–7 days', max: 7 },
  { label: '1–2 weeks', max: 14 },
  { label: '2–4 weeks', max: 30 },
  { label: '1 month +', max: Number.POSITIVE_INFINITY },
]

export function toCsv(rows: ShowStats[]): string {
  const head = ['Date', 'Show', 'Artist', 'Type', 'Capacity', 'Tickets', 'Full %', 'Bookings', 'Paid (R)', 'Not paid yet (R)', 'Checked in', 'Website tickets', 'Manual tickets', 'Sold elsewhere']
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = rows.map((r) => {
    const web = r.bySource.online?.tickets ?? 0
    return [
      r.show.date.slice(0, 10),
      r.show.title,
      r.show.artist,
      categoryLabels[r.show.category] ?? r.show.category,
      r.show.capacity,
      r.tickets,
      r.fillPct,
      r.bookings,
      (r.revenueCents / 100).toFixed(2),
      (r.outstandingCents / 100).toFixed(2),
      r.checkedIn,
      web,
      r.tickets - web,
      r.external ? r.show.external_ticket_seller || 'yes' : '',
    ]
      .map(esc)
      .join(',')
  })
  return [head.join(','), ...lines].join('\n')
}
