// Emails the ticket confirmation to the customer and a copy to The Busker management, via Resend.
// Requires secret: RESEND_API_KEY. Optional: EMAIL_FROM, MANAGEMENT_EMAIL, SITE_URL
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { ticketEmailHtml, ticketEmailSubject, ticketEmailText, type TicketEmailData } from './ticketEmail.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
/** Must be an address on the domain verified in Resend (thebusker.co.za) */
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'The Busker <tickets@thebusker.co.za>'
const MANAGEMENT_EMAIL = Deno.env.get('MANAGEMENT_EMAIL') ?? 'info@thebusker.co.za'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://thebusker.co.za'

/** Whole tables by name, then single seats: "Long table 2", "Box SC seat 4" */
function describeSeats(rows: { id: string; table_id: string | null; label: string }[], seatIds: string[]) {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const tables = new Set<string>()
  const singles: string[] = []
  for (const id of seatIds) {
    const seat = byId.get(id)
    // Table seat labels read "<table label>, seat N"
    if (seat?.table_id) tables.add(seat.label.split(', seat')[0])
    else singles.push(seat?.label ?? id)
  }
  return [...tables, ...singles]
}

/**
 * Sends the confirmation once per booking. Returns false when sending failed, so the caller can
 * report an error and Yoco redelivers the event to try again.
 */
export async function sendTicketEmails(supabaseAdmin: SupabaseClient, bookingId: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set; skipping ticket emails for', bookingId)
    return true
  }

  // Claim the booking so repeated webhook deliveries don't email twice
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('bookings')
    .update({ confirmation_emailed_at: new Date().toISOString() })
    .eq('id', bookingId)
    .is('confirmation_emailed_at', null)
    .select('id, name, email, phone, quantity, seat_ids, amount_cents, currency, show_id')
    .maybeSingle()
  if (claimError) {
    console.error('Could not claim booking for email', bookingId, claimError)
    return false
  }
  if (!claimed) return true // already emailed

  const release = () => supabaseAdmin.from('bookings').update({ confirmation_emailed_at: null }).eq('id', bookingId)

  const { data: show } = await supabaseAdmin.from('shows').select('title, artist, date, doors_time').eq('id', claimed.show_id).single()
  if (!show) {
    await release()
    return false
  }

  const seatIds: string[] = claimed.seat_ids ?? []
  let seats: string[] = []
  if (seatIds.length) {
    const { data: rows } = await supabaseAdmin.from('venue_seats').select('id, table_id, label').in('id', seatIds)
    seats = describeSeats(rows ?? [], seatIds)
  }

  const data: TicketEmailData = {
    bookingId,
    name: claimed.name,
    email: claimed.email,
    phone: claimed.phone,
    showTitle: show.title,
    artist: show.artist,
    date: show.date,
    doorsTime: show.doors_time,
    quantity: claimed.quantity,
    seats,
    amountCents: claimed.amount_cents,
    currency: claimed.currency,
    siteUrl: SITE_URL,
  }
  const staff = { ...data, forManagement: true }

  const emails = [
    // Management copy: replying goes straight to the customer
    {
      from: EMAIL_FROM,
      to: [MANAGEMENT_EMAIL],
      ...(claimed.email ? { reply_to: claimed.email } : {}),
      subject: ticketEmailSubject(staff),
      html: ticketEmailHtml(staff),
      text: ticketEmailText(staff),
    },
  ]
  if (claimed.email) {
    emails.unshift({
      from: EMAIL_FROM,
      to: [claimed.email],
      reply_to: MANAGEMENT_EMAIL,
      subject: ticketEmailSubject(data),
      html: ticketEmailHtml(data),
      text: ticketEmailText(data),
    })
  }

  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend drops a repeat of the same batch within 24 hours
      'Idempotency-Key': `ticket-confirmation-${bookingId}`,
    },
    body: JSON.stringify(emails),
  })
  if (!res.ok) {
    console.error('Resend failed', bookingId, res.status, await res.text())
    await release()
    return false
  }
  return true
}
