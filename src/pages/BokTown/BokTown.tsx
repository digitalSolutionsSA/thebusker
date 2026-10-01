import { images } from '../../data/images'
import BokTownHero from '../../sections/bokTown/BokTownHero'
import MatchDayPerks from '../../sections/bokTown/MatchDayPerks'
import FixturesSection from '../../sections/bokTown/FixturesSection'
import WatchTogether from '../../sections/bokTown/WatchTogether'
import Spotlight from '../../sections/shared/Spotlight'
import ZoomReveal from '../../sections/shared/ZoomReveal'
import GallerySection from '../../sections/shared/GallerySection'

export default function BokTown() {
  return (
    <>
      <BokTownHero />
      <FixturesSection />
      <Spotlight
        tone="bok"
        image={images.hero.stadium}
        heavy="Go"
        thin="Bokke!"
        eyebrow="Match day at The Busker"
        copy="Every Springbok test live on the big screen — anthem, kick-off and the final whistle, with V-Town in full voice."
      />
      <WatchTogether />
      <MatchDayPerks />
      <ZoomReveal
        tone="bok"
        image={images.venue.bigScreen}
        alt="Fans watching the match on a big screen"
        left="Green"
        right="& gold."
        caption="Book a table early — match days fill up fast."
      />
      <GallerySection
        tag="bok-town"
        tone="bok"
        eyebrow="Match day moments"
        title="The sea of green & gold"
        subtitle="A look back at previous Springbok match days at The Busker."
        limit={8}
      />
    </>
  )
}
