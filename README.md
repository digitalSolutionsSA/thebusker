# The Busker — Music Hall & Venue

Vite + React + TypeScript + Tailwind v4 website with a Bok Town (Springboks) section and a full
reserved-seating ticket booking flow via Yoco Checkout + Supabase.

- **Three.js** (react-three-fiber + drei) — stage lights & mirror ball (home), rugby ball & confetti
  (Bok Town), ambient beams (inner pages). Scenes are lazy-loaded and pause when off screen.
- **GSAP** (ScrollTrigger, SplitText, `@gsap/react`) — preloader, split-text headings, hero
  parallax, marquee, magnetic buttons, card tilt, mobile menu, page transitions.
- **ScrollReveal** — section/card reveals via `useReveal` / `useRevealChildren` in `src/hooks/useReveal.ts`.

## Photos

`public/images/` holds Unsplash stock photos (free under the Unsplash License) used for look and
feel — sources are listed in `public/images/SOURCES.md`, and every path is set in
`src/data/images.ts`. Gallery entries in `src/data/gallery.ts` are marked `placeholder: true`.
**Replace these with real photos of The Busker before launch.** A show's own `image_url` always
takes priority over the stock poster.

## Project structure

Every component lives in its own folder (`Name/Name.tsx` + `index.ts`).

```
src/
  config/site.ts        venue details, nav links (edit phone/email/socials here)
  components/
    layout/             Navbar, MobileMenu, Footer, Preloader, PageTransition, ScrollManager, CursorGlow, SiteLayout
    ui/                 Button, Logo, SectionHeading, SplitHeading, Marquee, CountdownTimer, FormField, TeamBadge, SocialLinks
    shows/              ShowCard, ShowPoster, FixtureCard, TicketSelector, OrderSummary, BookingPanel
    three/              StageScene, RugbyScene, AmbientScene, CameraRig
    gallery/            Lightbox
    decor/              CrowdSilhouette
  sections/             page sections grouped by page (home, shows, bokTown, about, contact, shared)
  pages/                one folder per route
  hooks/ lib/ data/ types/ styles/
public/brand/           trimmed logos + favicon (originals stay in public/)
```

## Local development

```bash
npm install
npm run dev
```

The site works out of the box with demo show data (`src/data/shows.ts`) even without Supabase
configured — booking will show a "not configured yet" message until you connect the backend below.

## Connecting the real booking backend (Supabase + Yoco, reserved seating)

Customers pick seats on the hall plan (`src/data/venueLayout.ts`, drawn from "stage bookings.pdf"):
tables are booked whole, wall/box/balcony seats one by one. Every show uses the same plan and price
per seat. "Secure seats" holds the seats for 15 minutes and sends the customer to Yoco; the Yoco
webhook then marks them sold. A seat can never be sold twice — `seat_reservations` has one row per
(show, seat), and late payments for seats someone else got in the meantime are refunded automatically.

1. Create a Supabase project and run every file in `supabase/migrations/` in order
   (SQL editor or `supabase db push`).
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   (Supabase project settings). Set the same two variables in Netlify.
3. Deploy the edge functions:
   ```bash
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy yoco-webhook --no-verify-jwt
   ```
4. Register the webhook with Yoco once, using your Yoco secret key. Save the `secret` in the
   response — it is only shown once:
   ```bash
   curl -X POST https://payments.yoco.com/api/webhooks -H "Authorization: Bearer sk_..." -H "Content-Type: application/json" -d '{"name":"busker-bookings","url":"https://<project-ref>.supabase.co/functions/v1/yoco-webhook"}'
   ```
5. Set the edge function secrets:
   ```bash
   supabase secrets set YOCO_SECRET_KEY=sk_... YOCO_WEBHOOK_SECRET=whsec_... SITE_URL=https://yourdomain.com
   ```
   Use the `sk_test_...` key first to try bookings without real money.

Changing the seating plan: edit `src/data/venueLayout.ts`, then run
`npm run seats:sql > supabase/migrations/<next number>_venue_seats.sql` and apply it.

The old Stripe functions (`create-checkout-session`, `stripe-webhook`) are no longer used.

## Managing shows

Add/edit rows directly in the `shows` table (Supabase table editor or SQL) — no code changes
needed. Fields: `title`, `artist`, `description`, `date`, `doors_time`, `price_cents`, `currency`,
`capacity`, `category` (`live-music` | `bok-town` | `special`), `image_url`.
