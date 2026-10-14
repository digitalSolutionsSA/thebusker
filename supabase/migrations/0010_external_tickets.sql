-- Shows sold through another ticketing site (e.g. Quicket, Computicket): the show page links out
-- instead of selling seats here. external_ticket_seller is just the name shown to buyers (optional).
-- create-checkout refuses online bookings for these shows.

alter table shows add column if not exists external_ticket_url text
  check (external_ticket_url is null or external_ticket_url ~* '^https?://');
alter table shows add column if not exists external_ticket_seller text;
