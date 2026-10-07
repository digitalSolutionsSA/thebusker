import { supabase, isSupabaseConfigured } from './supabase'
import { demoShows } from '../data/shows'
import type { BookingRequest, Show } from '../types'

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
  if (!isSupabaseConfigured || !supabase) {
    return upcomingDemoShows()
  }

  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .gte('date', todayInSA())
    .order('date', { ascending: true })

  if (error || !data || data.length === 0) {
    return upcomingDemoShows()
  }

  return data as Show[]
}

export async function fetchShowBySlug(slug: string): Promise<Show | null> {
  const shows = await fetchShows()
  return shows.find((s) => s.slug === slug) ?? null
}

/** Seats that are sold or held in someone's checkout for this show */
export async function fetchTakenSeats(showId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase.rpc('get_taken_seats', { p_show_id: showId })
  if (error) throw error
  return (data ?? []) as string[]
}

type CheckoutResult = { url: string } | { error: string; takenSeats?: string[] }

/** Holds the seats and returns the Yoco payment page to send the customer to */
export async function createCheckoutSession(params: BookingRequest): Promise<CheckoutResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Booking is not fully configured yet. Please contact the venue directly on WhatsApp to reserve tickets.' }
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: params,
  })

  if (error) {
    // Non-2xx responses carry our { error, takenSeats } body on the underlying Response
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null)
    return {
      error: body?.error ?? error.message ?? 'Something went wrong creating your booking.',
      takenSeats: body?.takenSeats,
    }
  }

  return { url: data.url as string }
}

/** Frees a booking's held seats straight away when the customer cancels payment */
export async function releaseBooking(bookingId: string) {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.rpc('release_pending_booking', { p_booking_id: bookingId })
}
