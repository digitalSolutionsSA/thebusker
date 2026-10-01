import { ArrowRight, GlassWater, Music, Sparkles, Users } from 'lucide-react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import Button from '../../../components/ui/Button'
import GLPhoto from '../../../components/three/GLPhoto'
import { images } from '../../../data/images'

const features = [
  { icon: Music, title: 'Live Music', sub: 'Top artists' },
  { icon: GlassWater, title: 'Fully Stocked Bar', sub: 'Cold drinks' },
  { icon: Users, title: 'Private Events', sub: 'Good food & functions' },
  { icon: Sparkles, title: 'Epic Atmosphere', sub: 'Good company' },
]

/** "More Than Just a Venue" — script heading, story copy and a wiped-in photo collage. */
export default function VenueStory() {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} id="venue" className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-wood opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night via-night/30 to-night" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="font-script text-gold-leaf text-[clamp(3.4rem,7vw,6rem)] leading-[1.05] -rotate-3 origin-left">
            <span className="mask-line pb-3">
              <span>More Than</span>
            </span>
            <span className="mask-line pl-10 pb-3">
              <span>Just a Venue</span>
            </span>
          </h2>
          <span data-rule className="gold-rule mt-6 max-w-sm" />
          <p data-sr="up" className="mt-8 max-w-lg font-serif text-xl leading-relaxed text-ivory/85 sm:text-2xl">
            The Busker Music Hall &amp; Venue is where live music, great company and unforgettable experiences come together. From top
            local artists to epic sport screenings — this is your place to be.
          </p>
          <div data-sr="up" data-sr-delay="150" className="mt-10">
            <Button to="/about" variant="outline">
              Our story <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        <div className="relative h-[26rem] sm:h-[32rem]">
          <GLPhoto src={images.venue.guitarWall} alt="Guitars on the wall of a warm, wood-panelled music room" cursor="Ripple" className="absolute inset-y-0 right-0 w-[78%] rounded-2xl border border-gold/30 shadow-2xl" />
          <div data-parallax="14" className="absolute bottom-[-1.5rem] left-0 h-[58%] w-[52%]">
            <GLPhoto src={images.venue.hatDark} alt="A musician's fedora in low stage light" className="h-full w-full rounded-2xl border-4 border-night shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-gold/40" />
          </div>
        </div>
      </div>

      <div data-stagger className="relative mx-auto mt-24 grid max-w-6xl grid-cols-2 gap-y-10 border-y border-gold/20 px-5 py-10 sm:px-8 md:grid-cols-4">
        {features.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="group flex flex-col items-center text-center">
            <Icon size={34} strokeWidth={1.1} className="text-gold transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
            <h3 className="mt-4 font-display text-sm tracking-[0.18em] uppercase text-ivory">{title}</h3>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-mist">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
