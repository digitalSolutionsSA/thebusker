-- Reserved seating. Every show uses the same venue plan (venue_seats, loaded by 0004).
--
-- No seat can be sold twice: seat_reservations has one row per (show, seat), enforced by its primary
-- key. Starting checkout puts a 15-minute hold on the seats; the payment webhook turns the hold
-- into a sale. Expired holds are cleared whenever someone else asks for the same seat.

create table if not exists venue_seats (
  id text primary key,
  floor text not null check (floor in ('downstairs', 'upstairs')),
  -- Set for seats at a table: the whole table must be booked together. Null = single seat.
  table_id text,
  label text not null
);

create index if not exists venue_seats_table_id_idx on venue_seats(table_id);

alter table venue_seats enable row level security;

create policy "Public can view venue seats" on venue_seats
  for select using (true);

-- Bookings now carry their seats and the Yoco checkout/payment ids
alter table bookings add column if not exists seat_ids text[] not null default '{}';
alter table bookings add column if not exists yoco_checkout_id text unique;
alter table bookings add column if not exists yoco_payment_id text;

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'paid', 'cancelled', 'failed', 'refunded', 'refund_failed'));

create table if not exists seat_reservations (
  show_id uuid not null references shows(id) on delete cascade,
  seat_id text not null references venue_seats(id),
  booking_id uuid not null references bookings(id) on delete cascade,
  status text not null check (status in ('held', 'sold')),
  -- Only for holds: after this the seat is free again
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (show_id, seat_id)
);

create index if not exists seat_reservations_booking_id_idx on seat_reservations(booking_id);

-- Written only by the functions below; no public access
alter table seat_reservations enable row level security;

-- Seats that can't be picked right now (sold, or held by someone in checkout)
create or replace function get_taken_seats(p_show_id uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select seat_id from seat_reservations
  where show_id = p_show_id and (status = 'sold' or expires_at > now());
$$;

-- Holds the booking's seats. Returns the seats someone else already has (empty array = held).
-- Raises for unknown seats or a partly booked table.
create or replace function hold_seats(p_booking_id uuid, p_hold_minutes integer default 15)
returns text[]
language plpgsql
set search_path = public
as $$
declare
  b bookings;
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

  select array_agg(distinct v.table_id) into v_partial
  from venue_seats v
  where v.table_id in (select table_id from venue_seats where id = any(b.seat_ids) and table_id is not null)
    and not (v.id = any(b.seat_ids));
  if v_partial is not null then
    raise exception 'Tables must be booked whole: %', array_to_string(v_partial, ', ');
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

-- Called by the payment webhook. Marks the booking paid and its seats sold, and returns true.
-- Returns false (seats released, booking left unpaid) if someone else got a seat after this
-- booking's hold expired — the webhook then refunds the payment.
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

-- Frees the seats straight away when a customer cancels on the payment page.
-- Callable from the browser: only the customer has the booking id, and paid bookings are untouched.
create or replace function release_pending_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from seat_reservations r
  using bookings b
  where r.booking_id = p_booking_id and b.id = r.booking_id and b.status = 'pending' and r.status = 'held';

  update bookings set status = 'cancelled', updated_at = now()
  where id = p_booking_id and status = 'pending';
end;
$$;

-- Functions are executable by everyone by default: lock the seat-changing ones to the edge functions
revoke execute on function hold_seats(uuid, integer) from public, anon, authenticated;
revoke execute on function confirm_booking(uuid, text) from public, anon, authenticated;
grant execute on function hold_seats(uuid, integer) to service_role;
grant execute on function confirm_booking(uuid, text) to service_role;

revoke execute on function get_taken_seats(uuid) from public;
revoke execute on function release_pending_booking(uuid) from public;
grant execute on function get_taken_seats(uuid) to anon, authenticated, service_role;
grant execute on function release_pending_booking(uuid) to anon, authenticated, service_role;
