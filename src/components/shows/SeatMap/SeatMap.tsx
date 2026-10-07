import type { KeyboardEvent } from 'react'
import { SEAT_SIZE, type Floor, type SeatSpot } from '../../../data/venueLayout'

interface Props {
  floor: Floor
  /** Seat ids that are sold or held */
  taken: Set<string>
  /** Selected table ids and single seat ids */
  selected: Set<string>
  onToggle: (id: string) => void
}

type State = 'free' | 'selected' | 'taken'

const seatClass: Record<State, string> = {
  free: 'fill-ivory/10 stroke-gold/60 group-hover:fill-gold/40 group-focus-visible:fill-gold/40',
  selected: 'fill-gold stroke-gold-light',
  taken: 'fill-white/[0.03] stroke-white/15',
}

const tableClass: Record<State, string> = {
  free: 'fill-night-3 stroke-gold/40 group-hover:stroke-gold group-hover:fill-gold/10 group-focus-visible:stroke-gold',
  selected: 'fill-gold/25 stroke-gold',
  taken: 'fill-white/[0.02] stroke-white/10',
}

function Seat({ spot, state }: { spot: SeatSpot; state: State }) {
  const half = SEAT_SIZE / 2
  return (
    <rect
      x={spot.x - half}
      y={spot.y - half}
      width={SEAT_SIZE}
      height={SEAT_SIZE}
      rx={4}
      strokeWidth={1.4}
      transform={spot.rotate ? `rotate(${spot.rotate} ${spot.x} ${spot.y})` : undefined}
      className={`transition-colors ${seatClass[state]}`}
    />
  )
}

/** Hall plan: tap a table to book all its seats, or a single seat along the walls and upstairs. */
export default function SeatMap({ floor, taken, selected, onToggle }: Props) {
  const interactive = (id: string, state: State, label: string) => ({
    role: 'button',
    tabIndex: state === 'taken' ? -1 : 0,
    'aria-label': label,
    'aria-pressed': state === 'selected',
    'aria-disabled': state === 'taken',
    className: `group outline-none ${state === 'taken' ? 'cursor-not-allowed' : 'cursor-pointer'}`,
    onClick: () => state !== 'taken' && onToggle(id),
    onKeyDown: (e: KeyboardEvent) => {
      if (state !== 'taken' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onToggle(id)
      }
    },
  })

  return (
    <svg viewBox={floor.viewBox} className="block h-auto w-full select-none" aria-label={`${floor.name} seating plan`}>
      {floor.id === 'downstairs' ? <DownstairsDecor /> : <UpstairsDecor />}

      {floor.tables.map((t) => {
        const state: State = t.seats.some((s) => taken.has(s.id)) ? 'taken' : selected.has(t.id) ? 'selected' : 'free'
        const label = `${t.label}, ${t.seats.length} seats${state === 'taken' ? ', booked' : ''}`
        return (
          <g key={t.id} {...interactive(t.id, state, label)}>
            <title>{label}</title>
            <rect
              x={t.cx - t.w / 2}
              y={t.cy - t.h / 2}
              width={t.w}
              height={t.h}
              rx={4}
              strokeWidth={1.5}
              transform={t.rotate ? `rotate(${t.rotate} ${t.cx} ${t.cy})` : undefined}
              className={`transition-colors ${tableClass[state]}`}
            />
            <text
              x={t.cx}
              y={t.cy}
              textAnchor="middle"
              dominantBaseline="central"
              transform={t.rotate ? `rotate(${t.rotate} ${t.cx} ${t.cy})` : undefined}
              className={`pointer-events-none text-[11px] font-semibold ${state === 'selected' ? 'fill-ivory' : state === 'taken' ? 'fill-white/20' : 'fill-mist'}`}
            >
              {t.w > t.h ? `${t.id} · ${t.seats.length}` : t.id}
            </text>
            {t.seats.map((s) => (
              <Seat key={s.id} spot={s} state={state} />
            ))}
          </g>
        )
      })}

      {floor.singles.map((s) => {
        const state: State = taken.has(s.id) ? 'taken' : selected.has(s.id) ? 'selected' : 'free'
        const label = `${s.label}${state === 'taken' ? ', booked' : ''}`
        return (
          <g key={s.id} {...interactive(s.id, state, label)}>
            <title>{label}</title>
            {/* Bigger invisible hit area for fingers */}
            <rect x={s.x - 12} y={s.y - 12} width={24} height={24} fill="transparent" />
            <Seat spot={s} state={state} />
          </g>
        )
      })}
    </svg>
  )
}

const wall = 'fill-none stroke-ivory/30'
const caption = 'fill-mist text-[11px] font-semibold uppercase tracking-[0.2em]'

function DownstairsDecor() {
  return (
    <g aria-hidden className="pointer-events-none">
      <rect x={70} y={85} width={620} height={75} rx={3} className="fill-gold/10 stroke-gold/50" strokeWidth={1.5} />
      <text x={380} y={123} textAnchor="middle" dominantBaseline="central" className="fill-gold text-[22px] font-bold tracking-[0.35em]">
        STAGE
      </text>
      <path d="M57 160 V770 M57 850 V872 L275 962 V990 H485 V962 L722 872 V790 M722 160 V690 L635 745" className={wall} strokeWidth={3} />
      <text x={44} y={810} textAnchor="middle" transform="rotate(-90 44 810)" className={caption}>
        Entrance
      </text>
      <text x={42} y={710} textAnchor="middle" className={caption}>SC</text>
      <text x={737} y={650} textAnchor="middle" className={caption}>SH</text>
      <text x={700} y={782} textAnchor="middle" className={caption}>SG</text>
      <text x={160} y={985} textAnchor="middle" className={caption}>SD</text>
      <text x={600} y={985} textAnchor="middle" className={caption}>SF</text>
      <text x={380} y={1008} textAnchor="middle" className="fill-ivory/60 text-[15px] font-bold tracking-[0.3em]">
        SOUND BOX
      </text>
    </g>
  )
}

function UpstairsDecor() {
  return (
    <g aria-hidden className="pointer-events-none">
      <rect x={180} y={40} width={420} height={50} rx={3} strokeDasharray="6 6" className="fill-gold/5 stroke-gold/40" strokeWidth={1.5} />
      <text x={390} y={65} textAnchor="middle" dominantBaseline="central" className="fill-gold/80 text-[14px] font-bold tracking-[0.3em]">
        STAGE (BELOW)
      </text>
      <path d="M85 90 V585 H695 V90 M135 90 V535 H645 V90" className={wall} strokeWidth={2} />
      <text x={390} y={330} textAnchor="middle" className="fill-ivory/25 text-[13px] font-semibold uppercase tracking-[0.3em]">
        Open to the hall
      </text>
    </g>
  )
}
