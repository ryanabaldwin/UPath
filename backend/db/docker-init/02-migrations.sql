-- Add specialty and description columns to mentors table
-- Run after schema.sql for fresh installs, or standalone for existing DBs:
--   psql -U <user> -d upath_db -f db/migrations/001_add_mentor_fields.sql

ALTER TABLE mentors ADD COLUMN IF NOT EXISTS specialty VARCHAR(200);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS description TEXT;
-- Student preferences for Explore/career matching (persist interests and selected paths per user)
-- Run: psql -U <user> -d upath_db -f db/migrations/002_student_preferences.sql

CREATE TABLE IF NOT EXISTS student_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT,
  selected_career_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_preferences_user_id ON student_preferences(user_id);

COMMENT ON TABLE student_preferences IS 'Stores Explore page selections and free-text interests per student (demo or future auth).';
-- Resources (scholarships, jobs, college) and per-user bookmarks
-- Run: psql -U <user> -d upath_db -f db/migrations/003_resources_and_bookmarks.sql

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

COMMENT ON TABLE resources IS 'Scholarships, jobs, college info—replaces static mock on Resources page.';
COMMENT ON TABLE resource_bookmarks IS 'Per-user saved resources.';
-- Indexes and constraints for performance and data integrity
-- Run: psql -U <user> -d upath_db -f db/migrations/004_indexes_and_constraints.sql

-- One scheduled meeting per mentor (prevent double-booking same mentor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_scheduled_per_mentor
  ON meetings (mentor_id) WHERE meetingstatus = 'scheduled';

-- Lookup progress by user (only exists on legacy schema with progressstatus table)
DO $$
BEGIN
  IF to_regclass('public.progressstatus') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_progressstatus_id ON progressstatus(id);
  END IF;
END $$;

-- Lookup meetings by mentee for "My sessions"
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status ON meetings(mentee_id, meetingstatus);
-- Add resource filtering + eligibility metadata for grounded recommendations
-- Run: psql -U <user> -d upath_db -f db/migrations/005_resources_filters_and_eligibility.sql

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
-- Hierarchical milestones + user north-star fields
-- Run: psql -U <user> -d upath_db -f db/migrations/006_hierarchical_milestones.sql

-- Extend users with long-term vision fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS north_star_vision TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS definition_of_success TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_grade_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0;

-- Hierarchical milestones tree
-- tier:     macro (long-term goal), checkpoint (medium phase), domain (life area group), daily (actionable step)
-- category: school, work, life, finance
-- status:   pending, in_progress, complete, skipped
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

CREATE INDEX IF NOT EXISTS idx_milestones_user_id       ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_parent_id     ON milestones(parent_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_tier_status ON milestones(user_id, tier, status);
-- ERD alignment migration
-- Converts the legacy UUID/old-column schema to the ERD-aligned INT schema.
-- When using the updated schema.sql (v2+) the database starts already aligned,
-- so this migration is a no-op (detected by the presence of users.first_name).
--
-- Run: psql -U <user> -d upath_db -f backend/db/migrations/007_erd_alignment_users_goals_usergoals.sql

DO $migration$
DECLARE
  v_already_aligned boolean;
BEGIN
  -- Detect new schema: users has first_name instead of user_first
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'first_name'
  ) INTO v_already_aligned;

  IF v_already_aligned THEN
    RAISE NOTICE 'Migration 007: schema already ERD-aligned, skipping.';
    RETURN;
  END IF;

  -- ── Legacy migration (old UUID schema → ERD INT schema) ─────────────────

  IF to_regclass('public.users') IS NULL OR to_regclass('public.goals') IS NULL THEN
    RAISE EXCEPTION 'Expected legacy users/goals tables to exist before running ERD alignment.';
  END IF;

  DROP TABLE IF EXISTS _user_id_map;
  CREATE TABLE _user_id_map (
    old_user_id UUID PRIMARY KEY,
    new_user_id INT  NOT NULL UNIQUE
  );

  DROP TABLE IF EXISTS _goal_id_map;
  CREATE TABLE _goal_id_map (
    old_goal_id BIGINT PRIMARY KEY,
    new_goal_id INT    NOT NULL UNIQUE
  );

  EXECUTE 'ALTER TABLE IF EXISTS progressstatus RENAME TO progressstatus_legacy';
  EXECUTE 'ALTER TABLE users RENAME TO users_legacy';
  EXECUTE 'ALTER TABLE goals RENAME TO goals_legacy';

  CREATE TABLE goals (
    goalid INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    pi1    VARCHAR(255) NOT NULL,
    pi2    VARCHAR(255) NOT NULL,
    pi3    VARCHAR(255),
    pi4    VARCHAR(255),
    pi5    VARCHAR(255),
    pi6    VARCHAR(255),
    pi7    VARCHAR(255),
    pi8    VARCHAR(255),
    pi9    VARCHAR(255),
    pi10   VARCHAR(255)
  );

  INSERT INTO goals (goalid, pi1, pi2, pi3, pi4, pi5, pi6, pi7, pi8, pi9, pi10)
  OVERRIDING SYSTEM VALUE
  SELECT
    g.goal_id::INT,
    COALESCE(g.title,       'Unknown Goal'),
    COALESCE(g.milestone1,  'Not Set'),
    g.milestone2,
    g.milestone_n,
    NULL, NULL, NULL, NULL, NULL, NULL
  FROM goals_legacy g
  ORDER BY g.goal_id;

  INSERT INTO _goal_id_map (old_goal_id, new_goal_id)
  SELECT g.goal_id, g.goal_id::INT FROM goals_legacy g;

  CREATE TABLE users (
    id             INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    role           VARCHAR(50)  NOT NULL,
    region         VARCHAR(100),
    ethnicity      VARCHAR(100),
    incomebracket  INT,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    date_of_birth  DATE,
    legacy_user_uuid UUID UNIQUE
  );

  INSERT INTO users (
    username, password, role, region, ethnicity, incomebracket,
    first_name, last_name, email, date_of_birth, legacy_user_uuid
  )
  SELECT
    LOWER(
      REGEXP_REPLACE(
        CONCAT(
          COALESCE(NULLIF(TRIM(u.user_first), ''), 'user'),
          '_',
          COALESCE(NULLIF(TRIM(u.user_last), ''), 'migrated')
        ),
        '[^a-zA-Z0-9_]+', '', 'g'
      )
    ) || '_' || SUBSTRING(REPLACE(u.id::TEXT, '-', '') FOR 8) AS username,
    'TEMP_MIGRATE_RESET' AS password,
    'student' AS role,
    u.user_region AS region,
    'unspecified' AS ethnicity,
    0 AS incomebracket,
    COALESCE(NULLIF(TRIM(u.user_first), ''), 'Unknown') AS first_name,
    COALESCE(NULLIF(TRIM(u.user_last),  ''), 'User')    AS last_name,
    LOWER(
      COALESCE(NULLIF(TRIM(u.user_first), ''), 'user')     || '.' ||
      COALESCE(NULLIF(TRIM(u.user_last),  ''), 'migrated') || '.' ||
      SUBSTRING(REPLACE(u.id::TEXT, '-', '') FOR 8)        ||
      '@example.com'
    ) AS email,
    NULL::DATE AS date_of_birth,
    u.id
  FROM users_legacy u
  ORDER BY u.id;

  INSERT INTO _user_id_map (old_user_id, new_user_id)
  SELECT u.legacy_user_uuid, u.id FROM users u WHERE u.legacy_user_uuid IS NOT NULL;

  EXECUTE 'ALTER TABLE users DROP COLUMN legacy_user_uuid';

  CREATE TABLE usergoals (
    goalid   INT NOT NULL,
    user_id  INT NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    PRIMARY KEY (goalid, user_id),
    CONSTRAINT fk_usergoals_goal FOREIGN KEY (goalid)  REFERENCES goals(goalid) ON DELETE CASCADE,
    CONSTRAINT fk_usergoals_user FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT ck_usergoals_progress_range CHECK (progress >= 0 AND progress <= 100)
  );

  IF to_regclass('public.progressstatus_legacy') IS NOT NULL THEN
    INSERT INTO usergoals (goalid, user_id, progress)
    SELECT
      p.goal_id::INT,
      m.new_user_id,
      (
        (CASE WHEN p.milestone1_is_complete THEN 1 ELSE 0 END +
         CASE WHEN p.milestone2_is_complete THEN 1 ELSE 0 END +
         CASE WHEN p.milestone_n_is_complete THEN 1 ELSE 0 END) * 100 / 3
      )::INT
    FROM progressstatus_legacy p
    JOIN _user_id_map m ON m.old_user_id = p.id
    ON CONFLICT (goalid, user_id) DO UPDATE SET progress = EXCLUDED.progress;
  END IF;

  -- meetings: mentee_id UUID → INT
  IF to_regclass('public.meetings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_pkey';
    EXECUTE 'ALTER TABLE meetings DROP CONSTRAINT IF EXISTS fk_meeting_mentee';
    EXECUTE 'ALTER TABLE meetings ADD COLUMN IF NOT EXISTS mentee_id_new INT';
    UPDATE meetings mt SET mentee_id_new = m.new_user_id
    FROM _user_id_map m WHERE m.old_user_id = mt.mentee_id;
    EXECUTE 'ALTER TABLE meetings DROP COLUMN mentee_id';
    EXECUTE 'ALTER TABLE meetings RENAME COLUMN mentee_id_new TO mentee_id';
    EXECUTE 'ALTER TABLE meetings ALTER COLUMN mentee_id SET NOT NULL';
    EXECUTE 'ALTER TABLE meetings ADD CONSTRAINT meetings_pkey PRIMARY KEY (mentor_id, mentee_id)';
    EXECUTE 'ALTER TABLE meetings ADD CONSTRAINT fk_meeting_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE';
  END IF;

  -- student_preferences: user_id UUID → INT
  IF to_regclass('public.student_preferences') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE student_preferences DROP CONSTRAINT IF EXISTS student_preferences_pkey';
    EXECUTE 'ALTER TABLE student_preferences DROP CONSTRAINT IF EXISTS student_preferences_user_id_fkey';
    EXECUTE 'ALTER TABLE student_preferences ADD COLUMN IF NOT EXISTS user_id_new INT';
    UPDATE student_preferences sp SET user_id_new = m.new_user_id
    FROM _user_id_map m WHERE m.old_user_id = sp.user_id;
    EXECUTE 'ALTER TABLE student_preferences DROP COLUMN user_id';
    EXECUTE 'ALTER TABLE student_preferences RENAME COLUMN user_id_new TO user_id';
    EXECUTE 'ALTER TABLE student_preferences ALTER COLUMN user_id SET NOT NULL';
    EXECUTE 'ALTER TABLE student_preferences ADD CONSTRAINT student_preferences_pkey PRIMARY KEY (user_id)';
    EXECUTE 'ALTER TABLE student_preferences ADD CONSTRAINT student_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
  END IF;

  -- resource_bookmarks: user_id UUID → INT
  IF to_regclass('public.resource_bookmarks') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE resource_bookmarks DROP CONSTRAINT IF EXISTS resource_bookmarks_pkey';
    EXECUTE 'ALTER TABLE resource_bookmarks DROP CONSTRAINT IF EXISTS resource_bookmarks_user_id_fkey';
    EXECUTE 'ALTER TABLE resource_bookmarks ADD COLUMN IF NOT EXISTS user_id_new INT';
    UPDATE resource_bookmarks rb SET user_id_new = m.new_user_id
    FROM _user_id_map m WHERE m.old_user_id = rb.user_id;
    EXECUTE 'ALTER TABLE resource_bookmarks DROP COLUMN user_id';
    EXECUTE 'ALTER TABLE resource_bookmarks RENAME COLUMN user_id_new TO user_id';
    EXECUTE 'ALTER TABLE resource_bookmarks ALTER COLUMN user_id SET NOT NULL';
    EXECUTE 'ALTER TABLE resource_bookmarks ADD CONSTRAINT resource_bookmarks_pkey PRIMARY KEY (user_id, resource_id)';
    EXECUTE 'ALTER TABLE resource_bookmarks ADD CONSTRAINT resource_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
  END IF;

  -- milestones: user_id UUID → INT
  IF to_regclass('public.milestones') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_user_id_fkey';
    EXECUTE 'ALTER TABLE milestones ADD COLUMN IF NOT EXISTS user_id_new INT';
    UPDATE milestones ms SET user_id_new = m.new_user_id
    FROM _user_id_map m WHERE m.old_user_id = ms.user_id;
    EXECUTE 'ALTER TABLE milestones DROP COLUMN user_id';
    EXECUTE 'ALTER TABLE milestones RENAME COLUMN user_id_new TO user_id';
    EXECUTE 'ALTER TABLE milestones ALTER COLUMN user_id SET NOT NULL';
    EXECUTE 'ALTER TABLE milestones ADD CONSTRAINT milestones_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
  END IF;

  DROP TABLE IF EXISTS progressstatus_legacy;
  DROP TABLE IF EXISTS users_legacy;
  DROP TABLE IF EXISTS goals_legacy;
  DROP TABLE IF EXISTS _goal_id_map;
  DROP TABLE IF EXISTS _user_id_map;

  RAISE NOTICE 'Migration 007: ERD alignment complete.';
END $migration$;
-- Add onboarding questionnaire fields to student_preferences
-- Run: psql -U <user> -d upath_db -f backend/db/migrations/008_onboarding_fields.sql

-- Add new columns for onboarding data
ALTER TABLE student_preferences
  ADD COLUMN IF NOT EXISTS background VARCHAR(100),
  ADD COLUMN IF NOT EXISTS goal VARCHAR(100),
  ADD COLUMN IF NOT EXISTS challenge VARCHAR(100),
  ADD COLUMN IF NOT EXISTS weekly_time VARCHAR(50);

-- Rename 'interests' to be clearer (it stores the multi-select interests from onboarding)
-- Note: interests is already TEXT, which works for storing comma-separated or JSON array

COMMENT ON COLUMN student_preferences.background IS 'User background from onboarding (e.g., High school student, College student)';
COMMENT ON COLUMN student_preferences.goal IS 'Primary goal from onboarding (e.g., get-into-college, land-first-job)';
COMMENT ON COLUMN student_preferences.challenge IS 'Biggest challenge from onboarding';
COMMENT ON COLUMN student_preferences.weekly_time IS 'Weekly time commitment from onboarding';
-- Migration 009: add careers table
-- psql -U <user> -d upath_db -f db/migrations/009_careers_table.sql

CREATE TABLE IF NOT EXISTS careers (
    career_id      SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT,
    category       TEXT NOT NULL,
    average_salary INT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
-- Migration 010: Add authentication fields to users table
-- Adds email, password, username, and role for real account registration/login

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS username   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS role       VARCHAR(50) NOT NULL DEFAULT 'student';

-- Unique constraints (only on non-null values to avoid conflicts with existing seed rows)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq    ON users (email)    WHERE email    IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username) WHERE username IS NOT NULL;
-- 011: Seed an admin user for user management
-- Username: admin | Password: admin1234

INSERT INTO users (username, password, role, first_name, last_name, email, streak_count)
VALUES ('admin', 'admin1234', 'admin', 'Admin', 'User', 'admin@upath.dev', 0)
ON CONFLICT DO NOTHING;
-- Career path keys + journey plans for generated milestone trees
-- Run after prior migrations

-- Canonical slug per career (used for milestone journey templates)
ALTER TABLE careers ADD COLUMN IF NOT EXISTS career_path_key VARCHAR(64);

UPDATE careers SET career_path_key = CASE title
  WHEN 'Software Engineer' THEN 'software-development'
  WHEN 'Nurse' THEN 'healthcare'
  WHEN 'Product Manager' THEN 'product-management'
  WHEN 'Electrician' THEN 'trades-technical'
  WHEN 'Computer Hardware Engineer' THEN 'computer-engineering'
  WHEN 'Entrepreneur' THEN 'business-entrepreneurship'
  WHEN 'Teacher' THEN 'education'
  WHEN 'Graphic Designer' THEN 'creative-arts-design'
  WHEN 'Environmental Scientist' THEN 'science'
  WHEN 'Data Analyst' THEN 'data-analytics'
  ELSE lower(regexp_replace(coalesce(title, ''), '[^a-zA-Z0-9]+', '-', 'g'))
END
WHERE career_path_key IS NULL;

-- Insert 10th career if missing (seed may run separately)
INSERT INTO careers (title, description, category, average_salary, career_path_key)
SELECT 'Data Analyst', 'Turn data into insights to guide decisions in business, science, or public policy.', 'Data & Analytics', 72000, 'data-analytics'
WHERE NOT EXISTS (SELECT 1 FROM careers WHERE career_path_key = 'data-analytics');

-- Unique slug when present (allows NULL if table partially seeded)
CREATE UNIQUE INDEX IF NOT EXISTS idx_careers_career_path_key ON careers(career_path_key);

CREATE TABLE IF NOT EXISTS journey_plans (
  id             BIGSERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  career_path_key VARCHAR(64) NOT NULL,
  plan_start_date DATE NOT NULL,
  plan_end_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_plans_user_id ON journey_plans(user_id);

ALTER TABLE milestones ADD COLUMN IF NOT EXISTS journey_plan_id BIGINT NULL
  REFERENCES journey_plans(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_milestones_journey_plan_id ON milestones(journey_plan_id);
-- Remove demo seed meetings so Sarah Johnson and Marcus Williams are bookable.
-- The seed data created meetings for mentor_id 1 and 2 tied to user_ids 1 and 2,
-- which prevented those mentors from appearing as available.
DELETE FROM meetings WHERE mentor_id IN (1, 2);

-- Fix: Re-add user profile columns dropped by migration 007's table rebuild
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS north_star_vision       TEXT,
  ADD COLUMN IF NOT EXISTS definition_of_success   TEXT,
  ADD COLUMN IF NOT EXISTS current_grade_level      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS streak_count             INT NOT NULL DEFAULT 0;
