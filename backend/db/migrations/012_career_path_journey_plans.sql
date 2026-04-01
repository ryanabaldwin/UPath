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
