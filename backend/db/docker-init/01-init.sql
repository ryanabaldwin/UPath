-- UPath database initialization for Docker
-- Runs automatically when the postgres container first starts.
-- The database (upath_db) is already created by POSTGRES_DB env var.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Base schema ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  goalid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pi1 VARCHAR(255) NOT NULL,
  pi2 VARCHAR(255) NOT NULL,
  pi3 VARCHAR(255),
  pi4 VARCHAR(255),
  pi5 VARCHAR(255),
  pi6 VARCHAR(255),
  pi7 VARCHAR(255),
  pi8 VARCHAR(255),
  pi9 VARCHAR(255),
  pi10 VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  ethnicity VARCHAR(100),
  incomebracket INT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  date_of_birth DATE
);

CREATE TABLE IF NOT EXISTS usergoals (
  goalid INT NOT NULL,
  user_id INT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  PRIMARY KEY (goalid, user_id),
  CONSTRAINT fk_usergoals_goal FOREIGN KEY (goalid) REFERENCES goals(goalid) ON DELETE CASCADE,
  CONSTRAINT fk_usergoals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_usergoals_progress_range CHECK (progress >= 0 AND progress <= 100)
);

CREATE TABLE IF NOT EXISTS sponsor (
  sponsor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sponsor_name VARCHAR(200) NOT NULL,
  sponsor_type VARCHAR(100),
  sponsor_image_src VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS mentors (
  mentor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_first VARCHAR(100) NOT NULL,
  mentor_last VARCHAR(100) NOT NULL,
  mentor_region VARCHAR(100),
  mentor_img_src VARCHAR(500),
  specialty VARCHAR(200),
  description TEXT
);

CREATE TABLE IF NOT EXISTS meetings (
  mentor_id BIGINT NOT NULL,
  mentee_id INT NOT NULL,
  "time" TIMESTAMP NOT NULL,
  meetingstatus VARCHAR(100) NOT NULL,
  PRIMARY KEY (mentor_id, mentee_id),
  CONSTRAINT fk_meeting_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Migration 002: student preferences ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT,
  selected_career_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_preferences_user_id ON student_preferences(user_id);

-- ─── Migration 003: resources and bookmarks ───────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  resource_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_bookmarks (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- ─── Migration 004: indexes and constraints ───────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_scheduled_per_mentor
  ON meetings (mentor_id) WHERE meetingstatus = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_usergoals_user_id ON usergoals(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status ON meetings(mentee_id, meetingstatus);

-- ─── Migration 005: resource filters and eligibility ─────────────────────────

ALTER TABLE resources ADD COLUMN IF NOT EXISTS industry VARCHAR(120);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS education_level VARCHAR(120);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS format VARCHAR(120);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS location VARCHAR(120);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS deadline_date DATE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS cost_usd INT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS eligibility_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_resources_industry ON resources(industry);
CREATE INDEX IF NOT EXISTS idx_resources_education_level ON resources(education_level);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources(location);

-- ─── Migration 006: hierarchical milestones ───────────────────────────────────

CREATE TABLE IF NOT EXISTS milestones (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   BIGINT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT NULL,
  tier        VARCHAR(50) NOT NULL CHECK (tier IN ('macro', 'checkpoint', 'domain', 'daily')),
  category    VARCHAR(50) NULL CHECK (category IN ('school', 'work', 'life', 'finance')),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
  due_date    DATE NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_id          ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_parent_id        ON milestones(parent_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_tier_status ON milestones(user_id, tier, status);

-- ─── Seed data ────────────────────────────────────────────────────────────────

INSERT INTO goals (goalid, pi1, pi2, pi3, pi4, pi5, pi6, pi7, pi8, pi9, pi10)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Become a Frontend Engineer', 'Complete HTML/CSS fundamentals', 'Build a React portfolio project', 'Ship and deploy full portfolio site', NULL, NULL, NULL, NULL, NULL, NULL),
  (2, 'Become a Data Analyst', 'Learn SQL basics', 'Build first dashboard', 'Present a data story with findings', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, username, password, role, region, ethnicity, incomebracket, first_name, last_name, email, date_of_birth)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'avery.coleman', 'TEMP_PASSWORD', 'student', 'West', 'Black', 1, 'Avery', 'Coleman', 'avery.coleman@example.com', '2007-05-15'),
  (2, 'jordan.nguyen', 'TEMP_PASSWORD', 'student', 'South', 'Asian', 2, 'Jordan', 'Nguyen', 'jordan.nguyen@example.com', '2006-11-02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usergoals (goalid, user_id, progress)
VALUES
  (1, 1, 33),
  (2, 2, 66)
ON CONFLICT DO NOTHING;

INSERT INTO sponsor (sponsor_name, sponsor_type, sponsor_image_src)
VALUES
  ('PathForward Foundation', 'Nonprofit', 'https://example.com/images/sponsors/pathforward.png'),
  ('TechLift', 'Corporate', 'https://example.com/images/sponsors/techlift.png')
ON CONFLICT DO NOTHING;

INSERT INTO mentors (mentor_first, mentor_last, mentor_region, mentor_img_src, specialty, description)
VALUES
  ('Sarah', 'Johnson', 'West', NULL, 'Software Engineering', 'Senior engineer at a tech company. Passionate about helping underrepresented youth break into tech.'),
  ('Marcus', 'Williams', 'South', NULL, 'Product Management', 'PM lead who grew up in foster care. Knows firsthand the power of mentorship.'),
  ('Priya', 'Patel', 'West', NULL, 'Healthcare', 'Nurse practitioner and first-gen college grad. Loves guiding students through college apps.'),
  ('David', 'Chen', 'West', NULL, 'Computer Engineering', 'Hardware engineer who volunteers with coding bootcamps for youth.'),
  ('Aaliyah', 'Brooks', 'South', NULL, 'Business & Entrepreneurship', 'Small business owner who mentors young entrepreneurs in her community.')
ON CONFLICT DO NOTHING;

INSERT INTO meetings (mentor_id, mentee_id, "time", meetingstatus)
VALUES
  (1, 1, '2026-03-01 10:00:00', 'scheduled'),
  (2, 2, '2026-03-02 14:30:00', 'completed')
ON CONFLICT DO NOTHING;

INSERT INTO resources (title, description, category, link, industry, education_level, format, location, cost_usd, eligibility_notes)
VALUES
  ('Gates Millennium Scholarship', 'Full scholarship for outstanding minority students with financial need.', 'Scholarships', 'https://example.com/gates', 'Education', 'High School Senior', 'Online', 'US', 0, 'Financial need and strong academics'),
  ('Google Summer Internship', 'Paid summer internship for students interested in technology.', 'Jobs', 'https://example.com/google-intern', 'Technology', 'High School/College', 'Hybrid', 'US', 0, 'Basic coding experience preferred'),
  ('QuestBridge National College Match', 'Connects high-achieving, low-income students with top colleges.', 'College', 'https://example.com/questbridge', 'Education', 'High School Senior', 'Online', 'US', 0, 'Low-income, high academic achievement'),
  ('Year Up Program', 'One-year career development program with internship placement.', 'Jobs', 'https://example.com/yearup', 'Technology', 'High School Graduate', 'In-person', 'US', 0, '18+ and high school diploma or equivalent'),
  ('Dell Scholars Program', 'Scholarship plus support services for students who are Pell-eligible.', 'Scholarships', 'https://example.com/dell-scholars', 'Education', 'High School Senior', 'Online', 'US', 0, 'Pell-eligible students'),
  ('Common App Fee Waivers', 'Apply to college for free if you meet income eligibility.', 'College', 'https://example.com/commonapp', 'Education', 'High School', 'Online', 'US', 0, 'Income eligibility required'),
  ('Microsoft TEALS Program', 'Volunteer-led CS education in underserved high schools.', 'Jobs', 'https://example.com/teals', 'Technology', 'High School', 'In-person', 'US', 0, 'School participation required'),
  ('Jack Kent Cooke Foundation', 'Generous scholarships for high-achieving students with financial need.', 'Scholarships', 'https://example.com/jkcf', 'Education', 'High School Senior', 'Online', 'US', 0, 'High achievement and financial need')
ON CONFLICT DO NOTHING;
