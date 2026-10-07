-- The Busker's real upcoming shows (October 2026), from the posters in public/SHOWS.
-- capacity is set to the full seating plan by 0004.
insert into shows (slug, title, artist, description, date, doors_time, image_url, price_cents, currency, capacity, category)
values
  ('club-night', 'Club Night', 'CMRN · Eduano · Kay · Primo',
   'A night on the decks with CMRN, Eduano, Kay and Primo. Starts at 19:00 — R50 entrance.',
   '2026-10-02', '19:00', '/images/posters/club-night.webp', 5000, 'ZAR', 200, 'special'),
  ('celine-dion-by-mirandi', 'Céline Dion by Mirandi', 'Mirandi',
   'Artistique Productions presents an unforgettable evening of timeless Céline Dion hits, performed by Mirandi. Doors at 19:00, show at 19:30. Tickets are also available at Local Choice Euro Pharmacy or on WhatsApp: 083 716 5495.',
   '2026-10-30', '19:00', '/images/posters/celine-dion-by-mirandi.webp', 15000, 'ZAR', 200, 'live-music'),
  ('dirk-van-der-westhuizen', 'Dirk van der Westhuizen', 'Dirk van der Westhuizen',
   'The Busker and CinPic Entertainment present Dirk van der Westhuizen live. Starts at 20:00. Enquiries: 082 852 6335.',
   '2026-10-03', '20:00', '/images/posters/dirk-van-der-westhuizen.webp?v=2', 16000, 'ZAR', 200, 'live-music'),
  ('gerhard-steyn-liezel-pieters', 'Gerhard Steyn & Liezel Pieters', 'Gerhard Steyn & Liezel Pieters',
   'Gerhard Steyn and Liezel Pieters live at The Busker. Starts at 20:00.',
   '2026-10-31', '20:00', '/images/posters/gerhard-steyn-liezel-pieters.webp', 25000, 'ZAR', 200, 'live-music')
on conflict (slug) do update set
  title = excluded.title, artist = excluded.artist, description = excluded.description, date = excluded.date,
  doors_time = excluded.doors_time, image_url = excluded.image_url, price_cents = excluded.price_cents,
  category = excluded.category;
