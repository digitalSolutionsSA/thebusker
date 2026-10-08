export type ShowCategory = 'live-music' | 'bok-town' | 'special'

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
  category: ShowCategory
  stripe_price_id: string | null
  /** Hidden shows (false) only appear in the admin portal */
  is_published?: boolean
  /** 'reserved' = buyers pick seats on the plan; 'general' = just a number of tickets (capacity = limit) */
  seating?: 'reserved' | 'general'
  /** Seating-plan ticket types; null = use price_cents */
  price_table_cents?: number | null
  price_single_cents?: number | null
  price_upstairs_cents?: number | null
  /** 'whole' = tables are sold whole; 'seats' = seats at tables can be bought one by one */
  table_mode?: 'whole' | 'seats'
}

export interface BookingRequest {
  showId: string
  /** Seat-map shows: seat ids from src/data/venueLayout.ts — tables are sent as all their seats */
  seatIds?: string[]
  /** General-admission shows: how many tickets */
  quantity?: number
  name: string
  email: string
  phone: string
}
