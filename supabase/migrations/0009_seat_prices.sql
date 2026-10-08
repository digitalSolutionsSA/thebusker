-- Ticket types for seating-plan shows: separate prices for seats at tables, single seats (boxes and
-- wall seats downstairs) and the upstairs balcony, plus whether tables sell whole or seat by seat.
-- A null price falls back to shows.price_cents (which the admin portal keeps at the lowest price,
-- for "from R…" on the website).

alter table shows add column if not exists price_table_cents integer check (price_table_cents >= 0);
alter table shows add column if not exists price_single_cents integer check (price_single_cents >= 0);
alter table shows add column if not exists price_upstairs_cents integer check (price_upstairs_cents >= 0);
alter table shows add column if not exists table_mode text not null default 'whole'
  check (table_mode in ('whole', 'seats'));

-- What a set of seats costs for a show, using each seat's ticket type
create or replace function seats_total_cents(p_show_id uuid, p_seat_ids text[])
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(
    case
      when v.floor = 'upstairs' then coalesce(s.price_upstairs_cents, s.price_cents)
      when v.table_id is not null then coalesce(s.price_table_cents, s.price_cents)
      else coalesce(s.price_single_cents, s.price_cents)
    end
  ), 0)::integer
  from shows s
  join venue_seats v on v.id = any(p_seat_ids)
  where s.id = p_show_id;
$$;

revoke execute on function seats_total_cents(uuid, text[]) from public, anon;
grant execute on function seats_total_cents(uuid, text[]) to authenticated, service_role;

-- Same as 0003, except the whole-table rule only applies when the show sells whole tables
create or replace function hold_seats(p_booking_id uuid, p_hold_minutes integer default 15)
returns text[]
language plpgsql
set search_path = public
as $$
declare
  b bookings;
  v_mode text;
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

  select table_mode into v_mode from shows where id = b.show_id;
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

-- Same as 0008, with the table rule following the show and the default amount from the seat prices
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
  v_amount integer;
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
    v_amount := v_show.price_cents * v_qty;
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

    if v_show.table_mode = 'whole' then
      select array_agg(distinct v.table_id) into v_partial
      from venue_seats v
      where v.table_id in (select table_id from venue_seats where id = any(v_seats) and table_id is not null)
        and not (v.id = any(v_seats));
      if v_partial is not null then
        raise exception 'Tables must be booked whole: %', array_to_string(v_partial, ', ');
      end if;
    end if;

    delete from seat_reservations r
    where r.show_id = p_show_id and r.seat_id = any(v_seats) and r.status = 'held' and r.expires_at < now();

    select array_agg(r.seat_id) into v_taken from seat_reservations r
    where r.show_id = p_show_id and r.seat_id = any(v_seats);
    if v_taken is not null then
      raise exception 'Already booked: %', array_to_string(v_taken, ', ');
    end if;
    v_qty := array_length(v_seats, 1);
    v_amount := seats_total_cents(p_show_id, v_seats);
  end if;

  insert into bookings (show_id, quantity, seat_ids, name, email, phone, amount_cents, currency, status, source, notes, created_by)
  values (
    p_show_id, v_qty, v_seats, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
    coalesce(p_amount_cents, v_amount), v_show.currency,
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
