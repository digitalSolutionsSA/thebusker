import { ArrowRight } from 'lucide-react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import Button from '../../../components/ui/Button'
import Photo from '../../../components/ui/Photo'
import GLPhoto from '../../../components/three/GLPhoto'
import { images } from '../../../data/images'

/** "Watch it together at The Busker" — brush-script call-out beside a cold beer that wipes in. */
export default function WatchTogether() {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div data-parallax="10" className="absolute -inset-y-[12%] inset-x-0">
          <Photo src={images.venue.bigScreen} alt="" className="absolute inset-0" />
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/85 to-night/40" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:py-32">
        <div>
          <h2 className="font-brush text-gold-leaf text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] -rotate-3 origin-left">
            <span className="mask-line pb-2">
              <span>Watch it</span>
            </span>
            <span className="mask-line pb-2">
              <span>together</span>
            </span>
            <span className="mask-line pb-2">
              <span className="text-[0.6em]">at The Busker</span>
            </span>
          </h2>
          <span data-rule className="gold-rule mt-6 max-w-xs" />
          <p data-sr="up" className="mt-6 max-w-md font-serif text-xl leading-relaxed text-ivory/85">
            Massive screens. Ice-cold drinks. True South African spirit.
          </p>
          <div data-sr="up" data-sr-delay="150" className="mt-8 flex flex-wrap gap-4">
            <Button href="#fixtures" magnetic>
              Book a table <ArrowRight size={14} />
            </Button>
            <Button to="/contact" variant="outline">
              Enquire
            </Button>
          </div>
        </div>

        <div data-parallax="10" className="mx-auto w-full max-w-sm">
          <GLPhoto
            src={images.venue.beerFlight}
            alt="Glasses of cold beer on a wooden board"
            cursor="Cheers"
            className="aspect-[4/5] w-full rounded-2xl border border-gold/35 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.95)]"
          />
        </div>
      </div>
    </section>
  )
}
