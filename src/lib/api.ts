import { supabase, isSupabaseConfigured } from './supabase'
import { demoShows } from '../data/shows'
import type { Show } from '../types'

export async function fetchShows(): Promise<Show[]> {
  if (!isSupabaseConfigured || !supabase) {
    return demoShows
  }

  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date', { ascending: true })

  if (error || !data || data.length === 0) {
    return demoShows
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
