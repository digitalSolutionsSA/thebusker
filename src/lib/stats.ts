import { supabase } from './supabase'
import type { Show, ShowCategory } from '../types'
import { referralLabel, sourceLabels, type BookingSource, type BookingStatus } from './admin'
import { bookingRef, showStart } from './format'
import { describeSeats } from '../data/venueLayout'

// Sales figures for the staff portal's Sales & Stats page. Everything is worked out in the browser
// from the shows and bookings tables (read as staff, so row-level security applies as usual).
// Only bookings that hold seats count: paid (money in) and reserved (booked by hand, not paid yet).

export interface StatsBooking {
  id: string
  show_id: string
  quantity: number
  seat_ids: string[]
  name: string
  email: string | null
  phone: string | null
  amount_cents: number
  status: BookingStatus
  source: BookingSource
  checked_in_at: string | null
  created_at: string
  /** Referred by Busker management ("Gert / The Busker"); missing until migration 0018 is run */
  referred_by_management?: boolean
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

/** One person across all their bookings, matched on email, else phone, else name */
export interface Customer {
  key: string
  name: string
  email: string | null
  phone: string | null
  bookings: StatsBooking[]
  shows: number
  tickets: number
  paidCents: number
  lastDate: string
}

export const categoryLabels: Record<ShowCategory, string> = {
  'live-music': 'Live music',
  'bok-town': 'Bok Town',
  special: 'Special',
}

export const statusLabels: Partial<Record<BookingStatus, string>> = { paid: 'Paid', reserved: 'Not paid yet' }

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

export interface StatsData {
  shows: Show[]
  bookings: StatsBooking[]
}

export async function loadStatsData(): Promise<StatsData> {
  const [shows, bookings] = await Promise.all([
    fetchAll<Show>('shows', '*'),
    fetchAll<StatsBooking>(
      'bookings',
      // '*' so this keeps working whether or not newer columns (referred_by_management) exist yet
      '*',
      (q) => q.in('status', ['paid', 'reserved']),
    ),
  ])
  shows.sort((a, b) => b.date.localeCompare(a.date))
  bookings.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { shows, bookings }
}

export const ticketsOf = (b: StatsBooking) => b.seat_ids?.length || b.quantity || 0

export function buildShowStats(show: Show, bookings: StatsBooking[]): ShowStats {
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

const customerKey = (b: StatsBooking) => {
  const email = b.email?.trim().toLowerCase()
  if (email) return `e:${email}`
  const phone = b.phone?.replace(/\D/g, '').replace(/^27/, '0')
  if (phone) return `p:${phone}`
  return `n:${b.name.trim().toLowerCase()}`
}

export function groupCustomers(bookings: StatsBooking[], showsById: Map<string, Show>): Customer[] {
  const map = new Map<string, Customer>()
  for (const b of bookings) {
    const key = customerKey(b)
    let c = map.get(key)
    if (!c) {
      c = { key, name: b.name, email: b.email, phone: b.phone, bookings: [], shows: 0, tickets: 0, paidCents: 0, lastDate: '' }
      map.set(key, c)
    }
    // Bookings are newest first, so keep the first details seen but fill any gaps from older ones
    c.email ||= b.email
    c.phone ||= b.phone
    c.bookings.push(b)
    c.tickets += ticketsOf(b)
    if (b.status === 'paid') c.paidCents += b.amount_cents
    const date = showsById.get(b.show_id)?.date.slice(0, 10) ?? ''
    if (date > c.lastDate) c.lastDate = date
  }
  for (const c of map.values()) c.shows = new Set(c.bookings.map((b) => b.show_id)).size
  return [...map.values()]
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

const csv = (head: string[], rows: (string | number | null | undefined)[][]) => {
  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

export function showsCsv(rows: ShowStats[]): string {
  return csv(
    ['Date', 'Show', 'Artist', 'Type', 'Capacity', 'Tickets', 'Full %', 'Bookings', 'Paid (R)', 'Not paid yet (R)', 'Checked in', 'Website tickets', 'Manual tickets', 'Sold elsewhere'],
    rows.map((r) => {
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
    }),
  )
}

export function salesCsv(bookings: StatsBooking[], showsById: Map<string, Show>): string {
  return csv(
    ['Reference', 'Booked on', 'Show date', 'Show', 'Name', 'Email', 'Phone', 'Tickets', 'Seats', 'Amount (R)', 'Status', 'Sold via', referralLabel, 'Checked in'],
    bookings.map((b) => {
      const show = showsById.get(b.show_id)
      return [
        bookingRef(b.id),
        b.created_at.slice(0, 10),
        show?.date.slice(0, 10),
        show?.title,
        b.name,
        b.email,
        b.phone,
        ticketsOf(b),
        describeSeats(b.seat_ids ?? []).join('; '),
        (b.amount_cents / 100).toFixed(2),
        statusLabels[b.status] ?? b.status,
        sourceLabels[b.source] ?? b.source,
        b.referred_by_management ? 'yes' : '',
        b.checked_in_at ? 'yes' : '',
      ]
    }),
  )
}

export function customersCsv(customers: Customer[]): string {
  return csv(
    ['Name', 'Email', 'Phone', 'Shows', 'Tickets', 'Paid (R)', 'Last show'],
    customers.map((c) => [c.name, c.email, c.phone, c.shows, c.tickets, (c.paidCents / 100).toFixed(2), c.lastDate]),
  )
}

export function downloadCsv(filename: string, text: string) {
  // BOM so Excel opens accented names correctly
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
