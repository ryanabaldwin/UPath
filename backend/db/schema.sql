-- PostgreSQL schema for UPath
-- Usage with psql:
--   psql -U <user> -f db/schema.sql
-- If your role can create databases, this script will create one named upath_db.

DROP DATABASE IF EXISTS upath_db;
CREATE DATABASE upath_db;

\connect upath_db;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE goals (
  goalid INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pi1 VARCHAR(255) NOT NULL,
  pi2 VARCHAR(255) NOT NULL,
  pi3 VARCHAR(255),
  pi4 VARCHAR(255),
  pi5 VARCHAR(255),
  pi6 VARCHAR(255),
  pi7 VARCHAR(255),
  pi8 VARCHAR(255),
  pi9 VARCHAR(255),
  pi10 VARCHAR(255)
);

CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  ethnicity VARCHAR(100),
  incomebracket INT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  date_of_birth DATE
);

CREATE TABLE usergoals (
  goalid INT NOT NULL,
  user_id INT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  PRIMARY KEY (goalid, user_id),
  CONSTRAINT fk_usergoals_goal FOREIGN KEY (goalid) REFERENCES goals(goalid) ON DELETE CASCADE,
  CONSTRAINT fk_usergoals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_usergoals_progress_range CHECK (progress >= 0 AND progress <= 100)
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
  mentee_id INT NOT NULL,
  "time" TIMESTAMP NOT NULL,
  meetingstatus VARCHAR(100) NOT NULL,
  PRIMARY KEY (mentor_id, mentee_id),
  CONSTRAINT fk_meeting_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id) ON DELETE CASCADE,
  CONSTRAINT fk_meeting_mentee FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);
