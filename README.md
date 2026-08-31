# The Busker — Music Hall & Venue

Vite + React + TypeScript + Tailwind v4 + Three.js (react-three-fiber) website with a Bok Town
(Springboks) section and a full ticket booking flow via Stripe Checkout + Supabase.

## Local development

```bash
npm install
npm run dev
```

The site works out of the box with demo show data (`src/data/shows.ts`) even without Supabase
configured — booking will show a "not configured yet" message until you connect the backend below.

## Connecting the real booking backend (Supabase + Stripe)

1. Create a Supabase project, then run the SQL in `supabase/migrations/0001_init.sql` (SQL editor
   or `supabase db push`) to create the `shows` and `bookings` tables and seed demo shows.
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from Supabase project settings.
   - `VITE_STRIPE_PUBLISHABLE_KEY` — from your Stripe dashboard.
3. Deploy the two edge functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. Set edge function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://yourdomain.com
   ```
5. In the Stripe Dashboard, add a webhook endpoint pointing at the deployed `stripe-webhook`
   function URL, listening for `checkout.session.completed`.

Once configured, `/shows` pulls live events from the `shows` table and "Book Now" runs a real
Stripe Checkout session; the webhook marks the booking `paid` and increments `tickets_sold`.

## Managing shows

Add/edit rows directly in the `shows` table (Supabase table editor or SQL) — no code changes
needed. Fields: `title`, `artist`, `description`, `date`, `doors_time`, `price_cents`, `currency`,
`capacity`, `category` (`live-music` | `bok-town` | `special`), `image_url`.
