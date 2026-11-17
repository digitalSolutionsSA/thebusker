-- Staff can move a booking to other seats from the guest list (Edit → Change seats) instead of
-- cancelling it and adding a new one. Works on online and hand-added bookings, paid or reserved, on
-- seating-plan shows. Seats can be swapped, added or dropped; the booking keeps its reference, name,
-- payment and check-in. The amount isn't changed here (update_booking does that for hand-added
-- bookings); seats are never double-booked because seat_reservations stays one row per (show, seat).
create or replace function change_booking_seats(p_booking_id uuid, p_seat_ids text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings;
  v_seats text[];
  v_unknown text[];
  v_taken text[];
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;

  select * into b from bookings where id = p_booking_id;
  if not found then
    raise exception 'Booking not found.';
  end if;

  -- Same lock as checkouts and staff bookings for this show, so nobody grabs a seat mid-move
  perform pg_advisory_xact_lock(hashtext(b.show_id::text));

  select * into b from bookings where id = p_booking_id for update;
  if b.status not in ('paid', 'reserved') then
    raise exception 'Only paid or reserved bookings can be changed.';
  end if;
  if (select seating from shows where id = b.show_id) = 'general' then
    raise exception 'General-admission bookings have no seats to change.';
  end if;

  select array_agg(distinct s) into v_seats from unnest(p_seat_ids) s;
  if coalesce(array_length(v_seats, 1), 0) = 0 then
    raise exception 'Choose at least one seat.';
  end if;

  select array_agg(s) into v_unknown from unnest(v_seats) s
  where not exists (select 1 from venue_seats v where v.id = s);
  if v_unknown is not null then
    raise exception 'Unknown seats: %', array_to_string(v_unknown, ', ');
  end if;

  -- Expired online holds don't block anything
  delete from seat_reservations r
  where r.show_id = b.show_id and r.seat_id = any(v_seats) and r.status = 'held' and r.expires_at < now();

  select array_agg(r.seat_id order by r.seat_id) into v_taken from seat_reservations r
  where r.show_id = b.show_id and r.seat_id = any(v_seats) and r.booking_id <> b.id;
  if v_taken is not null then
    raise exception 'Already booked: %', array_to_string(v_taken, ', ');
  end if;

  -- Free the seats this booking no longer has, take the new ones
  delete from seat_reservations r
  where r.booking_id = b.id and not (r.seat_id = any(v_seats));

  insert into seat_reservations (show_id, seat_id, booking_id, status, expires_at)
  select b.show_id, s, b.id, 'sold', null::timestamptz from unnest(v_seats) s
  where not exists (select 1 from seat_reservations r where r.show_id = b.show_id and r.seat_id = s);

  -- The bookings trigger keeps shows.tickets_sold in line with the new quantity
  update bookings
  set seat_ids = v_seats, quantity = array_length(v_seats, 1), updated_at = now()
  where id = b.id;
end;
$$;

revoke execute on function change_booking_seats(uuid, text[]) from public, anon;
grant execute on function change_booking_seats(uuid, text[]) to authenticated;
