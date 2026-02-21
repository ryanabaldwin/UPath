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
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

COMMENT ON TABLE resources IS 'Scholarships, jobs, college info—replaces static mock on Resources page.';
COMMENT ON TABLE resource_bookmarks IS 'Per-user saved resources.';
