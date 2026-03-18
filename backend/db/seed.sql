-- PostgreSQL seed data for UPath
-- Run schema first, then:
--   psql -U <user> -d upath_db -f db/seed.sql

\connect upath_db;

INSERT INTO goals (title, milestone1, milestone2, milestone_n, image1_src, image_n_src)
VALUES
  (
    'Become a Frontend Engineer',
    'Complete HTML/CSS fundamentals',
    'Build a React portfolio project',
    'Ship and deploy full portfolio site',
    'https://example.com/images/goal-frontend-1.png',
    'https://example.com/images/goal-frontend-n.png'
  ),
  (
    'Become a Data Analyst',
    'Learn SQL basics',
    'Build first dashboard',
    'Present a data story with findings',
    'https://example.com/images/goal-analyst-1.png',
    'https://example.com/images/goal-analyst-n.png'
  );

INSERT INTO users (id, user_first, user_last, user_region, goal_id, user_img_src)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Avery',
    'Coleman',
    'West',
    1,
    'https://example.com/images/users/avery.png'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Jordan',
    'Nguyen',
    'South',
    2,
    'https://example.com/images/users/jordan.png'
  );

INSERT INTO progressstatus (
  id,
  goal_id,
  milestone1_is_complete,
  milestone2_is_complete,
  milestone_n_is_complete
)
VALUES
  ('11111111-1111-1111-1111-111111111111', 1, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 2, TRUE, TRUE, FALSE);

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
  (1, '11111111-1111-1111-1111-111111111111', '2026-03-01 10:00:00', 'scheduled'),
  (2, '22222222-2222-2222-2222-222222222222', '2026-03-02 14:30:00', 'completed');
