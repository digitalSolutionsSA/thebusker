import { supabase } from './supabase'
import type { Show, ShowCategory } from '../types'
import { seatsById, type FloorId } from '../data/venueLayout'
import { categoryPrice, openCategories } from './format'

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

/** Where staff can say a booking added by hand came from */
export const manualSources: BookingSource[] = ['phone', 'whatsapp', 'pharmacy', 'door', 'other']

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
  /** 'reserved' sells the seating plan; 'general' sells `capacity` tickets without seats */
  seating: 'reserved' | 'general'
  /** Ticket limit, used for general admission (seat-map shows always sell the whole plan) */
  capacity: number
  /** Seating-plan ticket types (null on general-admission shows). price_cents is kept at the lowest. */
  price_table_cents: number | null
  price_single_cents: number | null
  price_upstairs_cents: number | null
  /** Tables sold whole, or seat by seat */
  table_mode: 'whole' | 'seats'
  /** Floors taken off sale online (bookings already there stay valid) */
  closed_floors: FloorId[]
  /** Tickets sold on another site (null = sold here). price_cents is then that site's price. */
  external_ticket_url: string | null
  external_ticket_seller: string | null
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
  // Seat-map shows sell the open floors, so their capacity is the number of seats on them
  let capacity = input.capacity
  if (input.external_ticket_url) {
    // Sold elsewhere: keep the seat prices as they are, in case the show comes back to this site
  } else if (input.seating === 'reserved') {
    // The website shows "from" the cheapest ticket type that's on sale
    const tiers = openCategories(input).map((c) => categoryPrice(input, c))
    input = { ...input, price_cents: Math.min(...tiers) }
  } else {
    input = { ...input, price_table_cents: null, price_single_cents: null, price_upstairs_cents: null, closed_floors: [] }
  }
  if (input.seating === 'reserved') {
    let seats = db().from('venue_seats').select('id', { count: 'exact', head: true })
    if (input.closed_floors.length) seats = seats.not('floor', 'in', `(${input.closed_floors.join(',')})`)
    const { count, error } = await seats
    fail(error)
    capacity = count ?? 0
    // Seats already sold on a closed floor still count towards tickets_sold, so they count here too
    // (otherwise "seats left" would come out too low)
    if (id && input.closed_floors.length) {
      const booked = (await listBookings(id)).filter((b) => b.status === 'paid' || b.status === 'reserved')
      capacity += booked.flatMap((b) => b.seat_ids).filter((s) => input.closed_floors.includes(seatsById.get(s)?.floor as FloorId)).length
    }
  }

  if (id) {
    const { data, error } = await db()
      .from('shows')
      .update({ ...input, capacity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    fail(error)
    return data as Show
  }

  let slug = slugify(input.title) || 'show'
  const { data: clash } = await db().from('shows').select('id').eq('slug', slug).maybeSingle()
  if (clash) slug = `${slug}-${input.date}`

  const { data, error } = await db()
    .from('shows')
    .insert({ ...input, capacity, slug, currency: 'ZAR' })
    .select()
    .single()
  fail(error)
  return data as Show
}

export async function deleteShow(id: string) {
  const { error } = await db().from('shows').delete().eq('id', id)
  fail(error)
}

/** Widest a poster is ever shown (show page on a retina screen); anything bigger is wasted download */
const POSTER_MAX_WIDTH = 1200

/**
 * Shrinks a poster in the browser to WebP before upload, so a 20 MB design export becomes ~100 kB
 * for every visitor. Falls back to the original file if the browser can't decode or encode it.
 */
async function optimisePoster(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, POSTER_MAX_WIDTH / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8))
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

export async function uploadPoster(original: File): Promise<string> {
  const file = await optimisePoster(original)
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

export interface BookingEdit {
  name: string
  phone: string
  email: string
  notes: string
  /** Bookings added by hand only; online bookings keep their source, amount and status */
  source?: BookingSource
  paid?: boolean
  amountCents?: number
}

export async function updateBooking(bookingId: string, edit: BookingEdit) {
  const { error } = await db().rpc('update_booking', {
    p_booking_id: bookingId,
    p_name: edit.name,
    p_phone: edit.phone,
    p_email: edit.email,
    p_notes: edit.notes,
    p_source: edit.source ?? null,
    p_paid: edit.paid ?? null,
    p_amount_cents: edit.amountCents ?? null,
  })
  fail(error)
}

export interface ManualSaleInput {
  showId: string
  /** Seat-map shows */
  seatIds: string[]
  /** General-admission shows */
  quantity?: number
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
    p_quantity: input.quantity ?? null,
  })
  fail(error)
  return data as string
}
