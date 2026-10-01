import type { Team } from '../../../data/teams'

interface Props {
  team: Team
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-11 h-11 text-[0.6rem]',
  md: 'w-14 h-14 text-xs',
  lg: 'w-20 h-20 text-sm',
}

/** Circular crest in the team's colours (no copyrighted logos needed). */
export default function TeamBadge({ team, size = 'md' }: Props) {
  const [primary, secondary] = team.colors
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizes[size]} relative grid place-items-center rounded-full font-bold tracking-wider shadow-[0_8px_24px_-6px_rgb(0_0_0/0.8)]`}
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${primary} 55%, ${secondary} 55%, ${secondary} 100%)`,
          boxShadow: `inset 0 0 0 2px rgb(255 255 255 / 0.15), 0 0 0 3px ${secondary}33`,
        }}
        title={team.name}
      >
        <span
          className="rounded-full bg-black/55 px-1.5 py-0.5 text-white backdrop-blur-sm"
          style={{ textShadow: '0 1px 2px rgb(0 0 0 / 0.6)' }}
        >
          {team.code}
        </span>
      </div>
    </div>
  )
}
