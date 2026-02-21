# Backend API

## Setup

1. Copy env template: `cp .env.example .env`
2. Set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE=upath_db`, and `FRONTEND_ORIGIN` (e.g. `http://localhost:8080`).
3. Install dependencies: `npm install`
4. Start the API: `npm run dev` (listens on port 4000 by default)
5. Run tests (requires DB): `npm test`

## Available endpoints

- `GET /api/health` — health check and DB time
- `GET /api/goals` — list goals
- `GET /api/users` — list users (with goal title)
- `GET /api/users/:id` — get one user
- `GET /api/users/:id/progress` — progress rows for user (with goal/milestone labels)
- `GET /api/users/:id/meetings` — scheduled meetings for user
- `GET /api/users/:id/preferences` — student preferences (interests, selected career paths)
- `GET /api/progress` — all progress rows
- `PATCH /api/users/:id/goal` — set user goal (body: `{ goal_id }`); creates progress row if needed
- `POST /api/users/:id/progress` — create progress row (body: `{ goal_id }`)
- `PATCH /api/progress/:userId/:goalId` — update milestone booleans (body: `milestone1_is_complete`, etc.)
- `PUT /api/users/:id/preferences` — upsert preferences (body: `interests`, `selected_career_paths`)
- `GET /api/mentors` — list mentors with `is_available`
- `POST /api/mentors/:id/book` — book mentor (body: `mentee_id`)
- `DELETE /api/mentors/:id/book` — cancel booking (body: `mentee_id`)
- `GET /api/resources` — list resources (optional query: `?category=...`)
- `GET /api/users/:id/bookmarks` — user’s bookmarked resources
- `POST /api/users/:id/bookmarks` — add bookmark (body: `resource_id`)
- `DELETE /api/users/:id/bookmarks/:resourceId` — remove bookmark

Preferences, resources, and bookmarks require running the migrations in `db/migrations/` (002, 003).
