-- Add specialty and description columns to mentors table
-- Run after schema.sql for fresh installs, or standalone for existing DBs:
--   psql -U <user> -d upath_db -f db/migrations/001_add_mentor_fields.sql

ALTER TABLE mentors ADD COLUMN IF NOT EXISTS specialty VARCHAR(200);
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS description TEXT;
