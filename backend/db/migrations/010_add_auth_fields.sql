-- Migration 010: Add authentication fields to users table
-- Adds email, password, username, and role for real account registration/login

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS username   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS role       VARCHAR(50) NOT NULL DEFAULT 'student';

-- Unique constraints (only on non-null values to avoid conflicts with existing seed rows)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq    ON users (email)    WHERE email    IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username) WHERE username IS NOT NULL;
