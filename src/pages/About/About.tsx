import { images } from '../../data/images'
import PageHero from '../../sections/shared/PageHero'
import AboutStory from '../../sections/about/AboutStory'
import Occasions from '../../sections/about/Occasions'
import Spotlight from '../../sections/shared/Spotlight'
import CtaBanner from '../../sections/shared/CtaBanner'
import VenueMap from '../../sections/contact/VenueMap'

export default function About() {
  return (
    <>
      <PageHero
        images={[images.hero.buskerBar, images.hero.diningRoom, images.venue.guitarWall]}
        dim={0.8}
        eyebrow="About the venue"
        thin="More than"
        title="Just a venue"
        subtitle="Good food, great drinks and live music — under one roof at the Old Barnyard."
      />
      <AboutStory />
      <Spotlight
        image={images.venue.liveBand}
        heavy="Built for"
        thin="live music."
        eyebrow="The room"
        copy="A proper stage, a sound rig that does the artists justice and warm lights over every table."
      />
      <Occasions />
      <CtaBanner title="Come and see it for yourself" script="Your table is waiting" image={images.venue.barNight} />
      <VenueMap />
    </>
  )
}
