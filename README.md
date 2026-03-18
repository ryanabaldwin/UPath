# UPath

UPath helps underprivileged youth navigate career paths and connect with mentors. The platform provides tools to explore careers, track personal milestones, book mentor sessions, and discover resources — all in one place. In **demo mode** you select a student profile from the app bar; goals, progress, mentor sessions, and saved preferences are scoped to that profile.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| **Backend** | ASP.NET Core 10 Web API, EF Core 10, Npgsql |
| **Database** | PostgreSQL 14+ |
| **Auth** | None — demo profile selector for development |

## Architecture

```
Browser (localhost:8080)
    │
    │  HTTP / REST
    ▼
Vite + React  ──────────────────► ASP.NET Core 10 API (localhost:4000)
  frontend/                              backend/UPath.Api/
                                               │
                                               │  EF Core + Npgsql
                                               ▼
                                        PostgreSQL (upath_db)
```

## Prerequisites

Install all of the following before running locally:

| Tool | Version | Notes |
|------|---------|-------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.x | Required for the backend |
| [Node.js](https://nodejs.org/) | 18+ | Required for the frontend |
| [PostgreSQL](https://www.postgresql.org/download/) | 14+ | Must have `psql` in PATH |

Verify:
```sh
dotnet --version
node --version
psql --version
```

## Setup

### 1 — Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd UPath
```

### 2 — Database

Run these from the `backend/` directory. Replace `<user>` with your PostgreSQL username.

```sh
# Create database and apply base schema
psql -U <user> -f db/schema.sql

# Apply migrations in order
psql -U <user> -d upath_db -f db/migrations/001_add_mentor_fields.sql
psql -U <user> -d upath_db -f db/migrations/002_student_preferences.sql
psql -U <user> -d upath_db -f db/migrations/003_resources_and_bookmarks.sql
psql -U <user> -d upath_db -f db/migrations/004_indexes_and_constraints.sql
psql -U <user> -d upath_db -f db/migrations/005_resources_filters_and_eligibility.sql
psql -U <user> -d upath_db -f db/migrations/006_hierarchical_milestones.sql

# Seed demo data
psql -U <user> -d upath_db -f db/seed.sql
psql -U <user> -d upath_db -f db/seed-resources.sql
```

### 3 — Backend configuration

Create `backend/UPath.Api/appsettings.Development.json` (gitignored — do not commit):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=upath_db;Username=YOUR_USER;Password=YOUR_PASSWORD"
  }
}
```

### 4 — Frontend configuration

```sh
cd frontend
cp .env.example .env
```

The default `VITE_API_BASE_URL=http://localhost:4000` matches the backend's dev port — no changes needed for local development.

### 5 — Install dependencies

```sh
# Frontend
cd frontend && npm install

# Backend (.NET restore)
cd ../backend/UPath.Api && dotnet restore
```

## Running the Application

Open **two terminals** from the repo root.

**Terminal 1 — Backend:**
```sh
cd backend/UPath.Api
dotnet run
# API: http://localhost:4000
# OpenAPI spec: http://localhost:4000/openapi/v1.json
```

**Terminal 2 — Frontend:**
```sh
cd frontend
npm run dev
# App: http://localhost:8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Verifying the Setup

1. Hit the health endpoint to confirm the API and database are up:
   ```sh
   curl http://localhost:4000/api/health
   # {"status":"ok","database":"connected","timestamp":"..."}
   ```

2. Open the frontend, select a demo profile from the dropdown, and navigate through **Dashboard**, **Milestones**, **Mentors**, **Explore**, and **Resources**.

## Repository Structure

```
UPath/
├── frontend/               # Vite + React TypeScript app
│   ├── src/
│   │   ├── components/     # Layout + shadcn/ui components
│   │   ├── pages/          # Route-level page components
│   │   ├── contexts/       # React contexts (demo identity, etc.)
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # API client + type definitions
│   └── ...
└── backend/
    ├── UPath.Api/          # ASP.NET Core 10 Web API project
    │   ├── Controllers/    # HTTP controllers
    │   ├── Data/           # EF Core DbContext
    │   └── Models/         # Entity classes
    ├── db/                 # PostgreSQL schema, migrations, and seeds (source of truth)
    └── _legacy/            # Original Express/Node.js implementation (reference only)
```

## Key Development Notes

- **Schema changes**: Edit the SQL files in `backend/db/migrations/` and run `psql` manually. EF Core migrations (`dotnet ef migrations add`) are **not** used — the hand-written SQL files are the source of truth.
- **Adding a new endpoint**: Create a controller in `backend/UPath.Api/Controllers/`. See `HealthController.cs` as a starting template and `_legacy/src/server.js` for the original request/response shapes.
- **Frontend API calls**: All fetch logic lives in `frontend/src/lib/api.ts`. The base URL comes from the `VITE_API_BASE_URL` environment variable.
