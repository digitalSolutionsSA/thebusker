// Supabase Edge Function: holds the chosen seats (or general-admission tickets) and opens a Yoco
// Checkout for them.
// Deploy with: supabase functions deploy create-checkout --no-verify-jwt
// (public endpoint: the site calls it with the publishable key, which isn't a JWT; every seat and
// ticket is re-checked in the database, so there's nothing a caller can bypass)
// Requires secrets: YOCO_SECRET_KEY, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'jsr:@supabase/supabase-js@2'

const YOCO_SECRET_KEY = Deno.env.get('YOCO_SECRET_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
const HOLD_MINUTES = 15
const MAX_SEATS = 60
const MAX_TICKETS = 20

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
    const { showId, seatIds, quantity: requested, name, email, phone } = await req.json()

    if (!showId || !name || !email || !phone) {
      return json({ error: 'Please fill in your details.' }, 400)
    }

    const { data: show, error: showError } = await supabaseAdmin.from('shows').select('*').eq('id', showId).single()
    if (showError || !show || show.is_published === false) {
      return json({ error: 'Show not found.' }, 404)
    }

    // Seat-map shows send seat ids; general-admission shows send a ticket count
    const general = show.seating === 'general'
    const seats: string[] =
      !general && Array.isArray(seatIds)
        ? [...new Set<string>(seatIds.filter((s: unknown): s is string => typeof s === 'string'))]
        : []
    const quantity = general ? Math.floor(Number(requested)) : seats.length
    const max = general ? MAX_TICKETS : MAX_SEATS

    if (!Number.isFinite(quantity) || quantity < 1) {
      return json({ error: general ? 'Choose how many tickets you need.' : 'Please choose your seats.' }, 400)
    }
    if (quantity > max) {
      return json({ error: `You can book up to ${max} ${general ? 'tickets' : 'seats'} at a time.` }, 400)
    }

    // Seat prices depend on each seat's ticket type (table / single / upstairs), worked out in the database
    let amountCents = show.price_cents * quantity
    if (!general) {
      const { data: total, error: priceError } = await supabaseAdmin.rpc('seats_total_cents', { p_show_id: show.id, p_seat_ids: seats })
      if (priceError || typeof total !== 'number') {
        return json({ error: 'Could not price your seats. Please try again.' }, 500)
      }
      amountCents = total
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        show_id: show.id,
        quantity,
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

    // Atomic in the database: the booking's tickets / seats are either all held or not at all
    if (general) {
      const { data: left, error: holdError } = await supabaseAdmin.rpc('hold_general_tickets', {
        p_booking_id: booking.id,
        p_hold_minutes: HOLD_MINUTES,
      })
      if (holdError || (left as number) < quantity) {
        await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
        if (holdError) return json({ error: holdError.message }, 400)
        const message = left === 0 ? 'Sorry, this show is sold out.' : `Sorry, only ${left} ticket${left === 1 ? '' : 's'} left.`
        return json({ error: message, ticketsLeft: left }, 409)
      }
    } else {
      const { data: taken, error: holdError } = await supabaseAdmin.rpc('hold_seats', {
        p_booking_id: booking.id,
        p_hold_minutes: HOLD_MINUTES,
      })
      if (holdError || (taken as string[]).length > 0) {
        await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
        if (holdError) return json({ error: holdError.message }, 400)
        return json({ error: 'Sorry, some of those seats were just taken. Please pick again.', takenSeats: taken }, 409)
      }
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
        metadata: {
          bookingId: booking.id,
          showId: show.id,
          seats: general ? `${quantity} x general admission` : seats.join(' '),
        },
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
