// Central place for venue details. Update these and every page picks them up.

export const site = {
  name: 'The Busker',
  tagline: 'Music Hall & Venue',
  logo: {
    light: '/brand/logo-white.webp', // for dark backgrounds
    dark: '/brand/logo-dark.webp', // for light backgrounds
  },
  address: {
    lines: ['1 Club Street, Peacehaven', 'Vereeniging (Old Barnyard)', 'South Africa'],
    mapsQuery: '1 Club Street, Peacehaven, Vereeniging, South Africa',
  },
  phone: '074 000 0082',
  email: 'info@thebusker.co.za',
  hours: 'Varies per event — see the show listings',
  // Add profile URLs to show social icons in the footer and contact page.
  socials: [] as { label: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube'; href: string }[],
}

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shows', label: 'Shows' },
  { to: '/bok-town', label: 'Bok Town' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
] as const

/**
 * Address of the staff portal. Deliberately not linked anywhere on the public site and kept out of
 * search engines; change it here to move the portal (also update Supabase's password-reset redirect URL).
 */
export const ADMIN_BASE = '/dssa-portals'

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.mapsQuery)}`
export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(site.address.mapsQuery)}&output=embed`
