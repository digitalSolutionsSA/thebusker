import { demoShows } from '../data/shows'
import type { BookingRequest, Show } from '../types'

// The public site talks to Supabase's REST endpoints with plain fetch: the supabase-js client is
// ~55 kB gzipped and only the staff portal needs it (auth). Same anon key and permissions as before.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const isSupabaseConfigured = Boolean(SUPABASE_URL && ANON_KEY)

const headers = () => ({ apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' })

/** Calls a Postgres function (supabase.rpc) */
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args) })
  if (!res.ok) throw new Error(`${fn} failed (${res.status})`)
  return res.status === 204 ? (null as T) : ((await res.json()) as T)
}

// Today's date in South Africa (YYYY-MM-DD), so shows drop off at SA midnight for every visitor
const todayInSA = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())

const upcomingDemoShows = () => {
  const today = todayInSA()
  return demoShows
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.doors_time.localeCompare(b.doors_time))
}

// Several sections ask for shows on the same page; share one request per page load.
let showsRequest: Promise<Show[]> | null = null

export function fetchShows(): Promise<Show[]> {
  showsRequest ??= loadShows().catch((err) => {
    showsRequest = null
    throw err
  })
  return showsRequest
}

async function loadShows(): Promise<Show[]> {
  if (!isSupabaseConfigured) return upcomingDemoShows()

  // Hidden shows are readable by signed-in staff, but never belong on the public site
  const query = new URLSearchParams({ select: '*', is_published: 'eq.true', date: `gte.${todayInSA()}`, order: 'date.asc' })
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shows?${query}`, { headers: headers() })
    const data = res.ok ? ((await res.json()) as Show[]) : null
    return data && data.length > 0 ? data : upcomingDemoShows()
  } catch {
    return upcomingDemoShows()
  }
}

export async function fetchShowBySlug(slug: string): Promise<Show | null> {
  const shows = await fetchShows()
  return shows.find((s) => s.slug === slug) ?? null
}

/** Seats that are sold or held in someone's checkout for this show */
export async function fetchTakenSeats(showId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return []
  return (await rpc<string[] | null>('get_taken_seats', { p_show_id: showId })) ?? []
}

type CheckoutResult = { url: string } | { error: string; takenSeats?: string[]; ticketsLeft?: number }

/** Holds the seats and returns the Yoco payment page to send the customer to */
export async function createCheckoutSession(params: BookingRequest): Promise<CheckoutResult> {
  if (!isSupabaseConfigured) {
    return { error: 'Booking is not fully configured yet. Please contact the venue directly on WhatsApp to reserve tickets.' }
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, { method: 'POST', headers: headers(), body: JSON.stringify(params) })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body?.url) {
      return {
        error: body?.error ?? 'Something went wrong creating your booking.',
        takenSeats: body?.takenSeats,
        ticketsLeft: body?.ticketsLeft,
      }
    }
    return { url: body.url as string }
  } catch {
    return { error: 'Could not reach the booking service. Please check your connection and try again.' }
  }
}

/** Frees a booking's held seats straight away when the customer cancels payment */
export async function releaseBooking(bookingId: string) {
  if (!isSupabaseConfigured) return
  await rpc('release_pending_booking', { p_booking_id: bookingId }).catch(() => {})
}
