-- Staff bookings from the admin portal can book single seats at a table, even on shows whose tables
-- sell whole online (e.g. two friends joining a table by phone). The website keeps following
-- shows.table_mode; a table with any seat taken simply stops selling whole online.
-- Same as 0009, without the whole-table rule.
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
