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
