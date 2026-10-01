import { images } from '../../data/images'
import PageHero from '../../sections/shared/PageHero'
import ContactDetails from '../../sections/contact/ContactDetails'
import ContactForm from '../../sections/contact/ContactForm'
import VenueHire from '../../sections/contact/VenueHire'
import VenueMap from '../../sections/contact/VenueMap'
import ZoomReveal from '../../sections/shared/ZoomReveal'

export default function Contact() {
  return (
    <>
      <PageHero
        images={[images.hero.buskerBar, images.venue.guitarWall]}
        dim={0.8}
        compact
        eyebrow="Contact"
        thin="Get in"
        title="Touch"
        subtitle="Questions, bookings or venue hire — we'd love to hear from you."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <ContactDetails />
        <ContactForm />
      </section>
      <VenueHire />
      <ZoomReveal
        image={images.hero.buskerBar}
        alt="The Busker's bar counter"
        left="See you"
        right="soon."
        caption="1 Club Street, Peacehaven — at the Old Barnyard, Vereeniging."
      />
      <VenueMap />
    </>
  )
}
