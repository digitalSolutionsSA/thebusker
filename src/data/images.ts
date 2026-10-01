import type { Show } from '../types'

// Stock photography (Unsplash licence) used for look and feel — see public/images/SOURCES.md.
// Swap these paths for photos of The Busker as soon as you have them.
export const images = {
  hero: {
    // Real photo of The Busker's bar (supplied by the venue)
    buskerBar: '/images/hero/busker-bar.webp',
    blueStage: '/images/hero/blue-stage.webp',
    blueBeams: '/images/hero/blue-beams.webp',
    blueBand: '/images/hero/blue-band.webp',
    warmCrowd: '/images/hero/warm-crowd.webp',
    bandSmoke: '/images/hero/band-smoke.webp',
    bandStage: '/images/hero/band-stage.webp',
    stageRed: '/images/hero/stage-red.webp',
    handsUp: '/images/hero/hands-up.webp',
    barStools: '/images/hero/bar-stools.webp',
    diningRoom: '/images/hero/dining-room.webp',
    stadium: '/images/hero/stadium.webp',
  },
  venue: {
    hatDark: '/images/venue/hat-dark.webp',
    guitarWall: '/images/venue/guitar-wall.webp',
    brickLounge: '/images/venue/brick-lounge.webp',
    beerFlight: '/images/venue/beer-flight.webp',
    barSilhouettes: '/images/venue/bar-silhouettes.webp',
    barCrowd: '/images/venue/bar-crowd.webp',
    barNight: '/images/venue/bar-night.webp',
    platter: '/images/venue/platter.webp',
    charcuterie: '/images/venue/charcuterie-warm.webp',
    beerTaps: '/images/venue/beer-taps.webp',
    friendsToast: '/images/venue/friends-toast.webp',
    toastDark: '/images/venue/toast-dark.webp',
    liveBand: '/images/venue/live-band.webp',
    bandCrowd: '/images/venue/band-crowd.webp',
    bigScreen: '/images/venue/big-screen.webp',
  },
  shows: {
    guitarHands: '/images/shows/guitar-hands.webp',
    emptyStage: '/images/shows/empty-stage.webp',
    micPurple: '/images/shows/mic-purple.webp',
    hatSilhouette: '/images/shows/hat-silhouette.webp',
    spotlightGuitarist: '/images/shows/spotlight-guitarist.webp',
    darkStage: '/images/shows/dark-stage.webp',
    rugbyBall: '/images/shows/rugby-ball.webp',
  },
}

// Performer shots deliberately avoid recognisable faces, so a card never implies
// a stranger is the artist who's actually playing.
const posterPool: Record<Show['category'], string[]> = {
  'live-music': [
    images.shows.guitarHands,
    images.shows.hatSilhouette,
    images.shows.micPurple,
    images.shows.spotlightGuitarist,
    images.shows.darkStage,
    images.shows.emptyStage,
  ],
  'bok-town': [images.shows.rugbyBall, images.venue.bigScreen],
  special: [images.hero.handsUp, images.hero.warmCrowd],
}

const hash = (value: string) => [...value].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** A consistent stock image for shows that don't have their own `image_url` yet. */
export function stockPoster(show: Pick<Show, 'slug' | 'category'>) {
  const pool = posterPool[show.category]
  return pool[hash(show.slug) % pool.length]
}
