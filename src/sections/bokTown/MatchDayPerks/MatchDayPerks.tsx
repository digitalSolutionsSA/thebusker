import { Music2, Tv, UtensilsCrossed } from 'lucide-react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import { images } from '../../../data/images'
import SectionHeading from '../../../components/ui/SectionHeading'
import GLPhoto from '../../../components/three/GLPhoto'

const perks = [
  {
    icon: Tv,
    image: images.venue.bigScreen,
    title: 'HD Big Screen & Sound',
    body: 'Every scrum, every try, in full clarity on our huge venue screen.',
  },
  {
    icon: UtensilsCrossed,
    image: images.venue.charcuterie,
    title: 'Match-Day Platters',
    body: 'Your ticket includes a platter, Castle Double Malt & a Springbokkie.',
  },
  {
    icon: Music2,
    image: images.venue.barCrowd,
    title: 'Green & Gold Atmosphere',
    body: 'Sing the anthem with a room full of fellow supporters.',
  },
]

export default function MatchDayPerks() {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <SectionHeading
        eyebrow="Match day at The Busker"
        title="Everything but the kick-off"
        subtitle="Book a table, bring the crew and leave the rest to us."
      />
      <div data-stagger className="grid gap-5 md:grid-cols-3">
        {perks.map(({ icon: Icon, image, title, body }, i) => (
          <div key={title}>
            <div className="group relative h-full overflow-hidden glass rounded-2xl transition-colors duration-500 hover:border-gold/70">
              <GLPhoto src={image} alt={title} cursor="Ripple" className="h-64">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent" />
                <span className="pointer-events-none absolute right-4 top-2 font-brush text-6xl leading-none text-white/25">0{i + 1}</span>
              </GLPhoto>
              <div className="relative -mt-7 p-7 pt-0">
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon size={24} />
                </div>
                <h3 className="font-display text-xl uppercase text-ivory">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
