import { supabase, isSupabaseConfigured } from './supabase'
import { demoShows } from '../data/shows'
import type { Show } from '../types'

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

interface CheckoutParams {
  showId: string
  quantity: number
  name: string
  email: string
  phone: string
}

export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: 'Booking is not fully configured yet. Please contact the venue directly on WhatsApp to reserve tickets.' }
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: params,
  })

  if (error) {
    return { error: error.message ?? 'Something went wrong creating your booking.' }
  }

  return { url: data.url as string }
}
