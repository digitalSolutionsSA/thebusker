-- When the ticket confirmation (customer + management copy) was emailed via Resend.
-- The Yoco webhook claims this column before sending, so a redelivered event never emails twice.
alter table bookings add column if not exists confirmation_emailed_at timestamptz;
