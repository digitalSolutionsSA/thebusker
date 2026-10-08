import { seatsById, tablesById } from '../data/venueLayout'
import { TABLE_PREFIX } from '../components/shows/SeatMap/SeatMap'

// Selection on the seat map is a set of "units": table ids + single seat ids when tables sell whole,
// or plain seat ids when tables sell seat by seat. Shared by the booking panel and the admin sale form.

/** Seat ids behind a selected unit (a whole table expands to its seats) */
export const seatsOf = (id: string) => tablesById.get(id)?.seats.map((s) => s.id) ?? [id]

/** Chip label for a selected unit */
export const unitLabel = (id: string) => tablesById.get(id)?.label ?? seatsById.get(id)?.label ?? id

/** Toggle a unit; in seat-by-seat mode a tap on a table top selects (or clears) all its free seats */
export function toggleUnit(prev: Set<string>, id: string, taken: Set<string>): Set<string> {
  const next = new Set(prev)
  if (id.startsWith(TABLE_PREFIX)) {
    const table = tablesById.get(id.slice(TABLE_PREFIX.length))
    if (!table) return prev
    const free = table.seats.map((s) => s.id).filter((s) => !taken.has(s))
    const allPicked = free.length > 0 && free.every((s) => next.has(s))
    for (const s of free) {
      if (allPicked) next.delete(s)
      else next.add(s)
    }
    return next
  }
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}
