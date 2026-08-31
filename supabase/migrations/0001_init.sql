-- Shows / events that can be booked
create table if not exists shows (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  artist text not null,
  description text not null default '',
  date date not null,
  doors_time text not null default '19:00',
  image_url text,
  price_cents integer not null,
  currency text not null default 'ZAR',
  capacity integer not null default 100,
  tickets_sold integer not null default 0,
  category text not null default 'live-music' check (category in ('live-music', 'bok-town', 'special')),
  stripe_price_id text,
  created_at timestamptz not null default now()
);

-- Bookings created when a customer starts checkout
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references shows(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  name text not null,
  email text not null,
  phone text not null,
  amount_cents integer not null,
  currency text not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_show_id_idx on bookings(show_id);
create index if not exists bookings_status_idx on bookings(status);

alter table shows enable row level security;
alter table bookings enable row level security;

-- Public can read shows (needed for the shows listing page)
create policy "Public can view shows" on shows
  for select using (true);

-- Bookings are written only via the service-role edge functions; no public access.
-- (No insert/select/update policies for anon/authenticated roles.)

-- Keep tickets_sold in sync when a booking is confirmed paid
create or replace function increment_tickets_sold()
returns trigger as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update shows set tickets_sold = tickets_sold + new.quantity where id = new.show_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger bookings_mark_paid
  after update on bookings
  for each row execute function increment_tickets_sold();

-- Seed demo shows
insert into shows (slug, title, artist, description, date, doors_time, price_cents, currency, capacity, category)
values
  ('jp-dix-live', 'Live Music: JP Dix', 'JP Dix', 'An intimate night of acoustic favourites and busker classics on the main stage.', current_date + interval '6 days', '19:00', 15000, 'ZAR', 150, 'live-music'),
  ('leo-sonskyn', 'Live Music: Leo Sonskyn', 'Leo Sonskyn', 'Sunset sessions on the Busker terrace — good tunes, cold taps, great company.', current_date + interval '13 days', '14:30', 10000, 'ZAR', 150, 'live-music'),
  ('springboks-vs-wales-big-screen', 'Springboks vs Wales — Big Screen', 'Bok Town Screening', 'Turning V-Town into Bok Town. Watch the Boks live on our big screen with a platter, Castle Double Malt & Springbokkie included.', current_date + interval '20 days', '17:40', 25000, 'ZAR', 300, 'bok-town')
on conflict (slug) do nothing;
