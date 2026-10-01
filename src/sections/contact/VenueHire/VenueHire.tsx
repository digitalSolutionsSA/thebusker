import { CalendarDays } from 'lucide-react'
import { site } from '../../../config/site'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import Button from '../../../components/ui/Button'
import GLPhoto from '../../../components/three/GLPhoto'
import { images } from '../../../data/images'

/** Venue hire call-out: wiped-in room photo beside the enquiry copy. */
export default function VenueHire() {
  const root = useSectionReveal<HTMLElement>()
  const mail = `mailto:${site.email}?subject=${encodeURIComponent('Venue hire enquiry')}`

  return (
    <section ref={root} id="venue-hire" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-display uppercase text-gold-leaf text-[clamp(2rem,4.4vw,3.6rem)]">
            <span className="mask-line">
              <span>Venue Hire</span>
            </span>
          </h2>
          <span data-rule className="gold-rule mt-6 max-w-[12rem]" />
          <p data-sr="up" className="mt-6 max-w-lg font-serif text-xl leading-relaxed text-ivory/85">
            Looking to host a private event, function or special celebration? The Busker offers the perfect setting — great vibes, a full bar
            and a stage ready to go.
          </p>
          <div data-sr="up" data-sr-delay="150" className="mt-8">
            <Button href={mail} variant="outline">
              <CalendarDays size={15} /> Enquire now
            </Button>
          </div>
        </div>
        <GLPhoto
          src={images.venue.brickLounge}
          alt="A warm, intimate room set up for a private function"
          cursor="Ripple"
          className="h-80 rounded-2xl border border-gold/30 sm:h-[28rem]"
        />
      </div>
    </section>
  )
}
