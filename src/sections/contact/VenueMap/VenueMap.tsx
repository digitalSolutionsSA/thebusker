import { ArrowUpRight, MapPin } from 'lucide-react'
import { mapsEmbedUrl, mapsUrl, site } from '../../../config/site'
import { useReveal } from '../../../hooks/useReveal'

export default function VenueMap() {
  const ref = useReveal({ distance: '40px', scale: 0.97 })

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
      <div ref={ref} className="relative h-[26rem] overflow-hidden rounded-[2rem] border border-white/10">
        {/* Dark-mode styling for the standard Google embed */}
        <iframe
          title={`Map to ${site.name}`}
          src={mapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0 [filter:invert(92%)_hue-rotate(200deg)_saturate(0.6)_brightness(0.85)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night/85 via-night/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 max-w-sm rounded-2xl border border-white/10 bg-night/80 p-6 backdrop-blur-xl sm:bottom-10 sm:left-10">
          <p className="eyebrow text-gold">Find us here</p>
          <p className="mt-3 flex items-start gap-3 font-display text-xl uppercase leading-tight">
            <MapPin size={20} className="mt-0.5 shrink-0 text-ember-light" />
            {site.name} {site.tagline}
          </p>
          <p className="mt-2 pl-8 text-sm text-mist">{site.address.lines.slice(0, 2).join(', ')}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 ml-8 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-ember-light hover:text-ivory"
          >
            Get directions <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
