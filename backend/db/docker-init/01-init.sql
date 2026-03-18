-- UPath database initialization for Docker
-- Runs automatically when the postgres container first starts.
-- The database (upath_db) is already created by POSTGRES_DB env var.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Base schema ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  goal_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  milestone1 VARCHAR(255),
  milestone2 VARCHAR(255),
  milestone_n VARCHAR(255),
  image1_src VARCHAR(500),
  image_n_src VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_first VARCHAR(100) NOT NULL,
  user_last VARCHAR(100) NOT NULL,
  user_region VARCHAR(100),
  goal_id BIGINT REFERENCES goals(goal_id),
  user_img_src VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS progressstatus (
  id UUID NOT NULL,
  goal_id BIGINT NOT NULL,
  milestone1_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  milestone2_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  milestone_n_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id, goal_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_goal FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
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
  mentee_id UUID NOT NULL,
  "time" TIMESTAMP NOT NULL,
  meetingstatus VARCHAR(100) NOT NULL,
  PRIMARY KEY (mentor_id, mentee_id),
  CONSTRAINT fk_meeting_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Migration 001: mentor fields (already in schema above, idempotent) ─────

ALTER TABLE mentors ADD COLUMN IF NOT EXISTS specialty VARCHAR(200);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── Migration 002: student preferences ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS student_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT,
  selected_career_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_preferences_user_id ON student_preferences(user_id);

-- ─── Migration 003: resources and bookmarks ──────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  resource_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- ─── Migration 004: indexes and constraints ──────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_scheduled_per_mentor
  ON meetings (mentor_id) WHERE meetingstatus = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_progressstatus_id ON progressstatus(id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status ON meetings(mentee_id, meetingstatus);

-- ─── Migration 005: resource filters and eligibility ────────────────────────

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

-- ─── Migration 006: hierarchical milestones + north star ────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS north_star_vision TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS definition_of_success TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_grade_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS milestones (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_milestones_user_id           ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_parent_id         ON milestones(parent_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_tier_status  ON milestones(user_id, tier, status);

-- ─── Seed data ───────────────────────────────────────────────────────────────

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
  )
ON CONFLICT DO NOTHING;

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
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO progressstatus (id, goal_id, milestone1_is_complete, milestone2_is_complete, milestone_n_is_complete)
VALUES
  ('11111111-1111-1111-1111-111111111111', 1, TRUE, FALSE, FALSE),
  ('22222222-2222-2222-2222-222222222222', 2, TRUE, TRUE, FALSE)
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
  (1, '11111111-1111-1111-1111-111111111111', '2026-03-01 10:00:00', 'scheduled'),
  (2, '22222222-2222-2222-2222-222222222222', '2026-03-02 14:30:00', 'completed')
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
