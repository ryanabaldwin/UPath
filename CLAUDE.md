# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UPath** is a full-stack career guidance platform for underprivileged youth. It is a monorepo with:
- `frontend/` — Vite + React 18 + TypeScript SPA (port 8080)
- `backend/UPath.Api/` — ASP.NET Core Web API on .NET 10 (port 4000)
- `backend/db/` — PostgreSQL schema, hand-written SQL migrations, and seed data
- `nginx/` — Reverse proxy and SSL config for production

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev          # Dev server at http://localhost:8080
npm run build        # Production build
npm run build:dev    # Dev build with source maps
npm run lint         # ESLint
npm test             # Vitest (single run)
npm run test:watch   # Vitest watch mode
npm run preview      # Preview production build
```

### Backend

```bash
cd backend/UPath.Api
dotnet restore
dotnet build
dotnet run --launch-profile http   # API at http://localhost:4000
```

### Database Setup (first time)

```bash
psql -U postgres -d postgres -f backend/db/schema.sql
# Apply migrations in order:
psql -U postgres -d upath_db -f backend/db/migrations/001_add_mentor_fields.sql
# ... repeat for 002 through 008
# Seed demo data:
psql -U postgres -d upath_db -f backend/db/seed.sql
psql -U postgres -d upath_db -f backend/db/seed-resources.sql
psql -U postgres -d upath_db -f backend/db/seed-careers.sql
psql -U postgres -d upath_db -f backend/db/seed-milestones.sql
```

### Running a Single Test

```bash
cd frontend
npx vitest run src/test/app.test.tsx   # Run specific test file
npx vitest run -t "test name"          # Run by test name pattern
```

## Architecture

### Frontend

**Provider stack** (App.tsx, outermost first): `QueryClientProvider` → `AuthProvider` → `DemoIdentityProvider` → `TooltipProvider` → `BrowserRouter`

**Demo mode**: The app runs without real authentication. The active user is selected via a dropdown (`DemoUserSelector`), with the `userId` persisted to `localStorage` key `upath_demo_user_id`. `DemoIdentityContext` provides this user ID throughout the app.

**API layer** (`src/lib/api.ts`): Fetch-based HTTP client reading `VITE_API_BASE_URL` (defaults to `http://localhost:4000`). Exports `getJson()`, `postJson()`, `patchJson()`, `deleteJson()` with a custom `ApiError` class.

**Server state**: Managed by TanStack Query v5. All data fetching goes through Query hooks, not local state.

**Routing**: React Router v6. Protected routes are wrapped in `AppLayout`, which renders `DesktopNav` (sidebar) and `BottomNav` (mobile).

**Component library**: shadcn/ui (Radix UI primitives) in `src/components/ui/`. Use these before creating custom components.

**Path alias**: `@/` maps to `src/`.

### Backend

**Pattern**: Thin controllers → EF Core queries → PostgreSQL via Npgsql. No service layer — controllers query `AppDbContext` directly.

**DbContext** (`Data/AppDbContext.cs`): Entities — Users, Goals, UserGoals, Sponsors, Mentors, Meetings, StudentPreferences, Resources, ResourceBookmarks, Milestones, Careers. Relationships and composite keys are defined via Fluent API in `OnModelCreating`.

**JSON serialization**: camelCase enforced globally in `Program.cs`.

**CORS**: Allowed origins configured in `appsettings.json` under `AllowedOrigins`. For local dev, must include `http://localhost:8080`.

### Database

**Do not use EF Core migrations.** Schema changes go through hand-written SQL files in `backend/db/migrations/`. The schema source of truth is `backend/db/schema.sql`. When adding a migration, create a new numbered file (e.g., `009_description.sql`) and apply it manually.

## Key Configuration

| File | Purpose |
|------|---------|
| `frontend/.env` (copy from `.env.example`) | Sets `VITE_API_BASE_URL` |
| `backend/UPath.Api/appsettings.json` | DB connection string, CORS origins |
| `frontend/vite.config.ts` | Aliases, SWC plugin, port 8080 |
| `docker-compose.yml` | Full-stack Docker orchestration |

## Testing

Tests live in `frontend/src/test/`. The framework is Vitest + React Testing Library + jsdom. Tests that render pages must wrap with `QueryClientProvider`, `MemoryRouter`, and `DemoIdentityProvider`. Fetch is mocked via `vi.spyOn(global, 'fetch')`.

The backend has no unit tests; integration is validated through the frontend tests and manual API calls.
