# UPath

UPath helps underprivileged youth navigate career paths and connect with mentors. The platform provides tools to explore careers, track personal milestones, book mentor sessions, and discover resources — all in one place. In **demo mode** you select a student profile from the app bar; goals, progress, mentor sessions, and saved preferences are scoped to that profile.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| **Backend** | ASP.NET Core Web API, EF Core, Npgsql |
| **Database** | PostgreSQL 14+ |
| **Auth** | None — demo profile selector for development |

## Architecture

```
Browser (localhost:8080)
    │
    │  HTTP / REST
    ▼
Vite + React  ──────────────────► ASP.NET Core API (localhost:4000)
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

Run these from the repo root. Replace `<user>` with your PostgreSQL username.

```sh
# Create database and apply base schema
psql -U <user> -f backend/db/schema.sql

# Apply migrations in order
psql -U <user> -d upath_db -f backend/db/migrations/001_add_mentor_fields.sql
psql -U <user> -d upath_db -f backend/db/migrations/002_student_preferences.sql
psql -U <user> -d upath_db -f backend/db/migrations/003_resources_and_bookmarks.sql
psql -U <user> -d upath_db -f backend/db/migrations/004_indexes_and_constraints.sql
psql -U <user> -d upath_db -f backend/db/migrations/005_resources_filters_and_eligibility.sql
psql -U <user> -d upath_db -f backend/db/migrations/006_hierarchical_milestones.sql
psql -U <user> -d upath_db -f backend/db/migrations/007_erd_alignment_users_goals_usergoals.sql

# Seed demo data
psql -U <user> -d upath_db -f backend/db/seed.sql
psql -U <user> -d upath_db -f backend/db/seed-resources.sql
```

### 3 — Backend configuration

The default credentials in `backend/UPath.Api/appsettings.json` are:

```
Host=localhost;Port=5432;Database=upath_db;Username=postgres;Password=admin
```

To override without editing tracked files, create `backend/UPath.Api/appsettings.Development.json` (gitignored):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=upath_db;Username=YOUR_USER;Password=YOUR_PASSWORD"
  }
}
```

### 4 — Install dependencies

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
dotnet run --launch-profile http
# API: http://localhost:4000
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
    ├── UPath.Api/          # ASP.NET Core Web API project
    │   ├── Controllers/    # HTTP controllers
    │   ├── Data/           # EF Core DbContext
    │   └── Models/         # Entity classes (User, Goal, Mentor, etc.)
    ├── db/                 # PostgreSQL schema, migrations, and seeds (source of truth)
    └── _legacy/            # Original Express/Node.js implementation (reference only)
```

## Requirements (EARS Format)

### Ubiquitous Requirements

- The system shall ask questions about the user to understand their situation and goals.
- The system shall log completion of goals and milestones.
- The system shall list programs, scholarships, and guides in an intuitive way.

### Event-Driven Requirements

- When a student completes their profile setup, the system shall generate a list of recommended mentors.
- When a student selects a recommended mentor or path, the system shall notify the mentor and provide the student an introduction to the platform.
- When a student updates the progress towards a milestone, the student's mentor shall be notified and the student shall be taken to the next steps.
- When a student selects a specific career pathway, the system shall display personalized connections to relevant financial aid opportunities.
- When the student answers a question in the profile setup, the system shall ask related follow-up questions.

### State-Driven Requirements

- While the student is viewing the milestone dashboard, the system shall highlight overdue milestones.
- While the student browses the career resource library, the system shall allow filtering of content by industry, education level, and format.

## Key Development Notes

- **Schema changes**: Edit the SQL files in `backend/db/migrations/` and run `psql` manually. EF Core migrations (`dotnet ef migrations add`) are **not** used — the hand-written SQL files are the source of truth.
- **Adding a new endpoint**: Create a controller in `backend/UPath.Api/Controllers/`. See `HealthController.cs` as a starting template.
- **Frontend API calls**: All fetch logic lives in `frontend/src/lib/api.ts`. The base URL comes from the `VITE_API_BASE_URL` environment variable (default: `http://localhost:4000`).
- **CORS**: Allowed origins are configured in `appsettings.json` under `AllowedOrigins`.
