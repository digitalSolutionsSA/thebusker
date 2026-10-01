import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { mapsUrl, site } from '../../../config/site'
import { useRevealChildren } from '../../../hooks/useReveal'
import SocialLinks from '../../../components/ui/SocialLinks'

export default function ContactDetails() {
  const listRef = useRevealChildren<HTMLUListElement>({ origin: 'left', distance: '30px' }, 110)

  const items = [
    { icon: MapPin, label: 'Our location', value: site.address.lines.join(', '), href: mapsUrl, external: true },
    { icon: Phone, label: 'Phone', value: site.phone, href: `tel:${site.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { icon: Clock, label: 'Trading hours', value: site.hours },
  ]

  return (
    <div>
      <ul ref={listRef} className="space-y-3">
        {items.map(({ icon: Icon, label, value, href, external }) => {
          const body = (
            <>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-ember-light/30 text-ember-light transition-colors group-hover:bg-ember group-hover:text-night">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="eyebrow block text-[0.6rem] text-gold">{label}</span>
                <span className="mt-1 block break-words text-sm text-ivory/85">{value}</span>
              </span>
            </>
          )
          const cls = 'group flex items-center gap-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-ember-light/40'
          return (
            <li key={label}>
              {href ? (
                <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {body}
                </a>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          )
        })}
      </ul>
      <SocialLinks className="mt-8" />
    </div>
  )
}
