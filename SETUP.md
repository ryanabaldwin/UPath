# UPath — Setup Guide

This guide walks you through getting UPath running locally from a fresh clone. It covers prerequisites, database setup, backend and frontend configuration, authentication, and notes for production deployment.

---

## Prerequisites

Make sure the following are installed before starting:

- **Node.js** v18+ and **npm** (for the frontend)
- **.NET 10 SDK** (for the backend API)
- **PostgreSQL** 14+ (for the database)
- **psql** CLI (ships with PostgreSQL; used to run schema and seed scripts)
- **Git** (to clone the repo)

---

## 1. Clone the Repository

```bash
git clone <your-repo-url> UPath
cd UPath
```

---

## 2. Database Setup

The project uses hand-written SQL for schema management — **not** EF Core migrations. All database scripts live in `backend/db/`.

### 2a. Create the database and base schema

Connect as a PostgreSQL superuser (typically `postgres`) and run the schema file. This drops and recreates the `upath_db` database, so only run it on a fresh setup or when you want a clean slate:

```bash
psql -U postgres -d postgres -f backend/db/schema.sql
```

### 2b. Apply migrations in order

Each migration is numbered. Apply them sequentially:

```bash
psql -U postgres -d upath_db -f backend/db/migrations/001_add_mentor_fields.sql
psql -U postgres -d upath_db -f backend/db/migrations/002_student_preferences.sql
psql -U postgres -d upath_db -f backend/db/migrations/003_resources_and_bookmarks.sql
psql -U postgres -d upath_db -f backend/db/migrations/004_indexes_and_constraints.sql
psql -U postgres -d upath_db -f backend/db/migrations/005_resources_filters_and_eligibility.sql
psql -U postgres -d upath_db -f backend/db/migrations/006_hierarchical_milestones.sql
psql -U postgres -d upath_db -f backend/db/migrations/007_erd_alignment_users_goals_usergoals.sql
psql -U postgres -d upath_db -f backend/db/migrations/008_onboarding_fields.sql
psql -U postgres -d upath_db -f backend/db/migrations/009_careers_table.sql
psql -U postgres -d upath_db -f backend/db/migrations/010_add_auth_fields.sql
psql -U postgres -d upath_db -f backend/db/migrations/011_seed_admin_user.sql
```

If you want to run them all in one shot:

```bash
for f in backend/db/migrations/*.sql; do
  echo "Applying $f ..."
  psql -U postgres -d upath_db -f "$f"
done
```

### 2c. Seed demo data

These scripts populate the database with sample users, resources, careers, and milestones for development:

```bash
psql -U postgres -d upath_db -f backend/db/seed.sql
psql -U postgres -d upath_db -f backend/db/seed-resources.sql
psql -U postgres -d upath_db -f backend/db/seed-careers.sql
psql -U postgres -d upath_db -f backend/db/seed-milestones.sql
```

### 2d. Verify

Confirm the database is up and has data:

```bash
psql -U postgres -d upath_db -c "SELECT id, username, role FROM users LIMIT 5;"
```

You should see the seeded users including one with `role = 'admin'`.

---

## 3. Backend Setup

### 3a. Configure the connection string

Open `backend/UPath.Api/appsettings.json` and verify the connection string matches your local PostgreSQL credentials:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=upath_db;Username=postgres;Password=admin"
  },
  "AllowedOrigins": "http://localhost:8080"
}
```

Change `Username` and `Password` if your local PostgreSQL uses different credentials.

### 3b. Restore and run

```bash
cd backend/UPath.Api
dotnet restore
dotnet build
dotnet run --launch-profile http
```

The API will start at **http://localhost:4000**. You can verify it's working by visiting http://localhost:4000/api/health in your browser.

---

## 4. Frontend Setup

### 4a. Install dependencies

```bash
cd frontend
npm install
```

### 4b. Configure the environment

Copy the example env file and verify it points to your running backend:

```bash
cp .env.example .env
```

The default contents are:

```
VITE_API_BASE_URL=http://localhost:4000
```

This should match where the backend is running. No changes needed if you're using the defaults.

### 4c. Start the dev server

```bash
npm run dev
```

The frontend will start at **http://localhost:8080**.

---

## 5. Authentication

UPath uses **session cookie authentication**. When a user logs in through the API, the backend sets an HTTP-only session cookie (`UPath.Session`) that the browser sends with every subsequent request. There are no JWTs or localStorage tokens for auth.

### How it works

1. The frontend sends credentials to `POST /api/auth/login`.
2. The backend validates the credentials, creates a server-side session, and returns a `Set-Cookie` header.
3. All subsequent API requests include the cookie automatically (via `credentials: "include"` on all fetch calls).
4. On page load, the frontend calls `GET /api/auth/me` to check if an existing session is still valid.
5. Logging out calls `POST /api/auth/logout`, which clears the session server-side.

### Protected routes

All API endpoints under `/api/*` require an active session, except for these public endpoints: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/account/register`, `/api/account/register-simple`, and `/api/health`. Unauthenticated requests to protected endpoints receive a `401` response.

On the frontend, all pages inside `AppLayout` are wrapped in a `<RequireAuth>` route guard that redirects to `/login` if no session exists.

### Default accounts

After running the seed scripts and migration 011, you'll have these accounts available:

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| `admin` | `admin1234` | admin | Access to the admin panel at `/admin/users` |

The other seeded users have credentials set during `seed.sql`. Check that file for their usernames and passwords, or register a new account through the UI at `/register`.

### Admin access

Users with `role = 'admin'` see an "Admin" link in the sidebar navigation and can access `/admin/users`, which displays a table of all registered users. The `GET /api/users` endpoint is restricted to admin users on the backend — non-admin users receive a `403` response.

---

## 6. Running Tests

Tests live in `frontend/src/test/` and use Vitest with React Testing Library.

```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
npx vitest run src/test/app.test.tsx
```

The backend does not have unit tests. Integration is validated through the frontend test suite and manual API testing.

---

## 7. Production Deployment Notes

### Session cookie security

In local development, the session cookie is configured with `SameSite=Lax` and `SecurePolicy=SameAsRequest`. This works because the frontend and backend are both on `localhost` (just different ports).

**For production**, if your frontend and API are on different domains (e.g., `app.upath.com` and `api.upath.com`), you need to change the cookie configuration in `backend/UPath.Api/Program.cs`:

```csharp
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.Name = "UPath.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;    // Required for cross-domain
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;  // Required with SameSite=None
    options.Cookie.IsEssential = true;
});
```

Key points to keep in mind:

- `SameSite=None` **requires** `Secure`, which **requires** HTTPS. If you set `SameSite=None` without `SecurePolicy=Always` (or without HTTPS), the browser will reject the cookie and authentication will silently fail. This manifests as users being unable to stay logged in — the login request succeeds, but subsequent requests return `401` because the cookie is never sent.
- If the frontend and API are on the **same domain** (e.g., behind a reverse proxy like nginx where both are served from `upath.com`), you can keep `SameSite=Lax` and avoid this entirely.
- The `AllowedOrigins` value in `appsettings.json` must include your production frontend URL. Multiple origins can be comma-separated.
- CORS is configured with `AllowCredentials()`, which is required for the browser to send cookies cross-origin. This means `AllowedOrigins` **cannot** use the wildcard `*` — you must list specific origins.

### CORS configuration

Update `appsettings.json` with your production frontend origin:

```json
{
  "AllowedOrigins": "https://app.upath.com,http://localhost:8080"
}
```

### HTTPS

The API should run behind HTTPS in production. The nginx configuration in the `nginx/` directory handles SSL termination. Make sure your certificates are configured there.

---

## 8. Project Structure Overview

```
UPath/
  frontend/              Vite + React 18 + TypeScript SPA (port 8080)
    src/
      components/        Reusable UI components (shadcn/ui based)
      contexts/          React context providers (AuthContext)
      pages/             Page components (Dashboard, Profile, Admin, etc.)
      lib/               API client, utilities, types
      test/              Vitest test files
  backend/
    UPath.Api/           ASP.NET Core Web API on .NET 10 (port 4000)
      Controllers/       API endpoint controllers
      Data/              EF Core DbContext
      Models/            Entity models
    db/
      schema.sql         Database schema (source of truth)
      migrations/        Numbered SQL migration files
      seed*.sql          Demo data seed scripts
  nginx/                 Reverse proxy and SSL config for production
  docker-compose.yml     Full-stack Docker orchestration
```

---

## 9. Common Issues

**"The cookie has set SameSite=None and must also set Secure"** — This means the cookie policy requires HTTPS but you're running on HTTP. For local development, make sure `Program.cs` uses `SameSiteMode.Lax`, not `SameSiteMode.None`. See the production deployment section above for when to use `None`.

**API returns 401 on every request** — The session cookie isn't being sent. Check that all fetch calls include `credentials: "include"` (already configured in `frontend/src/lib/api.ts`). Also verify CORS is configured with `AllowCredentials()` and a specific origin (not `*`).

**"CORS policy: No 'Access-Control-Allow-Origin' header"** — The frontend URL isn't in the allowed origins list. Add it to `AllowedOrigins` in `appsettings.json`.

**Database connection refused** — Verify PostgreSQL is running and that the connection string in `appsettings.json` matches your local credentials (host, port, username, password).

**Frontend can't reach the backend** — Make sure the backend is running on port 4000 and that `VITE_API_BASE_URL` in `frontend/.env` is set to `http://localhost:4000`.
