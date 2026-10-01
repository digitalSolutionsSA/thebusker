import { images } from '../../data/images'
import PageHero from '../../sections/shared/PageHero'
import ZoomReveal from '../../sections/shared/ZoomReveal'
import GallerySection from '../../sections/shared/GallerySection'
import CtaBanner from '../../sections/shared/CtaBanner'

export default function Gallery() {
  return (
    <>
      <PageHero
        images={[images.hero.handsUp, images.hero.warmCrowd, images.hero.blueBand]}
        compact
        eyebrow="Gallery"
        thin="Nights to"
        title="Remember"
        subtitle="Live music, match days and good times at The Busker."
      />
      <ZoomReveal
        image={images.venue.guitarWall}
        alt="Guitars on the wall of a warm music room"
        left="Step"
        right="inside."
        caption="Warm lights, cold drinks and a stage that's never quiet for long."
      />
      <GallerySection eyebrow="The Busker" title="Moments from the hall" />
      <CtaBanner title="Be in the next photo" script="Make memories" image={images.hero.warmCrowd} />
    </>
  )
}
