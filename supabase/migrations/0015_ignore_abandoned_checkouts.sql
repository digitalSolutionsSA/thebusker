-- Same as 0008, except abandoned online checkouts (status 'pending' whose 15-minute hold ran out)
-- no longer stop a show from switching between seating plan and general admission. Paid and
-- reserved bookings still do, and so does a checkout that is still in progress.
create or replace function guard_show_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.seating is distinct from old.seating and exists (
    select 1 from bookings b
    where b.show_id = old.id
      and (
        b.status in ('paid', 'reserved')
        or (
          b.status = 'pending'
          and (
            -- general admission checkout still holding tickets
            b.hold_expires_at > now()
            -- seat-map checkout still holding seats
            or exists (
              select 1 from seat_reservations r
              where r.booking_id = b.id and r.status = 'held' and r.expires_at > now()
            )
          )
        )
      )
  ) then
    raise exception 'This show already has bookings, so its seating type can''t be changed.';
  end if;
  if new.seating = 'general' and new.capacity < old.tickets_sold then
    raise exception 'You''ve already sold % tickets, so the limit can''t be lower than that.', old.tickets_sold;
  end if;
  return new;
end;
$$;
