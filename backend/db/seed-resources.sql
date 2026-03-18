-- Seed resources (run after migrations 002, 003)
-- psql -U <user> -d upath_db -f db/seed-resources.sql

\connect upath_db;

-- Run once; re-running may duplicate rows unless you truncate resources first.
INSERT INTO resources (title, description, category, link, industry, education_level, format, location, cost_usd, eligibility_notes)
VALUES
  ('Gates Millennium Scholarship', 'Full scholarship for outstanding minority students with financial need.', 'Scholarships', 'https://example.com/gates', 'Education', 'High School Senior', 'Online', 'US', 0, 'Financial need and strong academics'),
  ('Google Summer Internship', 'Paid summer internship for students interested in technology.', 'Jobs', 'https://example.com/google-intern', 'Technology', 'High School/College', 'Hybrid', 'US', 0, 'Basic coding experience preferred'),
  ('QuestBridge National College Match', 'Connects high-achieving, low-income students with top colleges.', 'College', 'https://example.com/questbridge', 'Education', 'High School Senior', 'Online', 'US', 0, 'Low-income, high academic achievement'),
  ('Year Up Program', 'One-year career development program with internship placement.', 'Jobs', 'https://example.com/yearup', 'Technology', 'High School Graduate', 'In-person', 'US', 0, '18+ and high school diploma or equivalent'),
  ('Dell Scholars Program', 'Scholarship plus support services for students who are Pell-eligible.', 'Scholarships', 'https://example.com/dell-scholars', 'Education', 'High School Senior', 'Online', 'US', 0, 'Pell-eligible students'),
  ('Common App Fee Waivers', 'Apply to college for free if you meet income eligibility.', 'College', 'https://example.com/commonapp', 'Education', 'High School', 'Online', 'US', 0, 'Income eligibility required'),
  ('Microsoft TEALS Program', 'Volunteer-led CS education in underserved high schools.', 'Jobs', 'https://example.com/teals', 'Technology', 'High School', 'In-person', 'US', 0, 'School participation required'),
  ('Jack Kent Cooke Foundation', 'Generous scholarships for high-achieving students with financial need.', 'Scholarships', 'https://example.com/jkcf', 'Education', 'High School Senior', 'Online', 'US', 0, 'High achievement and financial need');
