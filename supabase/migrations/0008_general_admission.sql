-- General admission: shows without the seating plan (e.g. club nights). Buyers choose how many
-- tickets; shows.capacity is the ticket limit. Nothing can oversell: online checkouts hold their
-- tickets for 15 minutes (bookings.hold_expires_at) and every count runs under the same per-show
-- lock as the seat functions.

alter table shows add column if not exists seating text not null default 'reserved'
  check (seating in ('reserved', 'general'));

alter table bookings add column if not exists hold_expires_at timestamptz;

-- Tickets a general-admission show has committed: sold, reserved, or in a checkout that's still open
create or replace function general_tickets_used(p_show_id uuid, p_except uuid default null)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(quantity), 0)::integer from bookings
  where show_id = p_show_id
    and id is distinct from p_except
    and (status in ('paid', 'reserved') or (status = 'pending' and hold_expires_at > now()));
$$;

revoke execute on function general_tickets_used(uuid, uuid) from public, anon, authenticated;

-- Seat-map shows can't switch to general admission (or back) once tickets are sold, and a
-- general-admission show can't be given fewer tickets than it has already sold
create or replace function guard_show_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.seating is distinct from old.seating
     and exists (select 1 from bookings where show_id = old.id and status in ('paid', 'reserved', 'pending')) then
    raise exception 'This show already has bookings, so its seating type can''t be changed.';
  end if;
  if new.seating = 'general' and new.capacity < old.tickets_sold then
    raise exception 'You''ve already sold % tickets, so the limit can''t be lower than that.', old.tickets_sold;
  end if;
  return new;
end;
$$;

create trigger shows_guard_changes
  before update on shows
  for each row execute function guard_show_changes();

-- Online checkout for a general-admission show: holds the booking's tickets for p_hold_minutes.
-- Returns how many tickets were available; the hold only happens when that covers the booking.
create or replace function hold_general_tickets(p_booking_id uuid, p_hold_minutes integer default 15)
returns integer
language plpgsql
set search_path = public
as $$
declare
  b bookings;
  v_show shows;
  v_left integer;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id;
  end if;
  select * into v_show from shows where id = b.show_id;
  if v_show.seating <> 'general' then
    raise exception 'This show uses the seating plan.';
  end if;

  perform pg_advisory_xact_lock(hashtext(b.show_id::text));

  v_left := greatest(v_show.capacity - general_tickets_used(b.show_id, b.id), 0);
  if v_left >= b.quantity then
    update bookings set hold_expires_at = now() + make_interval(mins => p_hold_minutes) where id = b.id;
  end if;
  return v_left;
end;
$$;

revoke execute on function hold_general_tickets(uuid, integer) from public, anon, authenticated;
grant execute on function hold_general_tickets(uuid, integer) to service_role;

-- Payment webhook: same as before for seat-map shows; general-admission bookings are confirmed while
-- their hold lasts, or afterwards if tickets are still left (otherwise false → the webhook refunds)
create or replace function confirm_booking(p_booking_id uuid, p_payment_id text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  b bookings;
  v_show shows;
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

  if coalesce(array_length(b.seat_ids, 1), 0) = 0 then
    select * into v_show from shows where id = b.show_id;
    if (b.hold_expires_at is null or b.hold_expires_at < now() or b.status <> 'pending')
       and general_tickets_used(b.show_id, b.id) + b.quantity > v_show.capacity then
      update bookings set yoco_payment_id = p_payment_id, updated_at = now() where id = b.id;
      return false;
    end if;
    update bookings
    set status = 'paid', yoco_payment_id = p_payment_id, hold_expires_at = null, updated_at = now()
    where id = b.id;
    return true;
  end if;

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

  -- The bookings trigger adds the seats to shows.tickets_sold
  update bookings
  set status = 'paid', yoco_payment_id = p_payment_id, updated_at = now()
  where id = b.id;

  return true;
end;
$$;

-- Manual sales now also cover general admission (p_quantity instead of seats)
drop function if exists create_manual_booking(uuid, text[], text, text, text, text, boolean, integer, text);

create or replace function create_manual_booking(
  p_show_id uuid,
  p_seat_ids text[],
  p_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_paid boolean,
  p_amount_cents integer,
  p_notes text,
  p_quantity integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seats text[];
  v_unknown text[];
  v_partial text[];
  v_taken text[];
  v_show shows;
  v_qty integer;
  v_left integer;
  v_id uuid;
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Enter the buyer''s name.';
  end if;

  select * into v_show from shows where id = p_show_id;
  if not found then
    raise exception 'Show not found.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_show_id::text));

  if v_show.seating = 'general' then
    v_qty := coalesce(p_quantity, 0);
    if v_qty < 1 then
      raise exception 'Enter how many tickets.';
    end if;
    v_left := greatest(v_show.capacity - general_tickets_used(p_show_id), 0);
    if v_qty > v_left then
      raise exception 'Only % tickets left.', v_left;
    end if;
    v_seats := '{}';
  else
    select array_agg(distinct s) into v_seats from unnest(p_seat_ids) s;
    if coalesce(array_length(v_seats, 1), 0) = 0 then
      raise exception 'Choose at least one seat.';
    end if;

    select array_agg(s) into v_unknown from unnest(v_seats) s
    where not exists (select 1 from venue_seats v where v.id = s);
    if v_unknown is not null then
      raise exception 'Unknown seats: %', array_to_string(v_unknown, ', ');
    end if;

    select array_agg(distinct v.table_id) into v_partial
    from venue_seats v
    where v.table_id in (select table_id from venue_seats where id = any(v_seats) and table_id is not null)
      and not (v.id = any(v_seats));
    if v_partial is not null then
      raise exception 'Tables must be booked whole: %', array_to_string(v_partial, ', ');
    end if;

    delete from seat_reservations r
    where r.show_id = p_show_id and r.seat_id = any(v_seats) and r.status = 'held' and r.expires_at < now();

    select array_agg(r.seat_id) into v_taken from seat_reservations r
    where r.show_id = p_show_id and r.seat_id = any(v_seats);
    if v_taken is not null then
      raise exception 'Already booked: %', array_to_string(v_taken, ', ');
    end if;
    v_qty := array_length(v_seats, 1);
  end if;

  insert into bookings (show_id, quantity, seat_ids, name, email, phone, amount_cents, currency, status, source, notes, created_by)
  values (
    p_show_id, v_qty, v_seats, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
    coalesce(p_amount_cents, v_show.price_cents * v_qty), v_show.currency,
    case when p_paid then 'paid' else 'reserved' end, coalesce(p_source, 'other'), nullif(trim(p_notes), ''), auth.uid()
  )
  returning id into v_id;

  if array_length(v_seats, 1) > 0 then
    insert into seat_reservations (show_id, seat_id, booking_id, status, expires_at)
    select p_show_id, s, v_id, 'sold', null::timestamptz from unnest(v_seats) s;
  end if;

  return v_id;
end;
$$;

revoke execute on function create_manual_booking(uuid, text[], text, text, text, text, boolean, integer, text, integer) from public, anon;
grant execute on function create_manual_booking(uuid, text[], text, text, text, text, boolean, integer, text, integer) to authenticated;
