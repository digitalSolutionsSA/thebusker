-- Per show, floors can be taken off sale online (e.g. only downstairs open, balcony closed), also
-- after tickets have been sold. Bookings already on a closed floor stay valid; staff can still book
-- there by hand from the admin portal. Only new online checkouts are refused.

alter table shows add column if not exists closed_floors text[] not null default '{}'
  check (closed_floors <@ array['downstairs', 'upstairs']::text[] and cardinality(closed_floors) < 2);

-- Same as 0009, plus: seats on a floor that's closed for this show can't be held for online checkout
create or replace function hold_seats(p_booking_id uuid, p_hold_minutes integer default 15)
returns text[]
language plpgsql
set search_path = public
as $$
declare
  b bookings;
  v_mode text;
  v_closed text[];
  v_unknown text[];
  v_partial text[];
  v_taken text[];
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id;
  end if;
  if coalesce(array_length(b.seat_ids, 1), 0) = 0 then
    raise exception 'No seats selected';
  end if;

  -- One seat-changing transaction per show at a time
  perform pg_advisory_xact_lock(hashtext(b.show_id::text));

  select array_agg(s) into v_unknown
  from unnest(b.seat_ids) s
  where not exists (select 1 from venue_seats v where v.id = s);
  if v_unknown is not null then
    raise exception 'Unknown seats: %', array_to_string(v_unknown, ', ');
  end if;

  select table_mode, closed_floors into v_mode, v_closed from shows where id = b.show_id;

  if exists (select 1 from venue_seats v where v.id = any(b.seat_ids) and v.floor = any(v_closed)) then
    raise exception 'Some of those seats are on a floor that isn''t open for this show. Please pick again.';
  end if;

  if v_mode = 'whole' then
    select array_agg(distinct v.table_id) into v_partial
    from venue_seats v
    where v.table_id in (select table_id from venue_seats where id = any(b.seat_ids) and table_id is not null)
      and not (v.id = any(b.seat_ids));
    if v_partial is not null then
      raise exception 'Tables must be booked whole: %', array_to_string(v_partial, ', ');
    end if;
  end if;

  delete from seat_reservations r
  where r.show_id = b.show_id and r.seat_id = any(b.seat_ids)
    and r.status = 'held' and r.expires_at < now();

  select array_agg(r.seat_id) into v_taken
  from seat_reservations r
  where r.show_id = b.show_id and r.seat_id = any(b.seat_ids) and r.booking_id <> b.id;
  if v_taken is not null then
    return v_taken;
  end if;

  insert into seat_reservations (show_id, seat_id, booking_id, status, expires_at)
  select distinct b.show_id, s, b.id, 'held', now() + make_interval(mins => p_hold_minutes)
  from unnest(b.seat_ids) s
  on conflict (show_id, seat_id) do update set expires_at = excluded.expires_at
    where seat_reservations.booking_id = excluded.booking_id;

  return '{}';
end;
$$;

revoke execute on function hold_seats(uuid, integer) from public, anon, authenticated;
grant execute on function hold_seats(uuid, integer) to service_role;
