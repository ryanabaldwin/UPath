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
