import type { Show } from '../types'

// The Busker's upcoming shows (from the posters in public/SHOWS).
// Used until Supabase is connected — once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set,
// the rows in the "shows" table take over. Past shows drop off the site automatically.
//
// TODO: capacity isn't on the posters — set each show's real ticket limit here.
const CAPACITY_TBC = 200

export const demoShows: Show[] = [
  {
    id: 'club-night-2026-10-02',
    slug: 'club-night',
    title: 'Club Night',
    artist: 'CMRN · Eduano · Kay · Primo',
    description: 'A night on the decks with CMRN, Eduano, Kay and Primo. Starts at 19:00 — R50 entrance.',
    date: '2026-10-02',
    doors_time: '19:00',
    image_url: '/images/posters/club-night.webp',
    price_cents: 5000,
    currency: 'ZAR',
    capacity: CAPACITY_TBC,
    tickets_sold: 0,
    category: 'special',
    stripe_price_id: null,
  },
  {
    id: 'celine-dion-by-mirandi-2026-10-30',
    slug: 'celine-dion-by-mirandi',
    title: 'Céline Dion by Mirandi',
    artist: 'Mirandi',
    description:
      'Artistique Productions presents an unforgettable evening of timeless Céline Dion hits, performed by Mirandi. Doors at 19:00, show at 19:30. Tickets are also available at Local Choice Euro Pharmacy or on WhatsApp: 083 716 5495.',
    date: '2026-10-30',
    doors_time: '19:00',
    image_url: '/images/posters/celine-dion-by-mirandi.webp',
    price_cents: 15000,
    currency: 'ZAR',
    capacity: CAPACITY_TBC,
    tickets_sold: 0,
    category: 'live-music',
    stripe_price_id: null,
  },
  {
    id: 'dirk-van-der-westhuizen-2026-10-03',
    slug: 'dirk-van-der-westhuizen',
    title: 'Dirk van der Westhuizen',
    artist: 'Dirk van der Westhuizen',
    description:
      'The Busker and CinPic Entertainment present Dirk van der Westhuizen live. Starts at 20:00. Enquiries: 082 852 6335.',
    date: '2026-10-03',
    doors_time: '20:00',
    // ?v=2 makes browsers fetch the corrected poster instead of a cached old one
    image_url: '/images/posters/dirk-van-der-westhuizen.webp?v=2',
    price_cents: 16000,
    currency: 'ZAR',
    capacity: CAPACITY_TBC,
    tickets_sold: 0,
    category: 'live-music',
    stripe_price_id: null,
  },
  {
    id: 'gerhard-steyn-liezel-pieters-2026-10-31',
    slug: 'gerhard-steyn-liezel-pieters',
    title: 'Gerhard Steyn & Liezel Pieters',
    artist: 'Gerhard Steyn & Liezel Pieters',
    description: 'Gerhard Steyn and Liezel Pieters live at The Busker. Starts at 20:00.',
    date: '2026-10-31',
    doors_time: '20:00',
    image_url: '/images/posters/gerhard-steyn-liezel-pieters.webp',
    price_cents: 25000,
    currency: 'ZAR',
    capacity: CAPACITY_TBC,
    tickets_sold: 0,
    category: 'live-music',
    stripe_price_id: null,
  },
]
