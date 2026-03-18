-- Indexes and constraints for performance and data integrity
-- Run: psql -U <user> -d upath_db -f db/migrations/004_indexes_and_constraints.sql

-- One scheduled meeting per mentor (prevent double-booking same mentor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_scheduled_per_mentor
  ON meetings (mentor_id) WHERE meetingstatus = 'scheduled';

-- Lookup user-goal link rows by user (supports profile-scoped progress queries).
-- Kept backward-compatible with legacy `progressstatus` during transition.
DO $$
BEGIN
  IF to_regclass('public.usergoals') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_usergoals_user_id ON usergoals(user_id);
  ELSIF to_regclass('public.progressstatus') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_progressstatus_id ON progressstatus(id);
  END IF;
END $$;

-- Lookup meetings by mentee for "My sessions"
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status ON meetings(mentee_id, meetingstatus);
