-- Seed careers (run after migration 009)
-- psql -U <user> -d upath_db -f db/seed-careers.sql

\connect upath_db;

TRUNCATE careers RESTART IDENTITY;

INSERT INTO careers (title, description, category, average_salary, career_path_key)
VALUES
  ('Software Engineer',         'Design and build applications, websites, and systems.',                             'Software Development',        90000, 'software-development'),
  ('Nurse',                      'Provide care and support to patients in healthcare settings.',                       'Healthcare',                  70000, 'healthcare'),
  ('Product Manager',            'Guide product development and work with teams to build solutions.',                  'Product Management',           85000, 'product-management'),
  ('Electrician',                'Install and repair electrical systems in homes and buildings.',                      'Trades & Technical Skills',   60000, 'trades-technical'),
  ('Computer Hardware Engineer', 'Design and test computer hardware like processors, circuit boards, and devices.',    'Computer Engineering',         95000, 'computer-engineering'),
  ('Entrepreneur',               'Start and run your own business, turning ideas into real products or services.',     'Business & Entrepreneurship',  60000, 'business-entrepreneurship'),
  ('Teacher',                    'Educate and inspire students in subjects like math, science, or language arts.',     'Education',                   55000, 'education'),
  ('Graphic Designer',           'Create visual content like logos, websites, and social media graphics.',             'Creative Arts & Design',       50000, 'creative-arts-design'),
  ('Environmental Scientist',    'Study the environment and help solve problems like pollution and climate change.',    'Science',                     65000, 'science'),
  ('Data Analyst',               'Turn data into insights to guide decisions in business, science, or public policy.', 'Data & Analytics',             72000, 'data-analytics');
