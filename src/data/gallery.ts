import { images } from './images'

export type GalleryTag = 'venue' | 'bok-town' | 'shows'

export interface GalleryImage {
  id: string
  src: string
  alt: string
  tags: GalleryTag[]
  /** true = stock photo standing in until real photos of The Busker are added */
  placeholder?: boolean
}

// Drop image files into public/gallery and add an entry here, e.g.
//   { id: 'stage-1', src: '/gallery/stage-1.jpg', alt: 'Crowd at a Friday show', tags: ['shows'] },
// Tag each image with where it should appear: 'venue' shows everywhere, 'bok-town' on the
// Bok Town page, 'shows' on the Shows page. The Gallery page shows every image.
//
// TODO before launch: these are Unsplash stock photos, not The Busker. Replace them with
// real photos of the venue so the gallery shows your own nights.
export const galleryImages: GalleryImage[] = [
  { id: 'crowd', src: images.hero.warmCrowd, alt: 'Crowd in front of a lit stage', tags: ['shows'], placeholder: true },
  { id: 'band', src: images.venue.liveBand, alt: 'Band playing on stage', tags: ['shows'], placeholder: true },
  { id: 'bar', src: images.venue.barSilhouettes, alt: 'Guests at the bar', tags: ['venue'], placeholder: true },
  { id: 'hands', src: images.hero.handsUp, alt: 'Hands in the air at a show', tags: ['shows'], placeholder: true },
  { id: 'toast', src: images.venue.friendsToast, alt: 'Friends toasting with drinks', tags: ['venue'], placeholder: true },
  { id: 'guitar', src: images.shows.guitarHands, alt: 'Acoustic guitar being played', tags: ['shows'], placeholder: true },
  { id: 'platter', src: images.venue.platter, alt: 'Sharing platter', tags: ['venue'], placeholder: true },
  { id: 'stadium', src: images.hero.stadium, alt: 'Rugby stadium', tags: ['bok-town'], placeholder: true },
  { id: 'screen', src: images.venue.bigScreen, alt: 'Fans watching the match on a big screen', tags: ['bok-town'], placeholder: true },
  { id: 'taps', src: images.venue.beerTaps, alt: 'Beer taps at the bar', tags: ['venue', 'bok-town'], placeholder: true },
  { id: 'ball', src: images.shows.rugbyBall, alt: 'Rugby ball on the grass', tags: ['bok-town'], placeholder: true },
  { id: 'stage', src: images.hero.stageRed, alt: 'Stage lights over the crowd', tags: ['shows'], placeholder: true },
]
