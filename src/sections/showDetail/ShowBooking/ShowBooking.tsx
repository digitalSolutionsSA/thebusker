import { MapPin } from 'lucide-react'
import type { Show } from '../../../types'
import { mapsUrl, site } from '../../../config/site'
import { images } from '../../../data/images'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import BookingPanel from '../../../components/shows/BookingPanel'
import GLPhoto from '../../../components/three/GLPhoto'

const venuePhoto: Record<Show['category'], string> = {
  'live-music': images.venue.liveBand,
  'bok-town': images.venue.bigScreen,
  special: images.venue.barCrowd,
}

/** About-the-show copy and a WebGL venue photo beside the sticky booking form. */
export default function ShowBooking({ show }: { show: Show }) {
  const root = useSectionReveal<HTMLElement>([show.id])

  return (
    <section ref={root} id="book" className="relative scroll-mt-24 py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-wood opacity-25" />
      <div className="relative mx-auto grid max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20 lg:px-14">
        <div>
          <p data-sr="fade" className="eyebrow mb-7 flex items-center gap-5 text-gold">
            The night <span className="h-px w-12 bg-current opacity-70" />
          </p>
          <h2 className="leading-[0.98] text-[clamp(2.2rem,4.6vw,4.2rem)]">
            <span className="mask-line">
              <span className="type-thin text-ivory/90">Book your</span>
            </span>
            <span className="mask-line">
              <span className="type-heavy text-gold-leaf">seats tonight</span>
            </span>
          </h2>
          <span data-rule className="gold-rule mt-8 max-w-[12rem]" />
          <p data-sr="up" className="mt-8 max-w-xl font-serif text-xl leading-relaxed text-ivory/85 sm:text-2xl">
            {show.description}
          </p>

          <GLPhoto
            src={venuePhoto[show.category]}
            alt="The stage at The Busker"
            cursor="Ripple"
            className="mt-12 h-72 rounded-2xl border border-gold/30 sm:h-96"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/90 via-transparent to-transparent" />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full border border-gold/40 bg-night/70 px-5 py-2.5 text-xs text-ivory backdrop-blur hover:border-gold"
            >
              <MapPin size={14} className="text-gold" /> {site.name} · {site.address.lines[1]}
            </a>
          </GLPhoto>
        </div>

        <div data-sr="left" className="lg:sticky lg:top-28 lg:self-start">
          <BookingPanel key={show.id} show={show} />
        </div>
      </div>
    </section>
  )
}
