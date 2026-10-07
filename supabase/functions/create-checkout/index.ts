// Supabase Edge Function: holds the chosen seats and opens a Yoco Checkout for them.
// Deploy with: supabase functions deploy create-checkout --no-verify-jwt
// (public endpoint: the site calls it with the publishable key, which isn't a JWT; every seat is
// re-checked in the database, so there's nothing a caller can bypass)
// Requires secrets: YOCO_SECRET_KEY, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'jsr:@supabase/supabase-js@2'

const YOCO_SECRET_KEY = Deno.env.get('YOCO_SECRET_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
const HOLD_MINUTES = 15
const MAX_SEATS = 60

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { showId, seatIds, name, email, phone } = await req.json()
    const seats = Array.isArray(seatIds) ? [...new Set(seatIds.filter((s: unknown) => typeof s === 'string'))] : []

    if (!showId || !name || !email || !phone || seats.length === 0) {
      return json({ error: 'Please choose your seats and fill in your details.' }, 400)
    }
    if (seats.length > MAX_SEATS) {
      return json({ error: `You can book up to ${MAX_SEATS} seats at a time.` }, 400)
    }

    const { data: show, error: showError } = await supabaseAdmin.from('shows').select('*').eq('id', showId).single()
    if (showError || !show) {
      return json({ error: 'Show not found.' }, 404)
    }

    const amountCents = show.price_cents * seats.length

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        show_id: show.id,
        quantity: seats.length,
        seat_ids: seats,
        name,
        email,
        phone,
        amount_cents: amountCents,
        currency: show.currency,
        status: 'pending',
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return json({ error: 'Could not create your booking. Please try again.' }, 500)
    }

    // Atomic in the database: either every seat is held for this booking or none are
    const { data: taken, error: holdError } = await supabaseAdmin.rpc('hold_seats', {
      p_booking_id: booking.id,
      p_hold_minutes: HOLD_MINUTES,
    })

    if (holdError || (taken as string[]).length > 0) {
      await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
      if (holdError) {
        return json({ error: holdError.message }, 400)
      }
      return json(
        { error: 'Sorry, some of those seats were just taken. Please pick again.', takenSeats: taken },
        409,
      )
    }

    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': booking.id,
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: show.currency,
        successUrl: `${SITE_URL}/booking/success?booking_id=${booking.id}`,
        cancelUrl: `${SITE_URL}/booking/cancelled?booking_id=${booking.id}`,
        failureUrl: `${SITE_URL}/booking/cancelled?booking_id=${booking.id}`,
        externalId: booking.id,
        metadata: { bookingId: booking.id, showId: show.id, seats: seats.join(' ') },
      }),
    })
    const checkout = await yocoRes.json().catch(() => null)

    if (!yocoRes.ok || !checkout?.redirectUrl) {
      console.error('Yoco checkout failed', yocoRes.status, checkout)
      await supabaseAdmin.rpc('release_pending_booking', { p_booking_id: booking.id })
      await supabaseAdmin.from('bookings').update({ status: 'failed' }).eq('id', booking.id)
      return json({ error: 'Could not open the payment page. Please try again.' }, 502)
    }

    await supabaseAdmin.from('bookings').update({ yoco_checkout_id: checkout.id }).eq('id', booking.id)

    return json({ url: checkout.redirectUrl })
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
