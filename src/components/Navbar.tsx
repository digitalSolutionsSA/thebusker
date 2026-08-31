import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/shows', label: 'Shows' },
  { to: '/bok-town', label: 'Bok Town' },
  { to: '/#venue', label: 'Venue' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-ink/90 backdrop-blur border-b border-brass/20 py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-headline brass-text tracking-wider">THE BUSKER</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] text-cream/50 border-l border-brass/30 pl-2">
            Music Hall &amp; Venue
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm uppercase tracking-widest transition-colors hover:text-brass-light ${
                  isActive ? 'text-brass-light' : 'text-cream/80'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/shows"
            className="brass-gradient text-ink text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Book Tickets
          </Link>
        </nav>

        <button
          className="md:hidden text-cream"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ink border-t border-brass/20 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="text-cream/90 uppercase tracking-widest text-sm"
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/shows"
            onClick={() => setOpen(false)}
            className="brass-gradient text-ink text-center text-sm font-semibold uppercase tracking-wider px-5 py-2 rounded-full"
          >
            Book Tickets
          </Link>
        </div>
      )}
    </header>
  )
}
