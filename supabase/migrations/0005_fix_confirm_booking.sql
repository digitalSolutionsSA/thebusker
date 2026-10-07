-- 0003 inserted an untyped null for expires_at, which Postgres rejects under SELECT DISTINCT.
-- Recreates confirm_booking with the cast (0003 itself is fixed for fresh installs).

create or replace function confirm_booking(p_booking_id uuid, p_payment_id text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  b bookings;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id;
  end if;
  if b.status = 'paid' then
    return true;
  end if;
  -- Already lost its seats and was refunded (a repeated webhook delivery)
  if b.status in ('refunded', 'refund_failed') then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext(b.show_id::text));

  delete from seat_reservations r
  where r.show_id = b.show_id and r.seat_id = any(b.seat_ids) and r.booking_id <> b.id
    and r.status = 'held' and r.expires_at < now();

  if exists (
    select 1 from seat_reservations r
    where r.show_id = b.show_id and r.seat_id = any(b.seat_ids) and r.booking_id <> b.id
  ) then
    delete from seat_reservations where booking_id = b.id;
    update bookings set yoco_payment_id = p_payment_id, updated_at = now() where id = b.id;
    return false;
  end if;

  insert into seat_reservations (show_id, seat_id, booking_id, status, expires_at)
  select distinct b.show_id, s, b.id, 'sold', null::timestamptz
  from unnest(b.seat_ids) s
  on conflict (show_id, seat_id) do update set status = 'sold', expires_at = null;

  -- The bookings_mark_paid trigger adds the seats to shows.tickets_sold
  update bookings
  set status = 'paid', yoco_payment_id = p_payment_id, updated_at = now()
  where id = b.id;

  return true;
end;
$$;
