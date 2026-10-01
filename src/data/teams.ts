// Colours used to draw team badges on Bok Town fixtures.
export interface Team {
  name: string
  code: string
  colors: [string, string]
}

const teams: Record<string, Team> = {
  'south africa': { name: 'South Africa', code: 'RSA', colors: ['#0b6b3a', '#ffc72c'] },
  springboks: { name: 'South Africa', code: 'RSA', colors: ['#0b6b3a', '#ffc72c'] },
  'new zealand': { name: 'New Zealand', code: 'NZL', colors: ['#0a0a0a', '#ffffff'] },
  'all blacks': { name: 'New Zealand', code: 'NZL', colors: ['#0a0a0a', '#ffffff'] },
  australia: { name: 'Australia', code: 'AUS', colors: ['#f2b705', '#0b5d3b'] },
  wallabies: { name: 'Australia', code: 'AUS', colors: ['#f2b705', '#0b5d3b'] },
  england: { name: 'England', code: 'ENG', colors: ['#ffffff', '#c8102e'] },
  wales: { name: 'Wales', code: 'WAL', colors: ['#c8102e', '#ffffff'] },
  ireland: { name: 'Ireland', code: 'IRE', colors: ['#169b62', '#ffffff'] },
  scotland: { name: 'Scotland', code: 'SCO', colors: ['#0b2a5b', '#ffffff'] },
  france: { name: 'France', code: 'FRA', colors: ['#002395', '#ed2939'] },
  argentina: { name: 'Argentina', code: 'ARG', colors: ['#75aadb', '#ffffff'] },
  pumas: { name: 'Argentina', code: 'ARG', colors: ['#75aadb', '#ffffff'] },
  italy: { name: 'Italy', code: 'ITA', colors: ['#0066cc', '#ffffff'] },
  fiji: { name: 'Fiji', code: 'FIJ', colors: ['#ffffff', '#62b5e5'] },
  japan: { name: 'Japan', code: 'JPN', colors: ['#ffffff', '#bc002d'] },
}

const fallback = (name: string): Team => ({
  name,
  code: name.slice(0, 3).toUpperCase(),
  colors: ['#2a1f15', '#f5ecdc'],
})

const lookup = (raw: string) => {
  const key = raw.trim().toLowerCase()
  return teams[key] ?? fallback(raw.trim())
}

/** Pulls "Springboks vs Wales" style match-ups out of a show title. */
export function parseFixture(title: string): { home: Team; away: Team } | null {
  const clean = title.split(/[—–:-]\s/)[0]
  const match = clean.match(/(.+?)\s+vs\.?\s+(.+)/i)
  if (!match) return null
  return { home: lookup(match[1]), away: lookup(match[2]) }
}
