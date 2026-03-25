-- Seed resources (run after migrations 002, 003, 005)
-- psql -U <user> -d upath_db -f db/seed-resources.sql

\connect upath_db;

TRUNCATE resources RESTART IDENTITY CASCADE;

INSERT INTO resources (title, description, category, link, industry, education_level, format, location, cost_usd, eligibility_notes)
VALUES
  -- Scholarships
  ('Gates Millennium Scholarship', 'Full scholarship for outstanding minority students with financial need.', 'Scholarships', '#', 'Social Impact', 'High School Senior', 'Online', 'US', 0, 'Financial need and strong academics'),
  ('Dell Scholars Program', 'Scholarship plus support services for students who are Pell-eligible.', 'Scholarships', '#', 'Technology', 'High School Senior', 'Online', 'US', 0, 'Pell-eligible students'),
  ('Jack Kent Cooke Foundation', 'Generous scholarships for high-achieving students with financial need.', 'Scholarships', '#', 'Education', 'High School Senior', 'Online', 'US', 0, 'High achievement and financial need'),
  ('NIH Undergraduate Scholarship Program', 'Scholarship and paid research training for students committed to careers in health-related research.', 'Scholarships', '#', 'Healthcare', 'High School Senior', 'Hybrid', 'US', 0, 'Commitment to biomedical research career'),
  ('YoungArts Award', 'Recognition and financial awards for high school artists in visual, literary, and performing arts.', 'Scholarships', '#', 'Arts & Creative', 'High School', 'Online', 'US', 0, 'US citizen or permanent resident, ages 15-18'),
  ('Goldman Sachs MBA Fellowship (undergrad pipeline)', 'Merit scholarship for undergraduates interested in business and finance careers.', 'Scholarships', '#', 'Business & Finance', 'College', 'Online', 'US', 0, 'Merit-based'),
  ('Society of Women Engineers Scholarships', 'Multiple awards for women pursuing engineering or computer science degrees.', 'Scholarships', '#', 'Engineering', 'High School Senior', 'Online', 'US', 0, 'Women pursuing engineering or CS'),
  ('Horatio Alger National Scholarship', 'Scholarships for students who have overcome adversity and show strong commitment to education.', 'Scholarships', '#', 'Social Impact', 'High School Senior', 'Online', 'US', 0, 'Demonstrated adversity and perseverance'),

  -- Internships
  ('Google Summer of Code', 'Stipend-based open-source coding program with mentoring organizations worldwide.', 'Internships', '#', 'Technology', 'College', 'Remote', 'International', 0, 'Open source contribution interest'),
  ('Year Up', 'One-year career development program with internship placement at major employers.', 'Internships', '#', 'Business & Finance', 'High School Graduate', 'In-person', 'US', 0, '18-29, high school diploma or GED'),
  ('Kaiser Permanente Health Scholars Internship', 'Summer experience in clinical and community health settings for aspiring healthcare professionals.', 'Internships', '#', 'Healthcare', 'High School', 'In-person', 'US', 0, 'Interest in healthcare careers'),
  ('Smithsonian Institution Internships', 'Museum, education, and public history projects for students passionate about culture and learning.', 'Internships', '#', 'Arts & Creative', 'High School', 'Hybrid', 'US', 0, 'Interest in arts, culture, or education'),
  ('NASA Internship Program', 'STEM internships at NASA centers for high school through graduate students.', 'Internships', '#', 'Engineering', 'High School', 'In-person', 'US', 0, 'US citizen, GPA 3.0+'),
  ('Bank of America Student Leaders', 'Paid summer internship with a nonprofit plus leadership summit for community-minded students.', 'Internships', '#', 'Business & Finance', 'High School Junior/Senior', 'In-person', 'US', 0, 'Community involvement required'),
  ('CodePath Summer Internship Accelerator', 'Technical interview prep and referral network for software engineering internships.', 'Internships', '#', 'Technology', 'College', 'Remote', 'US', 0, 'CS or related major'),

  -- Jobs
  ('Microsoft TEALS (Teaching)', 'Volunteer or paid pathways to help teach computer science in high schools.', 'Jobs', '#', 'Technology', 'College/Professional', 'In-person', 'US', 0, 'CS background'),
  ('AmeriCorps City Year', 'Full-time service in schools supporting student success and college readiness.', 'Jobs', '#', 'Education', 'High School Graduate', 'In-person', 'US', 0, '17+, high school diploma'),
  ('Community Health Worker Trainee Program', 'Entry-level roles with training for outreach, navigation, and wellness education.', 'Jobs', '#', 'Healthcare', 'High School Graduate', 'In-person', 'US', 0, 'No prior experience required'),
  ('Target Store Leadership Development', 'Hourly-to-management pathways with benefits and flexible scheduling for students.', 'Jobs', '#', 'Business & Finance', 'High School', 'In-person', 'US', 0, '16+'),
  ('Junior Studio Assistant (Creative Guild)', 'Apprentice-style roles in design, media, and production for emerging creatives.', 'Jobs', '#', 'Arts & Creative', 'High School Graduate', 'In-person', 'US', 0, 'Portfolio preferred'),
  ('Lab Technician Trainee (Regional Hospital)', 'On-the-job training for specimen processing and lab support with certification support.', 'Jobs', '#', 'Healthcare', 'High School Graduate', 'In-person', 'US', 0, 'High school diploma or GED'),
  ('Pre-Apprenticeship in Advanced Manufacturing', 'Paid introduction to machining, robotics maintenance, and safety for industrial careers.', 'Jobs', '#', 'Engineering', 'High School Graduate', 'In-person', 'US', 0, 'High school diploma or GED'),

  -- College
  ('QuestBridge National College Match', 'Connects high-achieving, low-income students with full four-year scholarships at partner colleges.', 'College', '#', 'Education', 'High School Senior', 'Online', 'US', 0, 'Low-income, high academic achievement'),
  ('Common App Fee Waivers', 'Apply to college for free if you meet income eligibility guidelines.', 'College', '#', 'Education', 'High School Senior', 'Online', 'US', 0, 'Income eligibility required'),
  ('TRIO Upward Bound', 'Free tutoring, college visits, and summer programs for first-gen and low-income students.', 'College', '#', 'Education', 'High School', 'In-person', 'US', 0, 'First-gen or low-income'),
  ('Posse Foundation', 'Full-tuition leadership scholarship with cohort support at partner universities.', 'College', '#', 'Social Impact', 'High School Senior', 'In-person', 'US', 0, 'Leadership potential, nominated by school'),
  ('College Board BigFuture', 'Free planning tools for majors, careers, SAT fee waivers, and scholarship search.', 'College', '#', 'Education', 'High School', 'Online', 'US', 0, 'Open to all'),
  ('NCSSM / State STEM Residential Programs', 'Information on competitive public STEM high schools and dual-enrollment pathways.', 'College', '#', 'Science & Research', 'High School', 'In-person', 'US', 0, 'Competitive admission'),
  ('National Portfolio Day Association', 'Free reviews and guidance for students applying to art and design colleges.', 'College', '#', 'Arts & Creative', 'High School Senior', 'In-person', 'US', 0, 'Open to all art/design applicants'),
  ('AAMC Aspiring Docs', 'Resources on pre-med coursework, MCAT timing, and pathways into medicine.', 'College', '#', 'Healthcare', 'High School', 'Online', 'US', 0, 'Open to all pre-med aspiring students');
