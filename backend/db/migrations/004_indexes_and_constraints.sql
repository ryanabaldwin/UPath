-- Indexes and constraints for performance and data integrity
-- Run: psql -U <user> -d upath_db -f db/migrations/004_indexes_and_constraints.sql

-- One scheduled meeting per mentor (prevent double-booking same mentor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_one_scheduled_per_mentor
  ON meetings (mentor_id) WHERE meetingstatus = 'scheduled';

-- Lookup progress by user (id is first in PK but explicit index can help for user-scoped queries)
CREATE INDEX IF NOT EXISTS idx_progressstatus_id ON progressstatus(id);

-- Lookup meetings by mentee for "My sessions"
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status ON meetings(mentee_id, meetingstatus);
