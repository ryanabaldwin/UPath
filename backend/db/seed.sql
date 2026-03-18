-- PostgreSQL seed data for UPath
-- Run schema first, then:
--   psql -U <user> -d upath_db -f db/seed.sql

\connect upath_db;

INSERT INTO goals (goalid, pi1, pi2, pi3, pi4, pi5, pi6, pi7, pi8, pi9, pi10)
OVERRIDING SYSTEM VALUE
VALUES
  (
    1,
    'Become a Frontend Engineer',
    'Complete HTML/CSS fundamentals',
    'Build a React portfolio project',
    'Ship and deploy full portfolio site',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    2,
    'Become a Data Analyst',
    'Learn SQL basics',
    'Build first dashboard',
    'Present a data story with findings',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );

INSERT INTO users (
  id,
  username,
  password,
  role,
  region,
  ethnicity,
  incomebracket,
  first_name,
  last_name,
  email,
  date_of_birth
)
OVERRIDING SYSTEM VALUE
VALUES
  (
    1,
    'avery.coleman',
    'TEMP_PASSWORD',
    'student',
    'West',
    'Black',
    1,
    'Avery',
    'Coleman',
    'avery.coleman@example.com',
    '2007-05-15'
  ),
  (
    2,
    'jordan.nguyen',
    'TEMP_PASSWORD',
    'student',
    'South',
    'Asian',
    2,
    'Jordan',
    'Nguyen',
    'jordan.nguyen@example.com',
    '2006-11-02'
  );

INSERT INTO usergoals (
  goalid,
  user_id,
  progress
)
VALUES
  (1, 1, 33),
  (2, 2, 66);

INSERT INTO sponsor (sponsor_name, sponsor_type, sponsor_image_src)
VALUES
  ('PathForward Foundation', 'Nonprofit', 'https://example.com/images/sponsors/pathforward.png'),
  ('TechLift', 'Corporate', 'https://example.com/images/sponsors/techlift.png');

INSERT INTO mentors (mentor_first, mentor_last, mentor_region, mentor_img_src, specialty, description)
VALUES
  ('Sarah', 'Johnson', 'West', NULL, 'Software Engineering', 'Senior engineer at a tech company. Passionate about helping underrepresented youth break into tech.'),
  ('Marcus', 'Williams', 'South', NULL, 'Product Management', 'PM lead who grew up in foster care. Knows firsthand the power of mentorship.'),
  ('Priya', 'Patel', 'West', NULL, 'Healthcare', 'Nurse practitioner and first-gen college grad. Loves guiding students through college apps.'),
  ('David', 'Chen', 'West', NULL, 'Computer Engineering', 'Hardware engineer who volunteers with coding bootcamps for youth.'),
  ('Aaliyah', 'Brooks', 'South', NULL, 'Business & Entrepreneurship', 'Small business owner who mentors young entrepreneurs in her community.');

INSERT INTO meetings (mentor_id, mentee_id, "time", meetingstatus)
VALUES
  (1, 1, '2026-03-01 10:00:00', 'scheduled'),
  (2, 2, '2026-03-02 14:30:00', 'completed');
