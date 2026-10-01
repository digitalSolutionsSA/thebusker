import { site } from '../../../config/site'

// lucide dropped brand icons, so these are small inline marks.
const icons: Record<(typeof site.socials)[number]['label'], string> = {
  Facebook: 'M14 8.5V6.8c0-.8.5-1 1-1h1.8V3h-2.6C11.6 3 11 4.9 11 6.3v2.2H9v3h2V21h3v-9.5h2.4l.4-3H14z',
  Instagram:
    'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.1 4.2-.1z',
  TikTok: 'M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3a7 7 0 0 1-3.8-1.2v6.1A5.7 5.7 0 1 1 10.8 9v3.1a2.7 2.7 0 1 0 2 2.6V3h3.7z',
  YouTube:
    'M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z',
}

/** Renders nothing until profile URLs are added to `site.socials`. */
export default function SocialLinks({ className = '' }: { className?: string }) {
  if (site.socials.length === 0) return null
  return (
    <ul className={`flex gap-3 ${className}`}>
      {site.socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-ivory/70 transition-colors hover:border-ember-light hover:text-ivory"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
              <path d={icons[s.label]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
