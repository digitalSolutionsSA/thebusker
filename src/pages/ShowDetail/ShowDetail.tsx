import { useParams } from 'react-router-dom'
import { useShows } from '../../hooks/useShows'
import { formatShortDate } from '../../lib/format'
import { images } from '../../data/images'
import Button from '../../components/ui/Button'
import ShowHero from '../../sections/showDetail/ShowHero'
import ShowBooking from '../../sections/showDetail/ShowBooking'
import Spotlight from '../../sections/shared/Spotlight'
import ShowsTrack from '../../sections/home/ShowsTrack'

const spotlightPhoto = {
  'live-music': images.hero.blueStage,
  'bok-town': images.hero.stadium,
  special: images.hero.handsUp,
}

export default function ShowDetail() {
  const { slug } = useParams()
  const { shows, loading } = useShows()
  const show = shows.find((s) => s.slug === slug) ?? null

  if (loading) {
    return <div className="min-h-screen animate-pulse bg-night pt-40" />
  }

  if (!show) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 pt-32 text-center">
        <p className="eyebrow text-gold">Show not found</p>
        <h1 className="mt-4 type-heavy text-gold-leaf text-5xl">This show has left the stage</h1>
        <p className="mt-4 max-w-md font-serif text-xl text-mist">It may have already happened or been moved. Take a look at what's coming up next.</p>
        <div className="mt-10">
          <Button to="/shows">See upcoming shows</Button>
        </div>
      </div>
    )
  }

  const bok = show.category === 'bok-town'

  // Keyed on the show so the WebGL scene and pinned triggers rebuild when moving between shows
  return (
    <div key={show.id}>
      <ShowHero show={show} />
      <Spotlight
        tone={bok ? 'bok' : 'gold'}
        image={spotlightPhoto[show.category]}
        heavy={formatShortDate(show.date)}
        thin={`from ${show.doors_time}.`}
        eyebrow={bok ? 'Kick-off build-up' : 'Save the date'}
        copy={bok ? 'Platter, Castle Double Malt and a Springbokkie included — grab a table with the crew.' : `${show.artist} live at The Busker Music Hall & Venue, Vereeniging.`}
      />
      <ShowBooking show={show} />
      <ShowsTrack excludeSlug={show.slug} thin="More" heavy="Shows" />
    </div>
  )
}
