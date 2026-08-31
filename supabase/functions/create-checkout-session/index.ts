// Supabase Edge Function: creates a Stripe Checkout Session for a show booking.
// Deploy with: supabase functions deploy create-checkout-session
// Requires secrets: STRIPE_SECRET_KEY, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { showId, quantity, name, email, phone } = await req.json()

    if (!showId || !quantity || !name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: show, error: showError } = await supabaseAdmin
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single()

    if (showError || !show) {
      return new Response(JSON.stringify({ error: 'Show not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const remaining = show.capacity - show.tickets_sold
    if (quantity > remaining) {
      return new Response(JSON.stringify({ error: `Only ${remaining} tickets left.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountCents = show.price_cents * quantity

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        show_id: show.id,
        quantity,
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
      return new Response(JSON.stringify({ error: 'Could not create booking.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: show.currency.toLowerCase(),
            product_data: { name: show.title, description: `${quantity} ticket(s)` },
            unit_amount: show.price_cents,
          },
          quantity,
        },
      ],
      success_url: `${SITE_URL}/booking/success?booking_id=${booking.id}`,
      cancel_url: `${SITE_URL}/booking/cancelled?booking_id=${booking.id}`,
      metadata: { booking_id: booking.id, show_id: show.id },
    })

    await supabaseAdmin
      .from('bookings')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', booking.id)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
