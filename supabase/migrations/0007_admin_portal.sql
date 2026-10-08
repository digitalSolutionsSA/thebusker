-- Admin portal: staff sign-in, show management, guest lists, door check-in and manual sales.
--
-- Staff accounts are created in Supabase Auth (Authentication → Users → Add user). Signing in only
-- gives access to /admin once the account also has a row in `staff`:
--   insert into staff (user_id, email) select id, email from auth.users where email = 'someone@example.com';

create table if not exists staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

-- Used inside public policies, so every role must be able to run it
revoke execute on function is_staff() from public;
grant execute on function is_staff() to anon, authenticated, service_role;

create policy "Staff can see staff" on staff
  for select to authenticated using (is_staff());

-- ── Shows ────────────────────────────────────────────────────────────────────

alter table shows add column if not exists is_published boolean not null default true;
alter table shows add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Public can view shows" on shows;
create policy "Public can view published shows" on shows
  for select using (is_published or is_staff());
create policy "Staff can add shows" on shows
  for insert to authenticated with check (is_staff());
create policy "Staff can edit shows" on shows
  for update to authenticated using (is_staff()) with check (is_staff());
create policy "Staff can delete shows" on shows
  for delete to authenticated using (is_staff());

-- Never lose sales: a show with tickets sold or reserved can only be hidden, not deleted
create or replace function keep_shows_with_sales()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from bookings where show_id = old.id and status in ('paid', 'reserved')) then
    raise exception 'This show has ticket sales, so it can''t be deleted. Hide it instead.';
  end if;
  return old;
end;
$$;

create trigger shows_keep_sales
  before delete on shows
  for each row execute function keep_shows_with_sales();

-- ── Bookings ─────────────────────────────────────────────────────────────────

-- 'reserved' = seats held for a manual sale that hasn't been paid yet (e.g. pay at the door)
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'paid', 'reserved', 'cancelled', 'failed', 'refunded', 'refund_failed'));

alter table bookings add column if not exists source text not null default 'online'
  check (source in ('online', 'phone', 'whatsapp', 'pharmacy', 'door', 'other'));
alter table bookings add column if not exists notes text;
alter table bookings add column if not exists checked_in_at timestamptz;
alter table bookings add column if not exists checked_in_by uuid references auth.users(id) on delete set null;
alter table bookings add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Manual sales don't always come with an email address or phone number
alter table bookings alter column email drop not null;
alter table bookings alter column phone drop not null;

create policy "Staff can view bookings" on bookings
  for select to authenticated using (is_staff());

-- tickets_sold counts every seat that is paid for or reserved, and goes back down when a booking
-- is cancelled (replaces the paid-only trigger from 0001)
drop trigger if exists bookings_mark_paid on bookings;
drop function if exists increment_tickets_sold();

create or replace function sync_tickets_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was integer := 0;
  v_now integer := 0;
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status in ('paid', 'reserved') then
    v_was := old.quantity;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.status in ('paid', 'reserved') then
    v_now := new.quantity;
  end if;

  if tg_op = 'UPDATE' and old.show_id = new.show_id then
    if v_now <> v_was then
      update shows set tickets_sold = greatest(0, tickets_sold + v_now - v_was) where id = new.show_id;
    end if;
  else
    if v_was > 0 then
      update shows set tickets_sold = greatest(0, tickets_sold - v_was) where id = old.show_id;
    end if;
    if v_now > 0 then
      update shows set tickets_sold = tickets_sold + v_now where id = new.show_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function sync_tickets_sold() from public, anon, authenticated;

create trigger bookings_sync_tickets_sold
  after insert or update of status, quantity, show_id or delete on bookings
  for each row execute function sync_tickets_sold();

-- Bring the counts in line with the new rule
update shows s set tickets_sold = coalesce((
  select sum(b.quantity) from bookings b where b.show_id = s.id and b.status in ('paid', 'reserved')
), 0);

-- ── Staff actions ────────────────────────────────────────────────────────────

-- Records a sale made outside the website. The seats are taken immediately (the website can't sell
-- them again). p_paid = false keeps them reserved until "Mark paid".
create or replace function create_manual_booking(
  p_show_id uuid,
  p_seat_ids text[],
  p_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_paid boolean,
  p_amount_cents integer,
  p_notes text
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
  v_id uuid;
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Enter the buyer''s name.';
  end if;

  select array_agg(distinct s) into v_seats from unnest(p_seat_ids) s;
  if coalesce(array_length(v_seats, 1), 0) = 0 then
    raise exception 'Choose at least one seat.';
  end if;

  select * into v_show from shows where id = p_show_id;
  if not found then
    raise exception 'Show not found.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_show_id::text));

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

  insert into bookings (show_id, quantity, seat_ids, name, email, phone, amount_cents, currency, status, source, notes, created_by)
  values (
    p_show_id, array_length(v_seats, 1), v_seats, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
    coalesce(p_amount_cents, v_show.price_cents * array_length(v_seats, 1)), v_show.currency,
    case when p_paid then 'paid' else 'reserved' end, coalesce(p_source, 'other'), nullif(trim(p_notes), ''), auth.uid()
  )
  returning id into v_id;

  insert into seat_reservations (show_id, seat_id, booking_id, status, expires_at)
  select p_show_id, s, v_id, 'sold', null::timestamptz from unnest(v_seats) s;

  return v_id;
end;
$$;

-- Reserved (unpaid) manual sale → paid
create or replace function mark_booking_paid(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  update bookings set status = 'paid', updated_at = now() where id = p_booking_id and status = 'reserved';
  if not found then
    raise exception 'Only reserved bookings can be marked as paid.';
  end if;
end;
$$;

-- Frees the seats and cancels the booking. Online payments must be refunded in Yoco separately.
create or replace function cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  delete from seat_reservations where booking_id = p_booking_id;
  update bookings set status = 'cancelled', checked_in_at = null, updated_at = now()
  where id = p_booking_id and status in ('paid', 'reserved', 'pending');
end;
$$;

create or replace function set_checked_in(p_booking_id uuid, p_checked_in boolean)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz;
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  update bookings
  set checked_in_at = case when p_checked_in then coalesce(checked_in_at, now()) else null end,
      checked_in_by = case when p_checked_in then auth.uid() else null end
  where id = p_booking_id and status in ('paid', 'reserved')
  returning checked_in_at into v_at;
  if not found then
    raise exception 'Only paid or reserved bookings can be checked in.';
  end if;
  return v_at;
end;
$$;

revoke execute on function create_manual_booking(uuid, text[], text, text, text, text, boolean, integer, text) from public, anon;
revoke execute on function mark_booking_paid(uuid) from public, anon;
revoke execute on function cancel_booking(uuid) from public, anon;
revoke execute on function set_checked_in(uuid, boolean) from public, anon;
grant execute on function create_manual_booking(uuid, text[], text, text, text, text, boolean, integer, text) to authenticated;
grant execute on function mark_booking_paid(uuid) to authenticated;
grant execute on function cancel_booking(uuid) to authenticated;
grant execute on function set_checked_in(uuid, boolean) to authenticated;

-- ── Poster uploads ───────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

create policy "Staff can upload posters" on storage.objects
  for insert to authenticated with check (bucket_id = 'posters' and is_staff());
create policy "Staff can replace posters" on storage.objects
  for update to authenticated using (bucket_id = 'posters' and is_staff());
create policy "Staff can delete posters" on storage.objects
  for delete to authenticated using (bucket_id = 'posters' and is_staff());
