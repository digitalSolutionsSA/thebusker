// Seating plan of The Busker, transcribed from "stage bookings.pdf" (downstairs) plus the U-shaped
// upstairs balcony. Coordinates are SVG units in each floor's viewBox.
//
// Seats at a table can only be booked together (the whole table); "singles" are bookable one by one.
// The seat ids here must match the venue_seats table — after changing this file run
// `npm run seats:sql` and apply the SQL it prints as a new migration.

export type FloorId = 'downstairs' | 'upstairs'

export interface SeatSpot {
  id: string
  x: number
  y: number
  /** Rotation in degrees */
  rotate?: number
}

export interface VenueTable {
  id: string
  label: string
  /** Table top, centred on (cx, cy) and rotated by `rotate` */
  cx: number
  cy: number
  w: number
  h: number
  rotate?: number
  seats: SeatSpot[]
}

export interface SingleSeat extends SeatSpot {
  label: string
}

export interface Floor {
  id: FloorId
  name: string
  viewBox: string
  tables: VenueTable[]
  singles: SingleSeat[]
}

export const SEAT_SIZE = 16

const rad = (deg: number) => (deg * Math.PI) / 180

/** Point (lx, ly) in a frame centred on (cx, cy) and rotated by `deg` */
const place = (cx: number, cy: number, deg: number, lx: number, ly: number) => ({
  x: Math.round((cx + lx * Math.cos(rad(deg)) - ly * Math.sin(rad(deg))) * 10) / 10,
  y: Math.round((cy + lx * Math.sin(rad(deg)) + ly * Math.cos(rad(deg))) * 10) / 10,
})

const numbered = (tableId: string, spots: { x: number; y: number; rotate?: number }[]): SeatSpot[] =>
  spots.map((s, i) => ({ ...s, id: `${tableId}-${i + 1}` }))

/** Evenly spaced points from a to b (inclusive) */
const line = (n: number, ax: number, ay: number, bx: number, by: number) =>
  Array.from({ length: n }, (_, i) => ({
    x: Math.round((ax + ((bx - ax) * i) / (n - 1)) * 10) / 10,
    y: Math.round((ay + ((by - ay) * i) / (n - 1)) * 10) / 10,
  }))

const singles = (prefix: string, label: string, spots: { x: number; y: number }[], rotate = 0): SingleSeat[] =>
  spots.map((s, i) => ({ ...s, rotate, id: `${prefix}-${i + 1}`, label: `${label} seat ${i + 1}` }))

// ── Downstairs ───────────────────────────────────────────────────────────────

/** The four long tables in front of the stage: 7 seats down each side + 1 at the foot */
const longTables: VenueTable[] = [171, 310, 449, 588].map((cx, i) => {
  const id = `T${i + 1}`
  const rows = Array.from({ length: 7 }, (_, k) => 190 + k * 23)
  return {
    id,
    label: `Long table ${i + 1}`,
    cx,
    cy: 257,
    w: 38,
    h: 155,
    seats: numbered(id, [
      ...rows.map((y) => ({ x: cx - 31, y })),
      ...rows.map((y) => ({ x: cx + 32, y })),
      { x: cx, y: 348 },
    ]),
  }
})

/** Narrow tables along the side walls: 1 seat at each end + 4 along the open side */
const sideTable = (id: string, label: string, cx: number, top: number, side: 'left' | 'right'): VenueTable => {
  const sx = side === 'left' ? cx - 34 : cx + 34
  return {
    id,
    label,
    cx,
    cy: top + 42,
    w: 38,
    h: 85,
    seats: numbered(id, [
      { x: cx, y: top - 14 },
      ...[10, 33, 56, 79].map((dy) => ({ x: sx, y: top + dy })),
      { x: cx, y: top + 99 },
    ]),
  }
}

const sideTables = [
  sideTable('S1', 'Side table 1', 111, 395, 'left'),
  sideTable('S2', 'Side table 2', 111, 565, 'left'),
  sideTable('S3', 'Side table 3', 649, 395, 'right'),
  sideTable('S4', 'Side table 4', 649, 565, 'right'),
]

/** The 4-seater rows: 1 seat at each end + 4 along the front */
const gridTable = (id: string, left: number, top: number): VenueTable => ({
  id,
  label: `Table ${id}`,
  cx: left + 42.5,
  cy: top + 18,
  w: 85,
  h: 36,
  seats: numbered(id, [
    { x: left - 15, y: top + 18 },
    { x: left + 100, y: top + 18 },
    ...[11, 32, 53, 74].map((dx) => ({ x: left + dx, y: top + 48 })),
  ]),
})

const gridTables = [
  ...[390, 465, 540, 615, 690, 765].map((top, i) => gridTable(`A${i + 1}`, 175, top)),
  ...[370, 443, 517, 590, 663, 737].map((top, i) => gridTable(`B${i + 1}`, 337, top)),
  ...[390, 465, 540, 615, 690, 765].map((top, i) => gridTable(`C${i + 1}`, 500, top)),
]

/** Long table in front of the sound box: 1 seat at each end + 8 along the front */
const centreTable: VenueTable = {
  id: 'D1',
  label: 'Centre table',
  cx: 379,
  cy: 832,
  w: 178,
  h: 35,
  seats: numbered('D1', [
    { x: 278, y: 832 },
    { x: 480, y: 832 },
    ...line(8, 301, 866, 458, 866),
  ]),
}

/** Angled tables either side of the sound box: 1 seat at each end + 8 along the front */
const angledTable = (id: string, label: string, cx: number, cy: number, deg: number): VenueTable => ({
  id,
  label,
  cx,
  cy,
  w: 180,
  h: 34,
  rotate: deg,
  seats: numbered(id, [
    { ...place(cx, cy, deg, -100, 0), rotate: deg },
    { ...place(cx, cy, deg, 100, 0), rotate: deg },
    ...Array.from({ length: 8 }, (_, k) => ({ ...place(cx, cy, deg, -78 + (156 * k) / 7, 29), rotate: deg })),
  ]),
})

const angledTables = [angledTable('E1', 'Angled table left', 185, 855, 14), angledTable('E2', 'Angled table right', 582, 860, -14)]

const downstairs: Floor = {
  id: 'downstairs',
  name: 'Downstairs',
  viewBox: '20 40 745 975',
  tables: [...longTables, ...sideTables, ...gridTables, centreTable, ...angledTables],
  singles: [
    ...singles('STL', 'Stage-left', [
      { x: 80, y: 177 },
      { x: 80, y: 199 },
    ]),
    ...singles('STR', 'Stage-right', [
      { x: 697, y: 177 },
      { x: 697, y: 199 },
    ]),
    ...singles('SC', 'Box SC', line(16, 42, 280, 42, 685)),
    ...singles(
      'SH',
      'Box SH',
      [172, 198, 310, 337, 427, 455, 483, 511, 539, 567, 595, 623].map((y) => ({ x: 737, y })),
    ),
    ...singles('SD', 'Box SD', line(8, 75, 906, 258, 960), 16),
    ...singles('SF', 'Box SF', line(8, 505, 960, 685, 906), -16),
    ...singles('SG', 'Box SG', line(4, 652, 754, 722, 718), -27),
  ],
}

// ── Upstairs balcony (U shape around the hall, open towards the stage) ──────────

const upstairs: Floor = {
  id: 'upstairs',
  name: 'Upstairs',
  viewBox: '40 20 700 600',
  tables: [],
  singles: [
    ...singles('UL', 'Balcony left', line(16, 110, 110, 110, 500)),
    ...singles('UR', 'Balcony right', line(16, 670, 110, 670, 500)),
    ...singles('UB', 'Balcony back', line(16, 195, 560, 585, 560)),
  ],
}

export const floors: Floor[] = [downstairs, upstairs]

export interface SeatInfo {
  id: string
  floor: FloorId
  /** Set when the seat belongs to a table (booked whole) */
  tableId: string | null
  label: string
}

/** Every bookable seat, flattened — used for lookups and to generate the venue_seats SQL */
export const allSeats: SeatInfo[] = floors.flatMap((f) => [
  ...f.tables.flatMap((t) => t.seats.map((s, i) => ({ id: s.id, floor: f.id, tableId: t.id, label: `${t.label}, seat ${i + 1}` }))),
  ...f.singles.map((s) => ({ id: s.id, floor: f.id, tableId: null, label: s.label })),
])

export const tablesById = new Map(floors.flatMap((f) => f.tables.map((t) => [t.id, t] as const)))
export const seatsById = new Map(allSeats.map((s) => [s.id, s]))

/** Ticket type of a seat, which decides its price (see priceForSeat in lib/format) */
export type SeatCategory = 'table' | 'single' | 'upstairs'

export function seatCategory(seatId: string): SeatCategory {
  const seat = seatsById.get(seatId)
  if (seat?.floor === 'upstairs') return 'upstairs'
  return seat?.tableId ? 'table' : 'single'
}

/** Human-readable seats for a booking: whole tables by name, then single seats ("Table A3", "Box SC seat 4") */
export function describeSeats(seatIds: string[]): string[] {
  const tables = new Set<string>()
  const singles: string[] = []
  for (const id of seatIds) {
    const seat = seatsById.get(id)
    if (seat?.tableId) tables.add(seat.tableId)
    else singles.push(seat?.label ?? id)
  }
  return [...[...tables].map((t) => tablesById.get(t)?.label ?? t), ...singles]
}
