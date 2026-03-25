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
