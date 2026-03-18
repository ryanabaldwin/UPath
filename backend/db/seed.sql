-- PostgreSQL seed data for UPath (ERD-aligned schema)
-- Run schema + all migrations first, then:
--   psql -U <user> -d upath_db -f backend/db/seed.sql

\connect upath_db;

INSERT INTO goals (goalid, pi1, pi2, pi3, pi4, pi5)
OVERRIDING SYSTEM VALUE
VALUES
  (
    1,
    'Become a Frontend Engineer',
    'Complete HTML/CSS fundamentals',
    'Build a React portfolio project',
    'Ship and deploy full portfolio site',
    NULL
  ),
  (
    2,
    'Become a Data Analyst',
    'Learn SQL basics',
    'Build first dashboard',
    'Present a data story with findings',
    NULL
  );

SELECT setval(pg_get_serial_sequence('goals', 'goalid'), (SELECT MAX(goalid) FROM goals));

INSERT INTO users (id, username, password, role, region, ethnicity, incomebracket, first_name, last_name, email)
OVERRIDING SYSTEM VALUE
VALUES
  (
    1,
    'avery_coleman',
    'DEMO_NO_LOGIN',
    'student',
    'West',
    'unspecified',
    0,
    'Avery',
    'Coleman',
    'avery.coleman@example.com'
  ),
  (
    2,
    'jordan_nguyen',
    'DEMO_NO_LOGIN',
    'student',
    'South',
    'unspecified',
    0,
    'Jordan',
    'Nguyen',
    'jordan.nguyen@example.com'
  );

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));

INSERT INTO usergoals (goalid, user_id, progress)
VALUES
  (1, 1, 33),
  (2, 2, 66);

INSERT INTO sponsor (sponsor_name, sponsor_type, sponsor_image_src)
VALUES
  ('PathForward Foundation', 'Nonprofit',  'https://example.com/images/sponsors/pathforward.png'),
  ('TechLift',               'Corporate',  'https://example.com/images/sponsors/techlift.png');

INSERT INTO mentors (mentor_first, mentor_last, mentor_region, mentor_img_src, specialty, description)
VALUES
  ('Sarah',  'Johnson', 'West',  NULL, 'Software Engineering',       'Senior engineer at a tech company. Passionate about helping underrepresented youth break into tech.'),
  ('Marcus', 'Williams','South', NULL, 'Product Management',         'PM lead who grew up in foster care. Knows firsthand the power of mentorship.'),
  ('Priya',  'Patel',   'West',  NULL, 'Healthcare',                 'Nurse practitioner and first-gen college grad. Loves guiding students through college apps.'),
  ('David',  'Chen',    'West',  NULL, 'Computer Engineering',       'Hardware engineer who volunteers with coding bootcamps for youth.'),
  ('Aaliyah','Brooks',  'South', NULL, 'Business & Entrepreneurship','Small business owner who mentors young entrepreneurs in her community.');

INSERT INTO meetings (mentor_id, mentee_id, "time", meetingstatus)
VALUES
  (1, 1, '2026-03-01 10:00:00', 'scheduled'),
  (2, 2, '2026-03-02 14:30:00', 'completed');
