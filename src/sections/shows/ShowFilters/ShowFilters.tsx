import { useRef } from 'react'
import { gsap, useGSAP } from '../../../lib/gsap'

export type ShowFilter = 'all' | 'live-music' | 'bok-town'

const filters: { key: ShowFilter; label: string }[] = [
  { key: 'all', label: 'All shows' },
  { key: 'live-music', label: 'Live music' },
  { key: 'bok-town', label: 'Bok Town' },
]

interface Props {
  value: ShowFilter
  onChange: (value: ShowFilter) => void
  counts: Record<ShowFilter, number>
}

/** Segmented control with a pill that glides to the active option (GSAP). */
export default function ShowFilters({ value, onChange, counts }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const active = root.current?.querySelector<HTMLButtonElement>(`[data-filter="${value}"]`)
      if (!active || !pill.current) return
      gsap.to(pill.current, {
        x: active.offsetLeft,
        width: active.offsetWidth,
        duration: 0.6,
        ease: 'power3.inOut',
      })
    },
    { scope: root, dependencies: [value] },
  )

  return (
    <div ref={root} role="tablist" aria-label="Filter shows" className="relative inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1.5">
      <span
        ref={pill}
        className={`absolute bottom-1.5 left-0 top-1.5 rounded-full ${value === 'bok-town' ? 'bg-bok-grass' : 'bg-ember'} shadow-[0_8px_30px_-8px_rgb(201_162_74/0.8)] transition-colors duration-500`}
        style={{ width: 0 }}
      />
      {filters.map((f) => (
        <button
          key={f.key}
          data-filter={f.key}
          type="button"
          role="tab"
          aria-selected={value === f.key}
          onClick={() => onChange(f.key)}
          className={`relative z-10 rounded-full px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition-colors sm:px-6 ${
            value === f.key ? (value === 'bok-town' ? 'text-white' : 'text-night') : 'text-ivory/50 hover:text-ivory'
          }`}
        >
          {f.label} <span className="ml-1 opacity-60">{counts[f.key]}</span>
        </button>
      ))}
    </div>
  )
}
