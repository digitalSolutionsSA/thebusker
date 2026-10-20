-- Staff can correct a booking from the guest list: contact details and notes on any booking, and on
-- bookings added by hand also where it was sold, the amount and paid / not paid yet.
-- Online bookings were paid through Yoco, so their source, amount and status stay as they are.
-- Seats aren't changed here: cancel the booking and add a new one instead.
create or replace function update_booking(
  p_booking_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_notes text,
  p_source text default null,
  p_paid boolean default null,
  p_amount_cents integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings;
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Enter the guest''s name.';
  end if;

  select * into b from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  if b.status not in ('paid', 'reserved') then
    raise exception 'Only paid or reserved bookings can be edited.';
  end if;

  if b.source = 'online' then
    update bookings
    set name = trim(p_name), phone = nullif(trim(p_phone), ''), email = nullif(trim(p_email), ''),
        notes = nullif(trim(p_notes), ''), updated_at = now()
    where id = b.id;
    return;
  end if;

  if p_source = 'online' then
    raise exception 'Bookings added by hand can''t be marked as website sales.';
  end if;
  if p_amount_cents is not null and p_amount_cents < 0 then
    raise exception 'Enter the amount in rand.';
  end if;

  update bookings
  set name = trim(p_name), phone = nullif(trim(p_phone), ''), email = nullif(trim(p_email), ''),
      notes = nullif(trim(p_notes), ''),
      source = coalesce(p_source, source),
      amount_cents = coalesce(p_amount_cents, amount_cents),
      status = case when p_paid is null then status when p_paid then 'paid' else 'reserved' end,
      updated_at = now()
  where id = b.id;
end;
$$;

revoke execute on function update_booking(uuid, text, text, text, text, text, boolean, integer) from public, anon;
grant execute on function update_booking(uuid, text, text, text, text, text, boolean, integer) to authenticated;
