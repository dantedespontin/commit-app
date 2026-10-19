-- Sample programs for development. These schools are made up, so they have no photos;
-- add a photo_url (tennis facility, or the campus) for each real program.
insert into public.programs (school_name, division, conference, state, sport, about, scholarship, min_gpa, min_utr, email_domain) values
  ('Harbor State University', 'NCAA D1', 'Sun Coast Conference', 'Florida', 'tennis', 'Outdoor hard courts year-round, strong international roster.', 'Partial scholarships', 3.0, 11.0, 'harborstate.example.edu'),
  ('Pinecrest College', 'NCAA D2', 'Blue Ridge Athletic Conference', 'North Carolina', 'tennis', 'Small campus with a well-known business school.', 'Partial scholarships', 2.8, 9.0, 'pinecrest.example.edu'),
  ('Northfield College', 'NAIA', 'Heartland Conference', 'Iowa', 'tennis', 'Indoor facility and small class sizes.', 'Partial scholarships', 2.5, 8.0, 'northfield.example.edu'),
  ('Riverbend University', 'NCAA D1', 'Great Rivers Conference', 'Ohio', 'soccer', 'Plays a high press. New stadium opened in 2025.', 'Partial scholarships', 3.0, null, 'riverbend.example.edu'),
  ('Coastal Plains College', 'NJCAA', 'Gulf Region', 'Texas', 'soccer', 'Two-year college, a common route to a D1 transfer.', 'Full scholarships', 2.0, null, 'coastalplains.example.edu'),
  ('Granite Hill University', 'NCAA D2', 'Rocky Mountain Conference', 'Colorado', 'soccer', 'Mountain campus with engineering and pre-med programs.', 'Partial scholarships', 2.8, null, 'granitehill.example.edu');
