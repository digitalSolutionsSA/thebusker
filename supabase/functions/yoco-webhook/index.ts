// Supabase Edge Function: receives Yoco payment events, marks bookings paid and their seats sold.
// Deploy with: supabase functions deploy yoco-webhook --no-verify-jwt
// Register it once with Yoco (POST https://payments.yoco.com/api/webhooks) and store the returned secret.
// Requires secrets: YOCO_SECRET_KEY, YOCO_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'jsr:@supabase/supabase-js@2'

const YOCO_SECRET_KEY = Deno.env.get('YOCO_SECRET_KEY')!
const YOCO_WEBHOOK_SECRET = Deno.env.get('YOCO_WEBHOOK_SECRET')!
/** Reject events signed longer ago than this (replay protection) */
const TOLERANCE_SECONDS = 3 * 60

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const base64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Standard Webhooks signature: base64(HMAC-SHA256(secret, `${id}.${timestamp}.${body}`)) */
async function verify(req: Request, body: string) {
  const id = req.headers.get('webhook-id')
  const timestamp = req.headers.get('webhook-timestamp')
  const signatures = req.headers.get('webhook-signature')
  if (!id || !timestamp || !signatures) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false

  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(YOCO_WEBHOOK_SECRET.replace(/^whsec_/, '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))

  // Header is space-separated "v1,<sig>" entries (several during key rotation)
  return signatures.split(' ').some((entry) => timingSafeEqual(entry.split(',')[1] ?? '', expected))
}

async function refund(checkoutId: string, bookingId: string) {
  const res = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `refund-${bookingId}`,
    },
    body: JSON.stringify({ metadata: { bookingId, reason: 'seats no longer available' } }),
  })
  if (!res.ok) console.error('Yoco refund failed', bookingId, res.status, await res.text())
  return res.ok
}

const ok = () => new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const body = await req.text()
  if (!(await verify(req, body))) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  const payload = event.payload ?? {}
  const checkoutId: string | undefined = payload.metadata?.checkoutId

  // Find the booking by our own metadata, falling back to the checkout id
  let bookingId: string | undefined = payload.metadata?.bookingId
  if (!bookingId && checkoutId) {
    const { data } = await supabaseAdmin.from('bookings').select('id').eq('yoco_checkout_id', checkoutId).maybeSingle()
    bookingId = data?.id
  }
  if (!bookingId) return ok()

  if (event.type === 'payment.succeeded') {
    const { data: confirmed, error } = await supabaseAdmin.rpc('confirm_booking', {
      p_booking_id: bookingId,
      p_payment_id: payload.id ?? null,
    })
    if (error) {
      console.error('confirm_booking failed', bookingId, error)
      // Non-2xx makes Yoco retry the event later
      return new Response('Could not confirm booking', { status: 500 })
    }

    if (!confirmed) {
      // The hold expired and someone else bought a seat in the meantime: give the money back
      const { data: booking } = await supabaseAdmin.from('bookings').select('status, yoco_checkout_id').eq('id', bookingId).single()
      if (booking && booking.status !== 'refunded' && booking.status !== 'refund_failed') {
        const refunded = booking.yoco_checkout_id ? await refund(booking.yoco_checkout_id, bookingId) : false
        await supabaseAdmin
          .from('bookings')
          .update({ status: refunded ? 'refunded' : 'refund_failed', updated_at: new Date().toISOString() })
          .eq('id', bookingId)
      }
    }
  }
  // payment.failed is ignored on purpose: the customer can retry on the same Yoco page while the
  // hold lasts, and unpaid holds simply expire.

  return ok()
})
