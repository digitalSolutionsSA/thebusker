-- increment_tickets_sold only runs as the bookings trigger; nobody needs to call it through the API.
-- (get_taken_seats and release_pending_booking stay public on purpose — see 0003.)
revoke execute on function increment_tickets_sold() from public, anon, authenticated;
