import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { mapsUrl, navLinks, site } from '../../../config/site'
import Logo from '../../ui/Logo'
import SocialLinks from '../../ui/SocialLinks'

export default function Footer() {
  const [email, setEmail] = useState('')

  // No mailing-list service yet: hand the sign-up to the venue's inbox.
  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent('Mailing list sign-up')}&body=${encodeURIComponent(
      `Please add ${email} to The Busker mailing list.`,
    )}`
  }

  return (
    <footer className="relative overflow-hidden border-t border-gold/30 bg-night-2">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-slats opacity-30" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(201 162 74 / 0.35), transparent)' }}
      />

      {/* Follow / mailing list */}
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pt-20 pb-14 sm:px-8 md:grid-cols-2">
        <div>
          <h3 className="font-display text-xl uppercase text-gold-leaf">Follow us</h3>
          <p className="mt-3 max-w-sm text-sm text-mist">Stay up to date with upcoming shows, special events and everything happening at The Busker.</p>
          <SocialLinks className="mt-6" />
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-ivory/75 hover:text-ivory">
                <Phone size={15} className="text-gold" /> {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all text-ivory/75 hover:text-ivory">
                <Mail size={15} className="shrink-0 text-gold" /> {site.email}
              </a>
            </li>
            <li>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-ivory/75 hover:text-ivory">
                <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  {site.address.lines.slice(0, 2).join(', ')}
                  <span className="ml-2 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-gold">
                    Directions <ArrowUpRight size={11} />
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-xl uppercase text-gold-leaf">Join our mailing list</h3>
          <p className="mt-3 max-w-sm text-sm text-mist">Get the latest show announcements and exclusive specials.</p>
          <form onSubmit={subscribe} className="mt-6 flex max-w-md overflow-hidden rounded-full border border-gold/40 bg-night/60 focus-within:border-gold">
            <label htmlFor="footer-email" className="sr-only">
              Your email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-ivory placeholder:text-mist/70 outline-none"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="grid w-14 place-items-center bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night transition-[filter] hover:brightness-110"
            >
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Logo + nav */}
      <div className="relative mx-auto max-w-7xl px-5 pb-12 text-center sm:px-8">
        <span className="gold-rule mb-12" />
        <div>
          <Logo className="mx-auto w-52" />
        </div>
        <nav className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Footer">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-ivory/70 transition-colors hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-[0.62rem] uppercase tracking-[0.5em] text-mist">
          Music · Good company · Unforgettable nights
        </p>
        <p className="mt-8 text-xs text-ivory/40">
          © {new Date().getFullYear()} {site.name} {site.tagline}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
