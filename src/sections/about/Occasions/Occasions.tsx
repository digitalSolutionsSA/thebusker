import { useRef } from 'react'
import { Heart, PartyPopper, Users } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { images } from '../../../data/images'
import SectionHeading from '../../../components/ui/SectionHeading'
import GLPhoto from '../../../components/three/GLPhoto'

const occasions = [
  { icon: Heart, image: images.venue.toastDark, title: 'Date night', body: 'Dinner, drinks and a live set — an easy yes for a night out together.' },
  { icon: Users, image: images.venue.platter, title: 'Family outing', body: 'Good food and good music for the whole family to enjoy.' },
  { icon: PartyPopper, image: images.venue.friendsToast, title: 'Celebrations', body: 'Birthdays, catch-ups and big wins — celebrate with friends.' },
]

/** Three tall WebGL photo cards; the columns scroll at different speeds (desktop). */
export default function Occasions() {
  const grid = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px)', () => {
        const speeds = [8, -10, 14]
        gsap.utils.toArray<HTMLElement>('[data-occasion]').forEach((card, i) => {
          gsap.fromTo(card, { yPercent: speeds[i] }, {
            yPercent: -speeds[i],
            ease: 'none',
            scrollTrigger: { trigger: grid.current, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        })
      })
      return () => mm.revert()
    },
    { scope: grid },
  )

  return (
    <section className="relative overflow-hidden bg-night-2 py-28 sm:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-wood opacity-35" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading align="center" eyebrow="The perfect spot for" title="Every kind of occasion" />
        <div ref={grid} className="grid gap-6 md:grid-cols-3 md:py-12">
          {occasions.map(({ icon: Icon, image, title, body }, i) => (
            <div key={title} data-occasion data-sr="up" data-sr-delay={i * 150}>
              <GLPhoto src={image} alt={title} cursor="Ripple" className="group h-[30rem] rounded-3xl border border-gold/20">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-night/50 text-gold backdrop-blur">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <h3 className="type-heavy text-gold-leaf text-2xl">{title}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/75">{body}</p>
                </div>
              </GLPhoto>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
