import type { Show } from '../types'

export const formatPrice = (cents: number, currency = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)

/** Short booking code customers see after paying and can quote at the door (first 8 of the booking id) */
export const bookingRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`)

export const formatDay = (iso: string) => toDate(iso).toLocaleDateString('en-ZA', { day: '2-digit' })

export const formatMonth = (iso: string) =>
  toDate(iso).toLocaleDateString('en-ZA', { month: 'short' }).replace('.', '').toUpperCase()

export const formatLongDate = (iso: string) =>
  toDate(iso).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatShortDate = (iso: string) =>
  toDate(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })

/**
 * When doors open, in South African time (SAST, UTC+2, no daylight saving) — so the
 * countdown is right for every visitor, whatever time zone their device is set to.
 */
export const showStart = (show: Pick<Show, 'date' | 'doors_time'>) =>
  new Date(`${show.date.slice(0, 10)}T${(show.doors_time || '19:00').padStart(5, '0')}:00+02:00`)

export const ticketsRemaining = (show: Show) => Math.max(0, show.capacity - show.tickets_sold)

export const isSellingFast = (show: Show) => {
  const left = ticketsRemaining(show)
  return left > 0 && left <= show.capacity * 0.15
}
