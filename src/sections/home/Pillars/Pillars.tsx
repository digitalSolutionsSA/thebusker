import { Link } from 'react-router-dom'
import { ArrowUpRight, Mic2, PartyPopper, Tv, UtensilsCrossed } from 'lucide-react'
import { images } from '../../../data/images'
import GLPhoto from '../../../components/three/GLPhoto'

const PILLARS = [
  {
    no: '01',
    title: 'Live Music',
    text: 'From intimate acoustic sets to full-band nights on the main stage.',
    icon: Mic2,
    image: images.hero.bandStage,
    to: '/shows',
    focus: [0.5, 0.5] as [number, number],
  },
  {
    no: '02',
    title: 'Food & Drinks',
    text: 'Sharing platters, a fully stocked bar and ice-cold taps.',
    icon: UtensilsCrossed,
    image: images.venue.charcuterie,
    to: '/about',
    focus: [0.5, 0.5] as [number, number],
  },
  {
    no: '03',
    title: 'Private Events',
    text: 'Birthdays, functions and celebrations in a room with a stage.',
    icon: PartyPopper,
    image: images.venue.brickLounge,
    to: '/contact',
    focus: [0.45, 0.5] as [number, number],
  },
  {
    no: '04',
    title: 'Bok Town',
    text: 'Every Springbok match on the big screen, with the loudest crowd in V-Town.',
    icon: Tv,
    image: images.venue.bigScreen,
    to: '/bok-town',
    focus: [0.55, 0.5] as [number, number],
  },
]

/** Four full-height WebGL photo pillars; the hovered one widens (desktop). */
export default function Pillars() {
  return (
    <section aria-label="What we offer" className="flex flex-col border-y border-gold/20 lg:h-[78vh] lg:min-h-[34rem] lg:flex-row">
      {PILLARS.map(({ no, title, text, icon: Icon, image, to, focus }, i) => (
        <Link
          key={no}
          to={to}
          data-sr="fade"
          data-sr-delay={i * 150}
          className="group relative h-[62vh] min-h-[22rem] border-gold/15 transition-[flex-grow] duration-[900ms] ease-[var(--ease-luxe)] lg:h-auto lg:flex-1 lg:border-l lg:first:border-l-0 lg:hover:flex-[1.9]"
        >
          <GLPhoto src={image} alt={title} focus={focus} cursor="Explore" className="absolute inset-0">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/10" />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-7 sm:p-9">
              <div className="flex items-start justify-between">
                <Icon size={30} strokeWidth={1.1} className="text-gold transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="font-display text-sm tracking-[0.3em] text-ivory/60">{no}</span>
              </div>
              <div>
                <span className="mb-5 block h-px w-8 bg-gold transition-[width] duration-700 ease-[var(--ease-luxe)] group-hover:w-20" />
                <h3 className="type-heavy text-gold-leaf text-3xl sm:text-4xl">{title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/75 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-700 lg:group-hover:max-h-24 lg:group-hover:opacity-100">
                  {text}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold">
                  Discover <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>
            </div>
          </GLPhoto>
        </Link>
      ))}
    </section>
  )
}
