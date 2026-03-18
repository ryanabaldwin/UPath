-- PostgreSQL schema for UPath
-- Usage with psql:
--   psql -U <user> -f db/schema.sql
-- If your role can create databases, this script will create one named upath_db.

DROP DATABASE IF EXISTS upath_db;
CREATE DATABASE upath_db;

\connect upath_db;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE goals (
  goal_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  milestone1 VARCHAR(255),
  milestone2 VARCHAR(255),
  milestone_n VARCHAR(255),
  image1_src VARCHAR(500),
  image_n_src VARCHAR(500)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_first VARCHAR(100) NOT NULL,
  user_last VARCHAR(100) NOT NULL,
  user_region VARCHAR(100),
  goal_id BIGINT REFERENCES goals(goal_id),
  user_img_src VARCHAR(500)
);

CREATE TABLE progressstatus (
  id UUID NOT NULL,
  goal_id BIGINT NOT NULL,
  milestone1_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  milestone2_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  milestone_n_is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id, goal_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_goal FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
);

CREATE TABLE sponsor (
  sponsor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sponsor_name VARCHAR(200) NOT NULL,
  sponsor_type VARCHAR(100),
  sponsor_image_src VARCHAR(500)
);

CREATE TABLE mentors (
  mentor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_first VARCHAR(100) NOT NULL,
  mentor_last VARCHAR(100) NOT NULL,
  mentor_region VARCHAR(100),
  mentor_img_src VARCHAR(500),
  specialty VARCHAR(200),
  description TEXT
);

CREATE TABLE meetings (
  mentor_id BIGINT NOT NULL,
  mentee_id UUID NOT NULL,
  "time" TIMESTAMP NOT NULL,
  meetingstatus VARCHAR(100) NOT NULL,
  PRIMARY KEY (mentor_id, mentee_id),
  CONSTRAINT fk_meeting_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);
