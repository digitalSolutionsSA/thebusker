import { useCountdown } from '../../../hooks/useCountdown'

interface Props {
  target: Date | null
  tone?: 'ember' | 'bok'
  /** Shown once the target time has passed */
  fallback?: string
  className?: string
  /** smaller boxes, e.g. inside the home hero */
  compact?: boolean
}

const tones = {
  ember: { box: 'border-white/10 bg-white/[0.04]', value: 'text-ivory', label: 'text-mist' },
  bok: { box: 'border-bok-gold/25 bg-black/30', value: 'text-bok-gold', label: 'text-white/60' },
}

export default function CountdownTimer({ target, tone = 'ember', fallback = 'It’s showtime — see you tonight.', className = '', compact = false }: Props) {
  const countdown = useCountdown(target)
  const t = tones[tone]

  if (!countdown) return <p className={`text-mist ${className}`}>{fallback}</p>

  const units = [
    { label: 'Days', value: countdown.days },
    { label: 'Hours', value: countdown.hours },
    { label: 'Mins', value: countdown.minutes },
    { label: 'Secs', value: countdown.seconds },
  ]

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${className}`} role="timer" aria-live="off">
      {units.map((u) => (
        <div key={u.label} className={`rounded-xl border px-2 text-center ${compact ? 'py-2.5' : 'py-3 sm:py-4'} ${t.box}`}>
          <div className={`font-display tabular-nums leading-none ${compact ? 'text-2xl' : 'text-2xl sm:text-4xl'} ${t.value}`}>
            {String(u.value).padStart(2, '0')}
          </div>
          <div className={`mt-2 text-[0.6rem] uppercase tracking-[0.3em] ${t.label}`}>{u.label}</div>
        </div>
      ))}
    </div>
  )
}
