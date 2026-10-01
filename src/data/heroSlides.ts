import { images } from './images'

export type LineWeight = 'thin' | 'heavy'

export interface HeroSlide {
  image: string
  /** 0 = keep the left of the photo in frame, 1 = keep the right */
  focusX: number
  /** brightness multiplier for bright photos */
  dim?: number
  lines: { text: string; weight: LineWeight }[]
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: images.hero.buskerBar,
    focusX: 0.55,
    dim: 0.72,
    lines: [
      { text: 'Live music.', weight: 'thin' },
      { text: 'Great people.', weight: 'heavy' },
      { text: 'Unforgettable nights.', weight: 'heavy' },
    ],
  },
  {
    image: images.hero.blueBand,
    focusX: 0.5,
    lines: [
      { text: 'Where the', weight: 'thin' },
      { text: 'Music', weight: 'heavy' },
      { text: 'Lives.', weight: 'heavy' },
    ],
  },
  {
    image: images.venue.guitarWall,
    focusX: 0.62,
    dim: 0.9,
    lines: [
      { text: 'More than', weight: 'thin' },
      { text: 'Just a', weight: 'heavy' },
      { text: 'Venue.', weight: 'heavy' },
    ],
  },
]
