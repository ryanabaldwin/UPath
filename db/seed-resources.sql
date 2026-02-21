-- Seed resources (run after migrations 002, 003)
-- psql -U <user> -d upath_db -f db/seed-resources.sql

\connect upath_db;

-- Run once; re-running may duplicate rows unless you truncate resources first.
INSERT INTO resources (title, description, category, link)
VALUES
  ('Gates Millennium Scholarship', 'Full scholarship for outstanding minority students with financial need.', 'Scholarships', 'https://example.com/gates'),
  ('Google Summer Internship', 'Paid summer internship for students interested in technology.', 'Jobs', 'https://example.com/google-intern'),
  ('QuestBridge National College Match', 'Connects high-achieving, low-income students with top colleges.', 'College', 'https://example.com/questbridge'),
  ('Year Up Program', 'One-year career development program with internship placement.', 'Jobs', 'https://example.com/yearup'),
  ('Dell Scholars Program', 'Scholarship plus support services for students who are Pell-eligible.', 'Scholarships', 'https://example.com/dell-scholars'),
  ('Common App Fee Waivers', 'Apply to college for free if you meet income eligibility.', 'College', 'https://example.com/commonapp'),
  ('Microsoft TEALS Program', 'Volunteer-led CS education in underserved high schools.', 'Jobs', 'https://example.com/teals'),
  ('Jack Kent Cooke Foundation', 'Generous scholarships for high-achieving students with financial need.', 'Scholarships', 'https://example.com/jkcf');
