import { supabase } from './supabase'
import type { Show, ShowCategory } from '../types'

// Data access for the staff portal (ADMIN_BASE). Everything here runs as the signed-in staff member; the
// database's row-level security and staff-only functions decide what they may read and change.

export type BookingStatus = 'pending' | 'paid' | 'reserved' | 'cancelled' | 'failed' | 'refunded' | 'refund_failed'
export type BookingSource = 'online' | 'phone' | 'whatsapp' | 'pharmacy' | 'door' | 'other'

export interface Booking {
  id: string
  show_id: string
  quantity: number
  seat_ids: string[]
  name: string
  email: string | null
  phone: string | null
  amount_cents: number
  currency: string
  status: BookingStatus
  source: BookingSource
  notes: string | null
  checked_in_at: string | null
  created_at: string
}

export const sourceLabels: Record<BookingSource, string> = {
  online: 'Website',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  pharmacy: 'Euro Pharmacy',
  door: 'At the door',
  other: 'Other',
}

export { bookingRef } from './format'

const db = () => {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/** Turns database errors into the message staff should see */
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

export async function isStaff(): Promise<boolean> {
  const { data, error } = await db().rpc('is_staff')
  fail(error)
  return data === true
}

export async function listAllShows(): Promise<Show[]> {
  const { data, error } = await db().from('shows').select('*').order('date', { ascending: true })
  fail(error)
  return (data ?? []) as Show[]
}

export async function getShow(id: string): Promise<Show> {
  const { data, error } = await db().from('shows').select('*').eq('id', id).single()
  fail(error)
  return data as Show
}

export interface ShowInput {
  title: string
  artist: string
  description: string
  date: string
  doors_time: string
  price_cents: number
  category: ShowCategory
  image_url: string | null
  is_published: boolean
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export async function saveShow(input: ShowInput, id?: string): Promise<Show> {
  if (id) {
    const { data, error } = await db()
      .from('shows')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    fail(error)
    return data as Show
  }

  // New show: every show sells the whole venue, so capacity = number of seats in the plan
  const { count } = await db().from('venue_seats').select('id', { count: 'exact', head: true })
  let slug = slugify(input.title) || 'show'
  const { data: clash } = await db().from('shows').select('id').eq('slug', slug).maybeSingle()
  if (clash) slug = `${slug}-${input.date}`

  const { data, error } = await db()
    .from('shows')
    .insert({ ...input, slug, currency: 'ZAR', capacity: count ?? 0 })
    .select()
    .single()
  fail(error)
  return data as Show
}

export async function deleteShow(id: string) {
  const { error } = await db().from('shows').delete().eq('id', id)
  fail(error)
}

export async function uploadPoster(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await db().storage.from('posters').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  fail(error)
  return db().storage.from('posters').getPublicUrl(path).data.publicUrl
}

export async function listBookings(showId: string): Promise<Booking[]> {
  const { data, error } = await db()
    .from('bookings')
    .select('id, show_id, quantity, seat_ids, name, email, phone, amount_cents, currency, status, source, notes, checked_in_at, created_at')
    .eq('show_id', showId)
    .order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as Booking[]
}

export async function setCheckedIn(bookingId: string, checkedIn: boolean): Promise<string | null> {
  const { data, error } = await db().rpc('set_checked_in', { p_booking_id: bookingId, p_checked_in: checkedIn })
  fail(error)
  return (data as string | null) ?? null
}

export async function markPaid(bookingId: string) {
  const { error } = await db().rpc('mark_booking_paid', { p_booking_id: bookingId })
  fail(error)
}

export async function cancelBooking(bookingId: string) {
  const { error } = await db().rpc('cancel_booking', { p_booking_id: bookingId })
  fail(error)
}

export interface ManualSaleInput {
  showId: string
  seatIds: string[]
  name: string
  phone: string
  email: string
  source: BookingSource
  paid: boolean
  amountCents: number
  notes: string
}

export async function createManualBooking(input: ManualSaleInput): Promise<string> {
  const { data, error } = await db().rpc('create_manual_booking', {
    p_show_id: input.showId,
    p_seat_ids: input.seatIds,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_source: input.source,
    p_paid: input.paid,
    p_amount_cents: input.amountCents,
    p_notes: input.notes,
  })
  fail(error)
  return data as string
}
