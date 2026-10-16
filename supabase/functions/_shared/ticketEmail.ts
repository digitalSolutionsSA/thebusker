// Ticket confirmation email: one design, sent to the customer and copied to The Busker management.
// Email clients ignore <style> blocks and modern CSS, so everything is table layout with inline styles.

export interface TicketEmailData {
  bookingId: string
  name: string
  email: string | null
  phone: string | null
  showTitle: string
  artist: string
  /** ISO date of the show, YYYY-MM-DD */
  date: string
  doorsTime: string
  quantity: number
  /** Human-readable seats ("Long table 2", "Box SC seat 4"); empty for general admission */
  seats: string[]
  amountCents: number
  currency: string
  siteUrl: string
  /** Management copy: adds a staff banner with the customer's contact details on top */
  forManagement?: boolean
}

const VENUE = {
  name: 'The Busker',
  tagline: 'Music Hall & Venue',
  address: '1 Club Street, Peacehaven, Vereeniging (Old Barnyard)',
  phone: '074 000 0082',
  email: 'info@thebusker.co.za',
}

const C = {
  night: '#0f0b07',
  panel: '#17110b',
  border: '#3a2c1a',
  gold: '#e2bd6d',
  goldDeep: '#c9a24a',
  ivory: '#f5ecdc',
  mist: '#bfae92',
}

export const bookingRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)

const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })

const ticketsLine = (d: TicketEmailData) =>
  d.seats.length ? `${d.quantity} seat${d.quantity === 1 ? '' : 's'}` : `${d.quantity} × general admission`

export function ticketEmailSubject(d: TicketEmailData) {
  const ref = bookingRef(d.bookingId)
  return d.forManagement
    ? `New ticket sale: ${d.showTitle} (${d.quantity}) · ${d.name} · ${ref}`
    : `Your tickets for ${d.showTitle} · Booking ${ref}`
}

export function ticketEmailHtml(d: TicketEmailData) {
  const ref = bookingRef(d.bookingId)
  const site = d.siteUrl.replace(/\/$/, '')

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.border};font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.mist};width:38%;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${C.border};font:15px/1.5 Georgia,'Times New Roman',serif;color:${C.ivory};vertical-align:top;">${value}</td>
    </tr>`

  const staffBanner = d.forManagement
    ? `
    <tr>
      <td style="padding:0 0 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.goldDeep};border-radius:10px;">
          <tr><td style="padding:14px 18px;font:600 13px/1.5 Arial,Helvetica,sans-serif;color:${C.night};">
            New online ticket sale: ${esc(d.name)} bought ${esc(ticketsLine(d))} for ${esc(d.showTitle)}.<br>
            ${d.email ? `Email: <a href="mailto:${esc(d.email)}" style="color:${C.night};">${esc(d.email)}</a>` : ''}${d.email && d.phone ? ' · ' : ''}${d.phone ? `Phone: ${esc(d.phone)}` : ''}
            <br><span style="font-weight:400;">Below is the confirmation the customer received.</span>
          </td></tr>
        </table>
      </td>
    </tr>`
    : ''

  const seatsRow = d.seats.length ? row('Seats', d.seats.map(esc).join('<br>')) : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${esc(ticketEmailSubject(d))}</title>
</head>
<body style="margin:0;padding:0;background:${C.night};">
<div style="display:none;max-height:0;overflow:hidden;">You're on the list for ${esc(d.showTitle)}. Booking reference ${ref}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.night};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        ${staffBanner}
        <tr>
          <td align="center" style="padding:8px 0 24px;">
            <a href="${site}" style="text-decoration:none;">
              <img src="${site}/brand/logo-white.png" width="200" alt="The Busker, Music Hall &amp; Venue" style="display:block;width:200px;max-width:60%;height:auto;border:0;color:${C.ivory};font:700 22px Georgia,serif;">
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:${C.panel};border:1px solid ${C.border};border-top:3px solid ${C.gold};border-radius:14px;padding:32px 28px;">
            <p style="margin:0 0 6px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">Booking confirmed</p>
            <h1 style="margin:0 0 16px;font:700 28px/1.2 Georgia,'Times New Roman',serif;color:${C.ivory};">You're on the list, ${esc(d.name.split(' ')[0] || d.name)}!</h1>
            <p style="margin:0 0 24px;font:16px/1.6 Georgia,'Times New Roman',serif;color:${C.mist};">
              Thank you for booking with The Busker. Your payment went through and your tickets are confirmed. Keep this email; it's your proof of purchase.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.night};border:1px dashed ${C.goldDeep};border-radius:10px;margin:0 0 24px;">
              <tr>
                <td align="center" style="padding:18px;">
                  <p style="margin:0 0 4px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:3px;text-transform:uppercase;color:${C.mist};">Booking reference</p>
                  <p style="margin:0;font:700 30px/1.2 'Courier New',Courier,monospace;letter-spacing:6px;color:${C.gold};">${ref}</p>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${row('Show', `<strong>${esc(d.showTitle)}</strong>${d.artist && d.artist !== d.showTitle ? `<br><span style="color:${C.mist};">${esc(d.artist)}</span>` : ''}`)}
              ${row('Date', esc(longDate(d.date)))}
              ${row('Doors open', esc(d.doorsTime))}
              ${row('Tickets', esc(ticketsLine(d)))}
              ${seatsRow}
              ${row('Total paid', `<strong>${esc(money(d.amountCents, d.currency))}</strong>`)}
              ${row('Booked by', `${esc(d.name)}${d.email ? `<br>${esc(d.email)}` : ''}${d.phone ? `<br>${esc(d.phone)}` : ''}`)}
            </table>

            <p style="margin:24px 0 0;font:15px/1.6 Georgia,'Times New Roman',serif;color:${C.ivory};">
              <strong style="color:${C.gold};">At the door:</strong> give your name or booking reference <strong>${ref}</strong>. No printing needed.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0;" align="center">
            <p style="margin:0 0 6px;font:600 11px/1.6 Arial,Helvetica,sans-serif;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">${VENUE.name} · ${VENUE.tagline}</p>
            <p style="margin:0;font:13px/1.7 Arial,Helvetica,sans-serif;color:${C.mist};">
              ${VENUE.address}<br>
              ${VENUE.phone} · <a href="mailto:${VENUE.email}" style="color:${C.gold};text-decoration:none;">${VENUE.email}</a><br>
              Questions about your booking? Just reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function ticketEmailText(d: TicketEmailData) {
  const ref = bookingRef(d.bookingId)
  const lines = [
    d.forManagement
      ? `NEW ONLINE TICKET SALE: ${d.name} bought ${ticketsLine(d)} for ${d.showTitle}.\nEmail: ${d.email ?? '-'} · Phone: ${d.phone ?? '-'}\nBelow is the confirmation the customer received.\n\n---\n`
      : '',
    `You're on the list, ${d.name}!`,
    '',
    'Your payment went through and your tickets are confirmed. Keep this email; it is your proof of purchase.',
    '',
    `Booking reference: ${ref}`,
    '',
    `Show: ${d.showTitle}${d.artist && d.artist !== d.showTitle ? ` (${d.artist})` : ''}`,
    `Date: ${longDate(d.date)}`,
    `Doors open: ${d.doorsTime}`,
    `Tickets: ${ticketsLine(d)}`,
    ...(d.seats.length ? [`Seats: ${d.seats.join(', ')}`] : []),
    `Total paid: ${money(d.amountCents, d.currency)}`,
    `Booked by: ${[d.name, d.email, d.phone].filter(Boolean).join(' · ')}`,
    '',
    `At the door: give your name or booking reference ${ref}. No printing needed.`,
    '',
    `${VENUE.name} · ${VENUE.tagline}`,
    VENUE.address,
    `${VENUE.phone} · ${VENUE.email}`,
  ]
  return lines.join('\n')
}
