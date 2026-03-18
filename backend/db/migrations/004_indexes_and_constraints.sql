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
