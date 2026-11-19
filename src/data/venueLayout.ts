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

/**
 * Even grid: every 4-seater block (table + its front seats, 56 tall) sits on one of six rows with the same
 * 17.5 gap above, between and below them — from the long tables' foot seats (bottom 356) down to the centre table (top 814.5)
 */
const ROW_GAP = 17.5
const ROW_PITCH = 56 + ROW_GAP
const rowTops = Array.from({ length: 6 }, (_, k) => 356 + ROW_GAP + k * ROW_PITCH)

const gridTables = [
  ...rowTops.map((top, i) => gridTable(`A${i + 1}`, 175, top)),
  ...rowTops.map((top, i) => gridTable(`B${i + 1}`, 337, top)),
  ...rowTops.map((top, i) => gridTable(`C${i + 1}`, 500, top)),
]

// Each side table (with its end seats) spans two grid rows: S1/S3 rows 1–2, S2/S4 rows 3–4
const sideTop = (row: number) => 356 + ROW_GAP + row * ROW_PITCH + 22
const sideTables = [
  sideTable('S1', 'Side table 1', 111, sideTop(0), 'left'),
  sideTable('S2', 'Side table 2', 111, sideTop(2), 'left'),
  sideTable('S3', 'Side table 3', 649, sideTop(0), 'right'),
  sideTable('S4', 'Side table 4', 649, sideTop(2), 'right'),
]

/** Long table in front of the sound box: 1 seat at each end + 8 along the front */
const centreTable: VenueTable = {
  id: 'D1',
  label: 'Centre table',
  cx: 380,
  cy: 832,
  w: 178,
  h: 35,
  seats: numbered('D1', [
    { x: 279, y: 832 },
    { x: 481, y: 832 },
    ...line(8, 302, 866, 459, 866),
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

const angledTables = [angledTable('E1', 'Angled table left', 173, 855, 14), angledTable('E2', 'Angled table right', 587, 855, -14)]

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
    // Run parallel to the angled back walls (57,872→275,962 and 485,962→722,872), ~22 units clear of them
    ...singles('SD', 'Box SD', line(8, 72, 902, 247, 974), 22),
    ...singles('SF', 'Box SF', line(8, 518, 973, 703, 905), -21),
    ...singles('SG', 'Box SG', line(4, 652, 754, 722, 718), -27),
  ],
}

// ── Upstairs balcony ─────────────────────────────────────────────────────────
// Traced from the venue's upstairs drawing (stage at x 80–640, y 35–137 on that drawing) and made
// mirror-symmetric: every angled wall and seat row runs at 45°, the right side mirrors the left.
// The stage is drawn at the same place and width as downstairs; the floor runs a little deeper.

const UP_SCALE = 620 / 560
const round1 = (n: number) => Math.round(n * 10) / 10
/** Point on the upstairs drawing, in floor units */
const up = (x: number, y: number) => ({ x: round1(70 + (x - 80) * UP_SCALE), y: round1(85 + (y - 35) * UP_SCALE) })
/** n evenly spaced seats between two points of the drawing */
const upLine = (n: number, ax: number, ay: number, bx: number, by: number) => {
  const a = up(ax, ay)
  const b = up(bx, by)
  return line(n, a.x, a.y, b.x, b.y)
}
/** Mirror across the centre line of the stage */
const mirror = <T extends { x: number }>(pts: T[]): T[] => pts.map((p) => ({ ...p, x: round1(760 - p.x) }))

const sideSeats = upLine(30, 53, 145, 53, 683)
const row1Corner = upLine(6, 88, 728, 153, 793)
const row2Corner = upLine(5, 90, 808, 142, 860)
const row3Corner = upLine(8, 62, 867, 154, 959)

/** Walls and the sound box of the upstairs plan, in floor units (drawn by SeatMap) */
const polyline = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${up(x, y).x} ${up(x, y).y}`).join(' ')
const soundTopLeft = up(170, 923)
const soundBottomRight = up(550, 1026)
export const upstairsPlan = {
  stage: { ...up(80, 35), w: round1(560 * UP_SCALE), h: round1(102 * UP_SCALE) },
  sound: { ...soundTopLeft, w: round1(soundBottomRight.x - soundTopLeft.x), h: round1(soundBottomRight.y - soundTopLeft.y) },
  walls: [
    polyline([[80, 137], [80, 690], [210, 820], [510, 820], [640, 690], [640, 137]]),
    polyline([[82, 778], [174, 870], [546, 870], [638, 778]]),
    polyline([[60, 841], [170, 951]]),
    polyline([[660, 841], [550, 951]]),
  ].join(' '),
  hallCentre: up(360, 480),
  /** Group names drawn beside the seats, matching the seat labels ("Balcony left", "Balcony back row 1 …") */
  labels: [
    // Angled corner rows, written along the row on its hall side (their seats number from 1 on their own)
    { text: 'Row 1 left', x: 100.7, y: 902.3, rotate: 45 },
    { text: 'Row 1 right', x: 659.3, y: 902.3, rotate: -45 },
    { text: 'Row 2 left', x: 95.7, y: 983.7, rotate: 45 },
    { text: 'Row 2 right', x: 664.3, y: 983.7, rotate: -45 },
    { text: 'Left', x: 40, y: 190 },
    { text: 'Left', x: 40, y: 826 },
    { text: 'Right', x: 720, y: 190 },
    { text: 'Right', x: 720, y: 826 },
    { text: 'Row 1', x: 249, y: 970 },
    { text: 'Row 1', x: 511, y: 970 },
    { text: 'Row 2', x: 222, y: 1037 },
    { text: 'Row 2', x: 538, y: 1037 },
    { text: 'Row 3', x: 75, y: 1090 },
    { text: 'Row 3', x: 685, y: 1090 },
  ] as { text: string; x: number; y: number; rotate?: number }[],
}

const upstairs: Floor = {
  id: 'upstairs',
  name: 'Upstairs',
  viewBox: '20 40 745 1160',
  tables: [],
  singles: [
    ...singles('UL', 'Balcony left', sideSeats),
    ...singles('UR', 'Balcony right', mirror(sideSeats)),
    // Row 1 (nearest the hall): angled corners either side of a straight row
    ...singles('UBL', 'Balcony back row 1 left', row1Corner, 45),
    ...singles('UB', 'Balcony back row 1', upLine(10, 277, 834, 443, 834)),
    ...singles('UBR', 'Balcony back row 1 right', mirror(row1Corner), -45),
    // Row 2
    ...singles('UCL', 'Balcony back row 2 left', row2Corner, 45),
    ...singles('UC', 'Balcony back row 2', upLine(12, 258, 895, 462, 895)),
    ...singles('UCR', 'Balcony back row 2 right', mirror(row2Corner), -45),
    // Row 3: angled rows either side of the sound box
    ...singles('UDL', 'Balcony back row 3 left', row3Corner, 45),
    ...singles('UDR', 'Balcony back row 3 right', mirror(row3Corner), -45),
  ],
}

export const floors: Floor[] = [downstairs, upstairs]

/** Floors on sale online for a show (shows.closed_floors lists the ones taken off sale; at least one stays open) */
export function openFloors(show: { closed_floors?: FloorId[] | null }): Floor[] {
  const open = floors.filter((f) => !show.closed_floors?.includes(f.id))
  return open.length ? open : floors
}

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
