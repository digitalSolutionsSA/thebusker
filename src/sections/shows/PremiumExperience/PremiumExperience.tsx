import { GlassWater, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import GLPhoto from '../../../components/three/GLPhoto'
import Logo from '../../../components/ui/Logo'
import { images } from '../../../data/images'

const perks = [
  { icon: Sparkles, title: 'Beautiful Venue', sub: 'Top sound & lights' },
  { icon: GlassWater, title: 'Great Drinks', sub: '& food specials' },
  { icon: Users, title: 'Unforgettable', sub: 'Atmosphere' },
  { icon: ShieldCheck, title: 'Safe & Secure', sub: 'Online tickets' },
]

/** "Premium Experience" band: four gold icons over a wiped-in venue photo with the logo on top. */
export default function PremiumExperience() {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
      <h2 className="font-display uppercase text-gold-leaf text-[clamp(1.8rem,4vw,3.2rem)]">
        <span className="mask-line">
          <span className="text-[0.55em] tracking-[0.2em]">Premium</span>
        </span>
        <span className="mask-line">
          <span>Experience</span>
        </span>
      </h2>
      <span data-rule className="gold-rule mx-auto mt-6 max-w-[10rem]" />

      <div data-stagger className="mt-14 grid grid-cols-2 gap-y-10 md:grid-cols-4">
        {perks.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex flex-col items-center">
            <Icon size={34} strokeWidth={1.1} className="text-gold" />
            <h3 className="mt-4 font-display text-xs uppercase tracking-[0.2em]">{title}</h3>
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.25em] text-mist">{sub}</p>
          </div>
        ))}
      </div>

      <GLPhoto
        src={images.venue.brickLounge}
        alt="Warm, intimate lounge with candlelit tables"
        cursor="Ripple"
        className="mt-16 h-72 rounded-2xl border border-gold/30 sm:h-[28rem]"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/20 to-night/10" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div data-sr="zoom" className="rounded-full border border-gold/40 bg-night/70 p-6 backdrop-blur-md">
            <Logo className="w-36 sm:w-44" />
          </div>
        </div>
      </GLPhoto>
    </section>
  )
}
