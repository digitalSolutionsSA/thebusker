import type { Show } from '../../../types'
import { parseFixture } from '../../../data/teams'
import { stockPoster } from '../../../data/images'
import TeamBadge from '../../ui/TeamBadge'
import Photo from '../../ui/Photo'

interface Props {
  show: Show
  className?: string
  /** bigger badges for hero/detail use */
  large?: boolean
  priority?: boolean
}

// Colour grade for stock photos so they feel part of the brand (real posters are shown untouched)
const grades = {
  'live-music': 'bg-gradient-to-t from-night via-ember-deep/25 to-ember/10',
  'bok-town': 'bg-gradient-to-t from-bok-night via-bok-green/40 to-bok-grass/10',
  special: 'bg-gradient-to-t from-night via-gold/15 to-transparent',
}

/** Show artwork — the show's own poster if set, otherwise a matching stock photo. */
export default function ShowPoster({ show, className = '', large = false, priority }: Props) {
  // Let callers position the poster absolutely without "relative" overriding it
  const positioned = /\babsolute\b/.test(className) ? '' : 'relative'

  if (show.image_url) {
    return (
      <div className={`${positioned} isolate overflow-hidden ${className}`}>
        <Photo src={show.image_url} alt={`${show.title} poster`} priority={priority} className="absolute inset-0" imgClassName="object-top" />
      </div>
    )
  }

  const fixture = show.category === 'bok-town' ? parseFixture(show.title) : null

  return (
    <div className={`${positioned} isolate overflow-hidden ${className}`}>
      <Photo src={stockPoster(show)} alt="" priority={priority} className="absolute inset-0" />
      <div className={`absolute inset-0 ${grades[show.category]}`} />

      {fixture && (
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/25">
          <TeamBadge team={fixture.home} size={large ? 'lg' : 'md'} />
          <span className="font-brush text-2xl text-white drop-shadow">vs</span>
          <TeamBadge team={fixture.away} size={large ? 'lg' : 'md'} />
        </div>
      )}
    </div>
  )
}
