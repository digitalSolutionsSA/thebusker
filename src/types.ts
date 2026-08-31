export interface Show {
  id: string
  slug: string
  title: string
  artist: string
  description: string
  date: string // ISO date
  doors_time: string // e.g. "19:00"
  image_url: string | null
  price_cents: number
  currency: string
  capacity: number
  tickets_sold: number
  category: 'live-music' | 'bok-town' | 'special'
  stripe_price_id: string | null
}

export interface BookingRequest {
  showId: string
  quantity: number
  name: string
  email: string
  phone: string
}
