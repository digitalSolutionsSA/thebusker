-- "Gert / The Busker": marks a booking whose customer was referred by Busker management, so Sales & stats
-- can show what came in through the website on its own. Staff tick it on a manual booking (or on any
-- booking from Edit, also online ones where management sent the customer to the website).
alter table bookings add column if not exists referred_by_management boolean not null default false;

create or replace function set_booking_referral(p_booking_id uuid, p_referred boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'Not allowed';
  end if;
  update bookings set referred_by_management = coalesce(p_referred, false) where id = p_booking_id;
  if not found then
    raise exception 'Booking not found.';
  end if;
end;
$$;

revoke all on function set_booking_referral(uuid, boolean) from public, anon;
grant execute on function set_booking_referral(uuid, boolean) to authenticated;
