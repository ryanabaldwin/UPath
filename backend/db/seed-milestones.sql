-- Seed hierarchical milestones for demo users
-- Run after schema.sql + migrations (including 006_hierarchical_milestones.sql) + seed.sql
-- psql -U <user> -d upath_db -f backend/db/seed-milestones.sql

\connect upath_db;

-- Clear existing demo milestones (safe to re-run)
DELETE FROM milestones WHERE user_id IN (1, 2);

-- User 1
WITH macro AS (
  INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
  VALUES (1, NULL, 'Become a Frontend Engineer', 'Your north-star goal.', 'macro', 'work', 'in_progress', NULL)
  RETURNING id
), checkpoint AS (
  INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
  SELECT 1, macro.id, 'Build your portfolio', 'Ship a simple portfolio and iterate.', 'checkpoint', 'work', 'pending', NULL
  FROM macro
  RETURNING id
), daily1 AS (
  INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
  SELECT 1, checkpoint.id, 'Finish one React tutorial', NULL, 'daily', 'school', 'complete', NULL
  FROM checkpoint
  RETURNING id
)
INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
SELECT 1, checkpoint.id, 'Deploy a site to the internet', 'Use Vercel/Netlify to publish.', 'daily', 'work', 'pending', NULL
FROM checkpoint;

-- User 2
WITH macro AS (
  INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
  VALUES (2, NULL, 'Become a Data Analyst', 'Your north-star goal.', 'macro', 'work', 'in_progress', NULL)
  RETURNING id
), checkpoint AS (
  INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
  SELECT 2, macro.id, 'Learn SQL fundamentals', 'Get comfortable with SELECT/JOIN/GROUP BY.', 'checkpoint', 'school', 'pending', NULL
  FROM macro
  RETURNING id
)
INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
SELECT 2, checkpoint.id, 'Write 5 practice queries', NULL, 'daily', 'school', 'pending', NULL
FROM checkpoint;

