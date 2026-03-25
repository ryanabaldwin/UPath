-- Migration 009: add careers table
-- psql -U <user> -d upath_db -f db/migrations/009_careers_table.sql

CREATE TABLE IF NOT EXISTS careers (
    career_id      SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT,
    category       TEXT NOT NULL,
    average_salary INT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
