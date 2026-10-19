-- Sample programs for development. These schools are made up, so they have no photos;
-- add a photo_url (tennis facility, or the campus) for each real program.
insert into public.programs (school_name, division, conference, state, sport, about, scholarship, min_gpa, min_utr, cost_of_attendance, max_athletic_pct, email_domain) values
  ('Harbor State University', 'NCAA D1', 'Sun Coast Conference', 'Florida', 'tennis', 'Outdoor hard courts year-round, strong international roster.', 'Partial scholarships', 3.0, 11.0, 48000, 100, 'harborstate.example.edu'),
  ('Pinecrest College', 'NCAA D2', 'Blue Ridge Athletic Conference', 'North Carolina', 'tennis', 'Small campus with a well-known business school.', 'Partial scholarships', 2.8, 9.0, 36000, 75, 'pinecrest.example.edu'),
  ('Northfield College', 'NAIA', 'Heartland Conference', 'Iowa', 'tennis', 'Indoor facility and small class sizes.', 'Partial scholarships', 2.5, 8.0, 32000, 75, 'northfield.example.edu'),
  ('Riverbend University', 'NCAA D1', 'Great Rivers Conference', 'Ohio', 'soccer', 'Plays a high press. New stadium opened in 2025.', 'Partial scholarships', 3.0, null, 52000, 75, 'riverbend.example.edu'),
  ('Coastal Plains College', 'NJCAA', 'Gulf Region', 'Texas', 'soccer', 'Two-year college, a common route to a D1 transfer.', 'Full scholarships', 2.0, null, 18000, 100, 'coastalplains.example.edu'),
  ('Granite Hill University', 'NCAA D2', 'Rocky Mountain Conference', 'Colorado', 'soccer', 'Mountain campus with engineering and pre-med programs.', 'Partial scholarships', 2.8, null, 40000, 50, 'granitehill.example.edu');

insert into public.programs (school_name, division, conference, state, sport, about, scholarship, min_gpa, max_scoring_avg, cost_of_attendance, max_athletic_pct, email_domain) values
  ('Harbor State University', 'NCAA D1', 'Sun Coast Conference', 'Florida', 'golf', 'Practice at a private 18-hole course ten minutes from campus.', 'Partial scholarships', 3.0, 74.0, 48000, 100, 'harborstate.example.edu'),
  ('Prairie Wind College', 'NAIA', 'Heartland Conference', 'Kansas', 'golf', 'Small program that travels to spring events in Arizona.', 'Partial scholarships', 2.5, 79.0, 30000, 75, 'prairiewind.example.edu');
insert into public.programs (school_name, division, conference, state, sport, about, scholarship, min_gpa, cost_of_attendance, max_athletic_pct, email_domain) values
  ('Riverbend University', 'NCAA D1', 'Great Rivers Conference', 'Ohio', 'basketball', 'Plays fast in a 9,000-seat arena.', 'Full scholarships', 3.0, 52000, 100, 'riverbend.example.edu'),
  ('Coastal Plains College', 'NJCAA', 'Gulf Region', 'Texas', 'basketball', 'Two-year route to a D1 transfer, with many international players.', 'Full scholarships', 2.0, 18000, 100, 'coastalplains.example.edu'),
  ('Lakeshore University', 'NCAA D1', 'Great Lakes Conference', 'Michigan', 'swimming', 'Olympic-size pool and a strong distance group.', 'Partial scholarships', 3.3, 56000, 75, 'lakeshore.example.edu'),
  ('Pinecrest College', 'NCAA D2', 'Blue Ridge Athletic Conference', 'North Carolina', 'swimming', 'Sprint-focused team that trains in a new 25-yard pool.', 'Partial scholarships', 2.8, 36000, 50, 'pinecrest.example.edu');
