import HomeHero from '../../sections/home/HomeHero'
import Pillars from '../../sections/home/Pillars'
import VenueStory from '../../sections/home/VenueStory'
import Spotlight from '../../sections/shared/Spotlight'
import ShowsTrack from '../../sections/home/ShowsTrack'
import QuoteBanner from '../../sections/home/QuoteBanner'
import Marquee from '../../components/ui/Marquee'

export default function Home() {
  return (
    <>
      <HomeHero />
      <Pillars />
      <div className="relative overflow-hidden border-b border-gold/30 bg-night-2 text-ivory/90">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-slats opacity-40" />
        <Marquee items={['Live Music', 'Good Food', 'Cold Taps', 'Big Screen Rugby', 'Date Nights', 'Unforgettable Nights']} />
      </div>
      <VenueStory />
      <Spotlight />
      <ShowsTrack />
      <QuoteBanner />
    </>
  )
}
