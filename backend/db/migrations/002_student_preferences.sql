-- Student preferences for Explore/career matching (persist interests and selected paths per user)
-- Run: psql -U <user> -d upath_db -f db/migrations/002_student_preferences.sql

CREATE TABLE IF NOT EXISTS student_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  interests TEXT,
  selected_career_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_preferences_user_id ON student_preferences(user_id);

COMMENT ON TABLE student_preferences IS 'Stores Explore page selections and free-text interests per student (demo or future auth).';
