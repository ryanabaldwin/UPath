# AI Implementation Guide & Codebase Documentation

This document is designed to help AI agents understand the UPath codebase structure, stack, and architecture to plan and implement new features.

## 1. System Overview

UPath is a career navigation platform connecting students with mentors and resources.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Shadcn UI.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL.
- **AI**: Custom Node.js modules for profile building, recommendations, and goal planning.

## 2. Codebase Structure

```
/
├── backend/                 # Backend Node.js application
│   ├── src/
│   │   ├── ai/             # AI logic (profile, moderation, recommendations)
│   │   ├── db.js           # Database connection pool
│   │   ├── server.js       # Express app entry point & API routes
│   │   └── server.test.js  # Backend tests
│   ├── package.json        # Backend dependencies
│   └── .env                # Backend environment variables
├── db/                      # Database scripts
│   ├── migrations/         # SQL migration files
│   ├── schema.sql          # Base schema definition
│   ├── seed.sql            # Initial data seeding
│   └── seed-resources.sql  # Resources data seeding
├── src/                     # Frontend React application
│   ├── components/         # Reusable UI components (shadcn/ui)
│   ├── contexts/           # React Contexts (e.g., Auth/User context)
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── aiTypes.ts      # TypeScript interfaces for AI features
│   │   ├── api.ts          # API client wrapper (fetch calls)
│   │   └── utils.ts        # Utility functions
│   ├── pages/              # Route components (Dashboard, Explore, etc.)
│   ├── App.tsx             # Main app component & routing
│   └── main.tsx            # Entry point
├── package.json            # Frontend dependencies
└── tsconfig.json           # TypeScript configuration
```

## 3. Tech Stack Details

- **Frontend**:
  - **Framework**: React 18 with Vite.
  - **Language**: TypeScript.
  - **Styling**: Tailwind CSS with `shadcn/ui` (Radix UI primitives).
  - **State Management**: React Query (`@tanstack/react-query`) for server state.
  - **Routing**: `react-router-dom`.
  - **Validation**: `zod`.

- **Backend**:
  - **Runtime**: Node.js.
  - **Framework**: Express.js.
  - **Database Driver**: `pg` (node-postgres).
  - **Testing**: `supertest` with native Node.js test runner.

## 4. Database Schema

### Core Tables
- **users**: Stores user details (name, region, current goal).
- **goals**: Predefined career goals with milestones.
- **progressstatus**: Tracks user progress on goal milestones.
- **mentors**: Available mentors for booking.
- **meetings**: Scheduled sessions between users and mentors.
- **resources**: Educational/career resources (jobs, scholarships, etc.).
- **resource_bookmarks**: User saved resources.
- **student_preferences**: User interests and career path selections.

### AI & Instrumentation Tables
- **student_profiles**: JSON storage of AI-inferred user profiles.
- **ai_chat_threads**: Metadata for AI chat sessions.
- **ai_chat_messages**: Chat history (user & assistant messages).
- **recommendation_runs**: Logs of AI recommendation generations.
- **goal_paths**: Generated custom goal paths.
- **instrumentation_events**: Generic event logging for analytics.

*Note: AI tables are automatically created by `ensureAiTables()` in `server.js` if they don't exist.*

## 5. API Architecture

The backend exposes a RESTful API at `http://localhost:4000`.

### Key Endpoints
- **Users**: `GET /api/users`, `GET /api/users/:id`
- **Goals**: `GET /api/goals`, `PATCH /api/users/:id/goal`
- **Progress**: `GET /api/progress`, `PATCH /api/progress/:userId/:goalId`
- **Mentors**: `GET /api/mentors`, `POST /api/mentors/:id/book`
- **Resources**: `GET /api/resources`, `GET /api/resources/search`
- **AI**:
  - `POST /api/users/:id/ai/threads`: Start a new chat thread.
  - `POST /api/users/:id/ai/threads/:threadId/messages`: Send a message.
  - `POST /api/users/:id/recommendations`: Generate recommendations.
  - `POST /api/users/:id/goal-paths`: Generate a custom goal path.

### Frontend Integration
- All API calls are encapsulated in `src/lib/api.ts`.
- Types are shared/mirrored in `src/lib/aiTypes.ts` and `src/lib/api.ts`.
- React components use `useQuery` and `useMutation` hooks to interact with these API functions.

## 6. Development Workflow

1.  **Database Changes**:
    -   Create a new SQL file in `db/migrations/`.
    -   Run it via `psql`.
    -   Update `backend/src/server.js` `ensure...` functions if it's a core schema requirement.

2.  **Backend Logic**:
    -   Add routes in `backend/src/server.js`.
    -   Implement logic using `query` from `backend/src/db.js`.

3.  **Frontend Integration**:
    -   Add types to `src/lib/api.ts` (or `aiTypes.ts`).
    -   Add fetch wrapper function in `src/lib/api.ts`.
    -   Use in component with `useQuery`/`useMutation`.

## 7. AI Implementation Specifics

The `backend/src/ai/` directory contains the core logic for:
-   **Moderation**: Checking inputs for safety.
-   **Profile Building**: Inferring user attributes from chat.
-   **Recommendations**: Matching users to opportunities based on their profile.
-   **Goal Paths**: Generating step-by-step plans.

When adding new AI features, follow the pattern of:
1.  Defining the data model (JSON schema).
2.  Creating a backing table (if persistence is needed).
3.  Implementing the logic in a new module under `backend/src/ai/`.
4.  Exposing it via a new API endpoint.
