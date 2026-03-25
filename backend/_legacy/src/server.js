import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { randomUUID } from "node:crypto";
import { query, testDbConnection } from "./db.js";
import { moderateContent, redactSensitiveContent } from "./ai/moderation.js";
import { buildInitialProfile, estimateCompleteness, mergeProfileFromMessage } from "./ai/profile.js";
import { buildRecommendations } from "./ai/recommendations.js";
import { buildGoalPath, deriveNextStep } from "./ai/goalPath.js";
import { generateCoachReply } from "./ai/coachRuntime.js";
import { buildMilestoneSpec, buildMilestoneTree, sanitizeMilestoneInput } from "./ai/milestones.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const AI_COACH_ENABLED = process.env.AI_COACH_ENABLED !== "false";
const AI_COACH_RATE_LIMIT_PER_MINUTE = Math.max(1, Number(process.env.AI_COACH_RATE_LIMIT_PER_MINUTE || 20));
const VALID_EXPLORATION_MODES = new Set(["money-soon", "helping-people", "building", "not-sure"]);
const rateLimitBuckets = new Map();

app.use(
  cors({
    origin: FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()),
  })
);

app.use(express.json());

let aiTablesReadyPromise = null;
let resourceSchemaReadyPromise = null;
let milestoneSchemaReadyPromise = null;

function createApiError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

function assertAiCoachEnabled() {
  if (!AI_COACH_ENABLED) {
    throw createApiError(503, "AI_COACH_DISABLED", "AI coach is currently unavailable");
  }
}

function sanitizeProfileJson(profileJson) {
  const base = typeof profileJson === "object" && profileJson != null ? profileJson : {};
  const arrays = ["values", "interests", "strengths", "constraints"];
  const sanitized = { ...base };

  for (const key of arrays) {
    const source = Array.isArray(base[key]) ? base[key] : [];
    sanitized[key] = source
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  sanitized.preferences =
    typeof base.preferences === "object" && base.preferences != null ? base.preferences : {};
  sanitized.exploration_mode = VALID_EXPLORATION_MODES.has(String(base.exploration_mode))
    ? String(base.exploration_mode)
    : "not-sure";
  sanitized.summary = typeof base.summary === "string" ? base.summary.trim().slice(0, 600) : "";
  return sanitized;
}

function enforceCoachRateLimit(req, userId) {
  const now = Date.now();
  const windowMs = 60_000;
  const ip = req.ip || "unknown";
  const key = `${userId}:${ip}`;
  const bucket = rateLimitBuckets.get(key) ?? [];
  const freshHits = bucket.filter((timestamp) => now - timestamp < windowMs);

  if (freshHits.length >= AI_COACH_RATE_LIMIT_PER_MINUTE) {
    throw createApiError(429, "AI_COACH_RATE_LIMITED", "Too many coach messages. Please try again shortly.", {
      retry_after_seconds: 60,
    });
  }
  freshHits.push(now);
  rateLimitBuckets.set(key, freshHits);
}

async function assertUserExists(userId) {
  const result = await query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [userId]);
  if (result.rows.length === 0) {
    throw createApiError(404, "USER_NOT_FOUND", "User not found");
  }
}

function safeJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function ensureAiTables() {
  if (aiTablesReadyPromise) {
    return aiTablesReadyPromise;
  }
  aiTablesReadyPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id UUID PRIMARY KEY,
        profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        completeness INT NOT NULL DEFAULT 0,
        latest_thread_id TEXT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS ai_chat_threads (
        thread_id TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        message_id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        redacted_content TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS recommendation_runs (
        run_id TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        profile_snapshot JSONB NOT NULL,
        intent TEXT NOT NULL DEFAULT 'default',
        output JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS goal_paths (
        goal_path_id TEXT PRIMARY KEY,
        user_id UUID NOT NULL,
        selected_path TEXT NOT NULL,
        output JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS instrumentation_events (
        event_id TEXT PRIMARY KEY,
        user_id UUID NULL,
        name TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  })();
  return aiTablesReadyPromise;
}

async function ensureResourceSchema() {
  if (resourceSchemaReadyPromise) {
    return resourceSchemaReadyPromise;
  }
  resourceSchemaReadyPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS resources (
        resource_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        link VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS industry VARCHAR(120)`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS education_level VARCHAR(120)`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS format VARCHAR(120)`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS location VARCHAR(120)`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS deadline_date DATE`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS cost_usd INT`);
    await query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS eligibility_notes TEXT`);
  })();
  return resourceSchemaReadyPromise;
}

async function ensureMilestoneSchema() {
  if (milestoneSchemaReadyPromise) {
    return milestoneSchemaReadyPromise;
  }
  milestoneSchemaReadyPromise = (async () => {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS north_star_vision TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS definition_of_success TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_grade_level VARCHAR(50)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT NOT NULL DEFAULT 0`);
    await query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_id   BIGINT NULL REFERENCES milestones(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT NULL,
        tier        VARCHAR(50) NOT NULL CHECK (tier IN ('macro', 'checkpoint', 'domain', 'daily')),
        category    VARCHAR(50) NULL CHECK (category IN ('school', 'work', 'life', 'finance')),
        status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'complete', 'skipped')),
        due_date    DATE NULL,
        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_milestones_parent_id ON milestones(parent_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_milestones_user_tier_status ON milestones(user_id, tier, status)`);
  })();
  return milestoneSchemaReadyPromise;
}

/**
 * Generate and persist a full milestone tree for a user.
 * Returns { macroId, generatedCount }.
 */
async function generateAndPersistMilestones(userId, selectedPath, profile, northStar) {
  const { macro, checkpoints, dailySets } = buildMilestoneSpec(selectedPath, profile, northStar);

  const macroResult = await query(
    `INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
     VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [userId, macro.title, macro.description, macro.tier, macro.category, macro.status, macro.due_date]
  );
  const macroId = Number(macroResult.rows[0].id);
  let generatedCount = 1;

  for (let ci = 0; ci < checkpoints.length; ci++) {
    const cp = checkpoints[ci];
    const cpResult = await query(
      `INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, macroId, cp.title, cp.description, cp.tier, cp.category, cp.status, cp.due_date]
    );
    const cpId = Number(cpResult.rows[0].id);
    generatedCount++;

    const dailies = dailySets[ci] ?? [];
    for (const daily of dailies) {
      await query(
        `INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
         VALUES ($1, $2, $3, NULL, 'daily', $4, 'pending', NULL)`,
        [userId, cpId, daily.title, daily.category ?? "work"]
      );
      generatedCount++;
    }
  }

  return { macroId, generatedCount };
}

async function logEvent(userId, name, metadata = {}) {
  await ensureAiTables();
  await query(
    `INSERT INTO instrumentation_events (event_id, user_id, name, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [randomUUID(), userId ?? null, name, JSON.stringify(metadata ?? {})]
  );
}

// ── Auth: register ──────────────────────────────────────────────────────────
app.post("/api/account/register", async (req, res, next) => {
  try {
    const { registration, onboarding } = req.body ?? {};
    const { email, password, firstName, lastName, username: rawUsername } = registration ?? {};

    if (!email?.trim()) return res.status(400).json({ error: "Email is required" });
    if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (!firstName?.trim()) return res.status(400).json({ error: "First name is required" });
    if (!lastName?.trim()) return res.status(400).json({ error: "Last name is required" });

    const emailLower = email.trim().toLowerCase();
    const emailExists = await query("SELECT 1 FROM users WHERE email = $1", [emailLower]);
    if (emailExists.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Generate username from first+last if not provided; ensure uniqueness
    let username = (rawUsername?.trim() || `${firstName.trim().toLowerCase().replace(/\s+/g, "")}.${lastName.trim().toLowerCase().replace(/\s+/g, "")}`);
    const baseUsername = username;
    let counter = 1;
    while ((await query("SELECT 1 FROM users WHERE username = $1", [username])).rows.length > 0) {
      username = `${baseUsername}${counter++}`;
    }

    const insertResult = await query(
      `INSERT INTO users (user_first, user_last, email, password, username, role)
       VALUES ($1, $2, $3, $4, $5, 'student')
       RETURNING id`,
      [firstName.trim(), lastName.trim(), emailLower, password, username]
    );
    const userId = insertResult.rows[0].id;

    // Apply onboarding data if provided
    if (onboarding && typeof onboarding === "object") {
      const { background, goal, interests, challenge, weeklyTime } = onboarding;
      if (background) {
        await query("UPDATE users SET current_grade_level = $1 WHERE id = $2", [String(background).trim().slice(0, 50), userId]);
      }
      const safeInterests = Array.isArray(interests)
        ? interests.filter((i) => typeof i === "string").map((i) => i.trim()).filter(Boolean).slice(0, 10)
        : [];
      const profilePatch = {
        ...(goal ? { exploration_mode: String(goal).trim().slice(0, 100) } : {}),
        ...(safeInterests.length > 0 ? { interests: safeInterests } : {}),
        ...(challenge ? { constraints: [String(challenge).trim().slice(0, 200)] } : {}),
        preferences: {
          ...(background ? { background: String(background).trim().slice(0, 100) } : {}),
          ...(weeklyTime ? { weekly_time: String(weeklyTime).trim().slice(0, 50) } : {}),
        },
      };
      await query(
        `INSERT INTO student_profiles (user_id, profile_json, completeness, updated_at)
         VALUES ($1, $2::jsonb, 20, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           profile_json = student_profiles.profile_json || $2::jsonb,
           completeness = GREATEST(student_profiles.completeness, 20),
           updated_at = NOW()`,
        [userId, JSON.stringify(profilePatch)]
      );
    }

    res.status(201).json({
      id: userId,
      username,
      email: emailLower,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "student",
      onboardingComplete: !!onboarding,
    });
  } catch (error) {
    next(error);
  }
});

// ── Auth: login ──────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username?.trim() || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const result = await query(
      `SELECT id, username, email, user_first AS "firstName", user_last AS "lastName", role, password
       FROM users
       WHERE (username = $1 OR email = $1) AND password IS NOT NULL`,
      [username.trim().toLowerCase()]
    );
    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const u = result.rows[0];
    res.json({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role || "student" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", async (_req, res, next) => {
  try {
    const dbResult = await query("SELECT NOW() AS now");
    res.json({ ok: true, service: "upath-backend", dbTime: dbResult.rows[0].now });
  } catch (error) {
    next(error);
  }
});

app.get("/api/goals", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT goal_id, title, milestone1, milestone2, milestone_n, image1_src, image_n_src
       FROM goals
       ORDER BY goal_id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.user_first,
         u.user_last,
         u.user_region,
         u.goal_id,
         u.user_img_src,
         g.title AS goal_title
       FROM users u
       LEFT JOIN goals g ON g.goal_id = u.goal_id
       ORDER BY u.user_last, u.user_first`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});


app.get("/api/users/:id", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.user_first, u.user_last, u.user_region, u.goal_id, u.user_img_src,
              u.north_star_vision, u.definition_of_success, u.current_grade_level, u.streak_count,
              g.title AS goal_title
       FROM users u
       LEFT JOIN goals g ON g.goal_id = u.goal_id
       WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


app.patch("/api/users/:id/goal", async (req, res, next) => {
  try {
    const { id } = req.params;
    const goalId = req.body?.goal_id;
    if (goalId == null || Number.isNaN(Number(goalId))) {
      return res.status(400).json({ error: "Valid goal_id required" });
    }
    const result = await query(
      `UPDATE users SET goal_id = $1 WHERE id = $2 RETURNING id, goal_id`,
      [Number(goalId), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});


app.get("/api/users/:id/meetings", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT m.mentor_id, m.mentee_id, m."time", m.meetingstatus,
              ment.mentor_first, ment.mentor_last, ment.specialty
       FROM meetings m
       JOIN mentors ment ON ment.mentor_id = m.mentor_id
       WHERE m.mentee_id = $1 AND m.meetingstatus = 'scheduled'
       ORDER BY m."time" ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/mentors", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*,
         NOT EXISTS (
           SELECT 1 FROM meetings mt
           WHERE mt.mentor_id = m.mentor_id AND mt.meetingstatus = 'scheduled'
         ) AS is_available
       FROM mentors m
       ORDER BY m.mentor_id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

const DEFAULT_MENTEE_ID = "11111111-1111-1111-1111-111111111111";

app.post("/api/mentors/:id/book", async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.id, 10);
    if (Number.isNaN(mentorId)) {
      return res.status(400).json({ error: "Invalid mentor ID" });
    }
    const menteeId = req.body?.mentee_id ?? DEFAULT_MENTEE_ID;

    const existing = await query(
      `SELECT 1 FROM meetings
       WHERE mentor_id = $1 AND mentee_id = $2 AND meetingstatus = 'scheduled'`,
      [mentorId, menteeId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Mentor is already booked by this mentee" });
    }

    const bookedByOther = await query(
      `SELECT 1 FROM meetings
       WHERE mentor_id = $1 AND meetingstatus = 'scheduled'`,
      [mentorId]
    );
    if (bookedByOther.rows.length > 0) {
      return res.status(409).json({ error: "Mentor is already booked" });
    }

    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + 7);

    await query(
      `INSERT INTO meetings (mentor_id, mentee_id, "time", meetingstatus)
       VALUES ($1, $2, $3, 'scheduled')`,
      [mentorId, menteeId, scheduledTime]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/mentors/:id/book", async (req, res, next) => {
  try {
    const mentorId = parseInt(req.params.id, 10);
    if (Number.isNaN(mentorId)) {
      return res.status(400).json({ error: "Invalid mentor ID" });
    }
    const menteeId = req.body?.mentee_id ?? DEFAULT_MENTEE_ID;

    const result = await query(
      `DELETE FROM meetings
       WHERE mentor_id = $1 AND mentee_id = $2 AND meetingstatus = 'scheduled'`,
      [mentorId, menteeId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No scheduled booking found" });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── North-star fields ──────────────────────────────────────────────────────
app.patch("/api/users/:id/north-star", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id } = req.params;
    await assertUserExists(id);
    const { north_star_vision, definition_of_success, current_grade_level } = req.body ?? {};
    const updates = [];
    const values = [];
    let i = 1;
    if (typeof north_star_vision === "string") {
      updates.push(`north_star_vision = $${i++}`);
      values.push(north_star_vision.trim().slice(0, 1000));
    }
    if (typeof definition_of_success === "string") {
      updates.push(`definition_of_success = $${i++}`);
      values.push(definition_of_success.trim().slice(0, 1000));
    }
    if (typeof current_grade_level === "string") {
      updates.push(`current_grade_level = $${i++}`);
      values.push(current_grade_level.trim().slice(0, 50));
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "At least one north-star field required" });
    }
    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${i}
       RETURNING id, north_star_vision, definition_of_success, current_grade_level, streak_count`,
      values
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// ── Hierarchical milestones ────────────────────────────────────────────────
app.get("/api/users/:id/milestones/tree", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id } = req.params;
    await assertUserExists(id);
    const result = await query(
      `SELECT id, user_id, parent_id, title, description, tier, category, status, due_date, created_at, updated_at
       FROM milestones
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [id]
    );
    const tree = buildMilestoneTree(result.rows);
    res.json({ tree });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/milestones/generate", async (req, res, next) => {
  try {
    await ensureAiTables();
    await ensureMilestoneSchema();
    const { id } = req.params;
    await assertUserExists(id);
    const selectedPath = String(req.body?.selected_path ?? "").trim();

    const profileResult = await query(`SELECT profile_json FROM student_profiles WHERE user_id = $1`, [id]);
    const profile = safeJson(profileResult.rows[0]?.profile_json, {});

    const userResult = await query(
      `SELECT north_star_vision, definition_of_success FROM users WHERE id = $1`,
      [id]
    );
    const northStar = userResult.rows[0] ?? {};

    const { macroId, generatedCount } = await generateAndPersistMilestones(id, selectedPath, profile, northStar);

    await logEvent(id, "milestones_generated", { macro_id: macroId, generated_count: generatedCount, selected_path: selectedPath });

    res.status(201).json({ macro_id: macroId, generated_count: generatedCount });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/milestones", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id } = req.params;
    await assertUserExists(id);
    const input = sanitizeMilestoneInput(req.body ?? {});
    if (!input.title) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!input.tier) {
      return res.status(400).json({ error: "tier must be one of: macro, checkpoint, domain, daily" });
    }
    const result = await query(
      `INSERT INTO milestones (user_id, parent_id, title, description, tier, category, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, parent_id, title, description, tier, category, status, due_date, created_at, updated_at`,
      [id, input.parent_id ?? null, input.title, input.description ?? null, input.tier, input.category ?? null, input.status ?? "pending", input.due_date ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/:id/milestones/:milestoneId", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id, milestoneId } = req.params;
    const mid = parseInt(milestoneId, 10);
    if (Number.isNaN(mid)) {
      return res.status(400).json({ error: "Invalid milestone id" });
    }
    const input = sanitizeMilestoneInput(req.body ?? {});
    const updates = ["updated_at = NOW()"];
    const values = [];
    let i = 1;
    if (input.title !== undefined) { updates.push(`title = $${i++}`); values.push(input.title); }
    if (input.description !== undefined) { updates.push(`description = $${i++}`); values.push(input.description); }
    if (input.status !== undefined) { updates.push(`status = $${i++}`); values.push(input.status); }
    if (input.due_date !== undefined) { updates.push(`due_date = $${i++}`); values.push(input.due_date); }
    if (input.category !== undefined) { updates.push(`category = $${i++}`); values.push(input.category); }
    values.push(mid, id);
    const result = await query(
      `UPDATE milestones
       SET ${updates.join(", ")}
       WHERE id = $${i} AND user_id = $${i + 1}
       RETURNING id, user_id, parent_id, title, description, tier, category, status, due_date, created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    // Increment streak_count when a milestone is completed
    if (input.status === "complete") {
      await query(`UPDATE users SET streak_count = streak_count + 1 WHERE id = $1`, [id]);
    }
    await logEvent(id, "milestone_updated", { milestone_id: mid, status: input.status ?? null });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id/milestones/:milestoneId", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id, milestoneId } = req.params;
    const mid = parseInt(milestoneId, 10);
    if (Number.isNaN(mid)) {
      return res.status(400).json({ error: "Invalid milestone id" });
    }
    const result = await query(
      `DELETE FROM milestones WHERE id = $1 AND user_id = $2`,
      [mid, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/preferences", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT user_id, interests, selected_career_paths, updated_at FROM student_preferences WHERE user_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.json({ user_id: id, interests: null, selected_career_paths: [], updated_at: null });
    }
    const row = result.rows[0];
    res.json({
      user_id: row.user_id,
      interests: row.interests,
      selected_career_paths: row.selected_career_paths ?? [],
      updated_at: row.updated_at,
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id/preferences", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { interests, selected_career_paths } = req.body ?? {};
    const paths = Array.isArray(selected_career_paths) ? selected_career_paths : [];
    await query(
      `INSERT INTO student_preferences (user_id, interests, selected_career_paths, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         interests = COALESCE(EXCLUDED.interests, student_preferences.interests),
         selected_career_paths = COALESCE(EXCLUDED.selected_career_paths, student_preferences.selected_career_paths),
         updated_at = NOW()`,
      [id, interests ?? null, JSON.stringify(paths)]
    );
    const result = await query(
      `SELECT user_id, interests, selected_career_paths, updated_at FROM student_preferences WHERE user_id = $1`,
      [id]
    );
    res.json(result.rows[0] ?? { user_id: id, interests, selected_career_paths: paths, updated_at: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.get("/api/resources", async (req, res, next) => {
  try {
    await ensureResourceSchema();
    const category = req.query.category;
    let sql = `SELECT resource_id, title, description, category, link, industry, education_level, format, location, deadline_date, cost_usd, eligibility_notes FROM resources ORDER BY category, title`;
    const params = [];
    if (category && String(category).trim()) {
      sql = `SELECT resource_id, title, description, category, link, industry, education_level, format, location, deadline_date, cost_usd, eligibility_notes FROM resources WHERE category = $1 ORDER BY title`;
      params.push(String(category).trim());
    }
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/resources/search", async (req, res, next) => {
  try {
    await ensureResourceSchema();
    const filters = {
      industry: String(req.query.industry ?? "").trim(),
      educationLevel: String(req.query.education_level ?? "").trim(),
      format: String(req.query.format ?? "").trim(),
      location: String(req.query.location ?? "").trim(),
    };
    const where = [];
    const params = [];

    if (filters.industry) {
      params.push(`%${filters.industry}%`);
      where.push(`COALESCE(industry, '') ILIKE $${params.length}`);
    }
    if (filters.educationLevel) {
      params.push(`%${filters.educationLevel}%`);
      where.push(`COALESCE(education_level, '') ILIKE $${params.length}`);
    }
    if (filters.format) {
      params.push(`%${filters.format}%`);
      where.push(`COALESCE(format, '') ILIKE $${params.length}`);
    }
    if (filters.location) {
      params.push(`%${filters.location}%`);
      where.push(`COALESCE(location, '') ILIKE $${params.length}`);
    }

    const sql = `
      SELECT resource_id, title, description, category, link, industry, education_level, format, location, deadline_date, cost_usd, eligibility_notes
      FROM resources
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY category, title
      LIMIT 50
    `;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/bookmarks", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.resource_id, r.title, r.description, r.category, r.link
       FROM resource_bookmarks b
       JOIN resources r ON r.resource_id = b.resource_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/bookmarks", async (req, res, next) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(req.body?.resource_id, 10);
    if (Number.isNaN(resourceId)) {
      return res.status(400).json({ error: "Valid resource_id required" });
    }
    await query(
      `INSERT INTO resource_bookmarks (user_id, resource_id) VALUES ($1, $2) ON CONFLICT (user_id, resource_id) DO NOTHING`,
      [id, resourceId]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id/bookmarks/:resourceId", async (req, res, next) => {
  try {
    const { id, resourceId } = req.params;
    const rid = parseInt(resourceId, 10);
    if (Number.isNaN(rid)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }
    const result = await query(
      `DELETE FROM resource_bookmarks WHERE user_id = $1 AND resource_id = $2`,
      [id, rid]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bookmark not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/events", async (req, res, next) => {
  try {
    const { id } = req.params;
    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      return res.status(400).json({ error: "Event name is required" });
    }
    await logEvent(id, name, req.body?.metadata ?? {});
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/ai/threads", async (req, res, next) => {
  try {
    assertAiCoachEnabled();
    await ensureAiTables();
    const { id } = req.params;
    await assertUserExists(id);

    const mode = String(req.body?.exploration_mode ?? "not-sure").trim();
    if (!VALID_EXPLORATION_MODES.has(mode)) {
      throw createApiError(400, "INVALID_EXPLORATION_MODE", "exploration_mode is invalid", {
        valid_modes: Array.from(VALID_EXPLORATION_MODES),
      });
    }
    const threadId = randomUUID();
    const profile = buildInitialProfile(mode);
    const completeness = estimateCompleteness(profile);

    await query(`INSERT INTO ai_chat_threads (thread_id, user_id) VALUES ($1, $2)`, [threadId, id]);
    await query(
      `INSERT INTO student_profiles (user_id, profile_json, completeness, latest_thread_id, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile_json = COALESCE(student_profiles.profile_json, '{}'::jsonb),
         completeness = GREATEST(student_profiles.completeness, EXCLUDED.completeness),
         latest_thread_id = EXCLUDED.latest_thread_id,
         updated_at = NOW()`,
      [id, JSON.stringify(profile), completeness, threadId]
    );

    await logEvent(id, "profile_started", { exploration_mode: mode, thread_id: threadId });
    await logEvent(id, "exploration_mode_selected", { exploration_mode: mode });

    res.status(201).json({ thread_id: threadId, exploration_mode: mode, created_at: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/ai/threads/:threadId/messages", async (req, res, next) => {
  try {
    assertAiCoachEnabled();
    await ensureAiTables();
    const { id, threadId } = req.params;
    await assertUserExists(id);
    enforceCoachRateLimit(req, id);

    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      throw createApiError(400, "MESSAGE_REQUIRED", "message is required");
    }
    if (message.length > 1200) {
      throw createApiError(400, "MESSAGE_TOO_LONG", "message must be 1200 characters or fewer");
    }

    const moderation = moderateContent(message);
    if (!moderation.allowed) {
      await logEvent(id, "safety_blocked_content", {
        reason: moderation.reason,
        thread_id: threadId,
        blocked_stage: "input",
      });
      throw createApiError(400, "AI_COACH_UNSAFE_INPUT", moderation.reason, {
        safe_response: moderation.safeResponse,
      });
    }

    const owner = await query(`SELECT thread_id FROM ai_chat_threads WHERE thread_id = $1 AND user_id = $2`, [threadId, id]);
    if (owner.rows.length === 0) {
      throw createApiError(404, "THREAD_NOT_FOUND", "Thread not found");
    }

    const profileRow = await query(`SELECT profile_json FROM student_profiles WHERE user_id = $1`, [id]);
    const currentProfile = safeJson(profileRow.rows[0]?.profile_json, buildInitialProfile("not-sure"));
    const updatedProfile = mergeProfileFromMessage(currentProfile, message);
    const completeness = estimateCompleteness(updatedProfile);
    const generated = await generateCoachReply(updatedProfile, message);
    const assistantModeration = moderateContent(generated.assistantMessage);
    const assistantMessage = assistantModeration.allowed
      ? generated.assistantMessage
      : assistantModeration.safeResponse;

    const redactedUser = redactSensitiveContent(message);
    const redactedAssistant = redactSensitiveContent(assistantMessage);

    await query(
      `INSERT INTO ai_chat_messages (message_id, thread_id, role, content, redacted_content)
       VALUES ($1, $2, 'user', $3, $4)`,
      [randomUUID(), threadId, message, redactedUser]
    );
    await query(
      `INSERT INTO ai_chat_messages (message_id, thread_id, role, content, redacted_content)
       VALUES ($1, $2, 'assistant', $3, $4)`,
      [randomUUID(), threadId, assistantMessage, redactedAssistant]
    );
    await query(
      `INSERT INTO student_profiles (user_id, profile_json, completeness, latest_thread_id, updated_at)
       VALUES ($1, $2::jsonb, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile_json = EXCLUDED.profile_json,
         completeness = EXCLUDED.completeness,
         latest_thread_id = EXCLUDED.latest_thread_id,
         updated_at = NOW()`,
      [id, JSON.stringify(updatedProfile), completeness, threadId]
    );

    // Handle tool actions inline
    let responseActions = null;
    if (generated.actions?.generate_milestones && !assistantModeration.allowed === false) {
      try {
        await ensureMilestoneSchema();
        const careerPath = generated.actions.generate_milestones.career_path || updatedProfile.interests?.slice(0, 2).join(", ") || "";
        const userResult = await query(`SELECT north_star_vision, definition_of_success FROM users WHERE id = $1`, [id]);
        const northStar = userResult.rows[0] ?? {};
        const { macroId, generatedCount } = await generateAndPersistMilestones(id, careerPath, updatedProfile, northStar);
        responseActions = { show_milestones: true, generated_count: generatedCount, macro_id: macroId };
        await logEvent(id, "milestones_generated_from_chat", { macro_id: macroId, generated_count: generatedCount, career_path: careerPath });
      } catch (err) {
        // Non-fatal: log but don't fail the message response
        await logEvent(id, "milestone_generation_error", { error: String(err?.message) }).catch(() => {});
      }
    }

    if (generated.actions?.show_mentors) {
      try {
        const hint = String(generated.actions.show_mentors.specialty_hint ?? "").trim();
        const mentorResult = hint
          ? await query(`SELECT mentor_id FROM mentors WHERE specialty ILIKE $1 LIMIT 5`, [`%${hint}%`])
          : await query(`SELECT mentor_id FROM mentors LIMIT 5`);
        const mentorIds = mentorResult.rows.map((r) => Number(r.mentor_id));
        responseActions = responseActions ?? {};
        responseActions.show_mentors = true;
        responseActions.mentor_ids = mentorIds;
      } catch (err) {
        await logEvent(id, "mentor_action_error", { error: String(err?.message) }).catch(() => {});
      }
    }

    await logEvent(id, "question_answered", {
      thread_id: threadId,
      profile_completeness: completeness,
      provider: generated.meta.provider,
      model: generated.meta.model,
      retries: generated.meta.retries,
      latency_ms: generated.meta.latency_ms,
      fallback_used: generated.meta.fallback_used,
      moderation_blocked_output: !assistantModeration.allowed,
      actions_triggered: responseActions ? Object.keys(responseActions) : null,
    });
    if (completeness >= 80) {
      await logEvent(id, "profile_completed", { completeness });
    }

    res.json({
      thread_id: threadId,
      assistant_message: assistantMessage,
      updated_profile_json: updatedProfile,
      completeness,
      blocked: !assistantModeration.allowed,
      ...(responseActions ? { actions: responseActions } : {}),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/profile", async (req, res, next) => {
  try {
    assertAiCoachEnabled();
    await ensureAiTables();
    const { id } = req.params;
    await assertUserExists(id);
    const result = await query(
      `SELECT profile_json, completeness, latest_thread_id
       FROM student_profiles
       WHERE user_id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      return res.json({ profile_json: {}, completeness: 0, thread_id: null, has_profile: false });
    }
    res.json({
      profile_json: safeJson(row.profile_json, {}),
      completeness: Number(row.completeness ?? 0),
      thread_id: row.latest_thread_id ?? null,
      has_profile: true,
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id/profile", async (req, res, next) => {
  try {
    assertAiCoachEnabled();
    await ensureAiTables();
    const { id } = req.params;
    await assertUserExists(id);
    const profileJson = sanitizeProfileJson(req.body?.profile_json ?? {});
    const completenessCandidate = Number(req.body?.completeness ?? estimateCompleteness(profileJson));
    const completeness = Number.isNaN(completenessCandidate)
      ? estimateCompleteness(profileJson)
      : Math.max(0, Math.min(100, completenessCandidate));
    await query(
      `INSERT INTO student_profiles (user_id, profile_json, completeness, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile_json = EXCLUDED.profile_json,
         completeness = EXCLUDED.completeness,
         updated_at = NOW()`,
      [id, JSON.stringify(profileJson), completeness]
    );
    res.json({ profile_json: profileJson, completeness });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/recommendations", async (req, res, next) => {
  try {
    await ensureAiTables();
    const { id } = req.params;
    const intent = String(req.body?.intent ?? "default");
    const profileResult = await query(`SELECT profile_json FROM student_profiles WHERE user_id = $1`, [id]);
    const profile = safeJson(profileResult.rows[0]?.profile_json, {});
    const matches = buildRecommendations(profile, intent);
    const runId = randomUUID();

    await query(
      `INSERT INTO recommendation_runs (run_id, user_id, profile_snapshot, intent, output)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)`,
      [runId, id, JSON.stringify(profile), intent, JSON.stringify(matches)]
    );
    await logEvent(id, "recommendation_generated", { run_id: runId, intent, count: matches.length });

    res.status(201).json({ run_id: runId, matches });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/goal-paths", async (req, res, next) => {
  try {
    await ensureAiTables();
    const { id } = req.params;
    const selectedPath = String(req.body?.selected_path ?? "").trim();
    if (!selectedPath) {
      return res.status(400).json({ error: "selected_path is required" });
    }
    const profileResult = await query(`SELECT profile_json FROM student_profiles WHERE user_id = $1`, [id]);
    const profile = safeJson(profileResult.rows[0]?.profile_json, {});
    const goalPath = buildGoalPath(selectedPath, profile);
    const goalPathId = randomUUID();

    await query(
      `INSERT INTO goal_paths (goal_path_id, user_id, selected_path, output)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [goalPathId, id, selectedPath, JSON.stringify(goalPath)]
    );
    await logEvent(id, "goal_path_generated", { goal_path_id: goalPathId, selected_path: selectedPath });

    res.status(201).json({ goal_path_id: goalPathId, goal_path: goalPath });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/goal-paths/:goalPathId", async (req, res, next) => {
  try {
    await ensureAiTables();
    const { id, goalPathId } = req.params;
    const result = await query(
      `SELECT output FROM goal_paths
       WHERE goal_path_id = $1 AND user_id = $2`,
      [goalPathId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Goal path not found" });
    }
    res.json({ goal_path: safeJson(result.rows[0].output, {}) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/goal-paths/:goalPathId/convert-to-goal", async (req, res, next) => {
  try {
    await ensureAiTables();
    await ensureMilestoneSchema();
    const { id, goalPathId } = req.params;
    const gpResult = await query(
      `SELECT selected_path FROM goal_paths
       WHERE goal_path_id = $1 AND user_id = $2`,
      [goalPathId, id]
    );
    if (gpResult.rows.length === 0) {
      return res.status(404).json({ error: "Goal path not found" });
    }
    const selectedPath = String(gpResult.rows[0].selected_path ?? "");

    const profileResult = await query(`SELECT profile_json FROM student_profiles WHERE user_id = $1`, [id]);
    const profile = safeJson(profileResult.rows[0]?.profile_json, {});

    const userResult = await query(
      `SELECT north_star_vision, definition_of_success FROM users WHERE id = $1`,
      [id]
    );
    const northStar = userResult.rows[0] ?? {};

    const { macroId, generatedCount } = await generateAndPersistMilestones(id, selectedPath, profile, northStar);

    await logEvent(id, "goal_path_converted", { goal_path_id: goalPathId, macro_id: macroId, generated_count: generatedCount });

    res.json({ ok: true, macro_id: macroId, generated_count: generatedCount });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id/next-step", async (req, res, next) => {
  try {
    await ensureMilestoneSchema();
    const { id } = req.params;
    // Source from the first incomplete daily milestone (by due_date, then created_at)
    const result = await query(
      `SELECT id, title, tier, due_date, created_at
       FROM milestones
       WHERE user_id = $1 AND tier = 'daily' AND status NOT IN ('complete', 'skipped')
       ORDER BY due_date ASC NULLS LAST, created_at ASC
       LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) {
      // Fall back to goal_paths if no milestones yet
      const gpResult = await query(
        `SELECT output FROM goal_paths WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [id]
      );
      if (gpResult.rows.length === 0) {
        return res.json({ next_step: null });
      }
      const goalPath = safeJson(gpResult.rows[0].output, {});
      const nextStep = deriveNextStep(goalPath);
      return res.json({ next_step: nextStep });
    }
    const row = result.rows[0];
    res.json({
      next_step: {
        label: row.title,
        week: row.due_date ? `Due ${row.due_date}` : "No due date",
        estimated_hours: 1,
        estimated_cost_usd: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/resource-recommendations", async (req, res, next) => {
  try {
    await ensureAiTables();
    await ensureResourceSchema();
    const { id } = req.params;
    const goalPathId = String(req.body?.goal_path_id ?? "").trim();
    const helpsStepNumber = Number(req.body?.helps_step_number ?? 1);
    const selectedPathFromBody = String(req.body?.selected_path ?? "").trim();
    const filters = req.body?.filters ?? {};

    let selectedPath = selectedPathFromBody;
    if (!selectedPath) {
      const gp = goalPathId
        ? await query(`SELECT selected_path FROM goal_paths WHERE goal_path_id = $1 AND user_id = $2 LIMIT 1`, [goalPathId, id])
        : await query(`SELECT selected_path FROM goal_paths WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]);
      selectedPath = String(gp.rows[0]?.selected_path ?? "");
    }

    const params = [];
    const where = [];

    if (selectedPath) {
      params.push(`%${selectedPath}%`);
      where.push(`(title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length} OR COALESCE(industry, '') ILIKE $${params.length})`);
    }
    if (filters.industry) {
      params.push(`%${String(filters.industry).trim()}%`);
      where.push(`COALESCE(industry, '') ILIKE $${params.length}`);
    }
    if (filters.education_level) {
      params.push(`%${String(filters.education_level).trim()}%`);
      where.push(`COALESCE(education_level, '') ILIKE $${params.length}`);
    }
    if (filters.format) {
      params.push(`%${String(filters.format).trim()}%`);
      where.push(`COALESCE(format, '') ILIKE $${params.length}`);
    }
    if (filters.location) {
      params.push(`%${String(filters.location).trim()}%`);
      where.push(`COALESCE(location, '') ILIKE $${params.length}`);
    }

    const sql = `
      SELECT resource_id, title, description, category, link, industry, education_level, format, location, deadline_date, cost_usd, eligibility_notes
      FROM resources
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY
        CASE WHEN category = 'Scholarships' THEN 0 WHEN category = 'Jobs' THEN 1 ELSE 2 END,
        title
      LIMIT 6
    `;
    let result = await query(sql, params);

    if (result.rows.length === 0) {
      result = await query(
        `SELECT resource_id, title, description, category, link, industry, education_level, format, location, deadline_date, cost_usd, eligibility_notes
         FROM resources
         ORDER BY category, title
         LIMIT 6`
      );
    }

    const recommendations = result.rows.map((row) => ({
      resource_id: Number(row.resource_id),
      title: row.title,
      description: row.description ?? null,
      category: row.category,
      link: row.link ?? null,
      why_this_helps: `Supports step #${helpsStepNumber} by giving you a concrete next action and verified information.`,
      helps_step_number: helpsStepNumber,
      eligibility: {
        education_level: row.education_level ?? null,
        location: row.location ?? null,
        estimated_cost_usd: row.cost_usd ?? null,
        deadline_date: row.deadline_date ?? null,
      },
    }));
    const citations = recommendations.map((r) => r.resource_id);
    await logEvent(id, "resource_recommendations_generated", {
      goal_path_id: goalPathId || null,
      selected_path: selectedPath || null,
      helps_step_number: helpsStepNumber,
      citations_count: citations.length,
    });

    res.status(201).json({ citations, recommendations });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id/onboarding", async (req, res, next) => {
  try {
    await ensureAiTables();
    await ensureMilestoneSchema();
    const { id } = req.params;
    await assertUserExists(id);

    const { background, goal, interests, challenge, weekly_time } = req.body ?? {};

    if (typeof background === "string" && background.trim()) {
      await query(
        `UPDATE users SET current_grade_level = $1 WHERE id = $2`,
        [background.trim().slice(0, 50), id]
      );
    }

    const safeInterests = Array.isArray(interests)
      ? interests.filter((i) => typeof i === "string").map((i) => i.trim()).filter(Boolean).slice(0, 10)
      : [];

    const onboardingPatch = {
      ...(goal ? { exploration_mode: String(goal).trim().slice(0, 100) } : {}),
      ...(safeInterests.length > 0 ? { interests: safeInterests } : {}),
      ...(challenge ? { constraints: [String(challenge).trim().slice(0, 200)] } : {}),
      preferences: {
        ...(background ? { background: String(background).trim().slice(0, 100) } : {}),
        ...(weekly_time ? { weekly_time: String(weekly_time).trim().slice(0, 50) } : {}),
      },
    };

    await query(
      `INSERT INTO student_profiles (user_id, profile_json, completeness, updated_at)
       VALUES ($1, $2::jsonb, 20, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         profile_json = student_profiles.profile_json || $2::jsonb,
         completeness = GREATEST(student_profiles.completeness, 20),
         updated_at = NOW()`,
      [id, JSON.stringify(onboardingPatch)]
    );

    await logEvent(id, "onboarding_completed", {
      background: background ?? null,
      goal: goal ?? null,
      interests_count: safeInterests.length,
      challenge: challenge ?? null,
      weekly_time: weekly_time ?? null,
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error?.status) || 500;
  const code = String(error?.code || "INTERNAL_SERVER_ERROR");
  const message = status >= 500 ? "Internal server error" : String(error?.message || "Request failed");
  const payload = { error: { code, message } };
  if (error?.details && typeof error.details === "object") {
    payload.error.details = error.details;
  }
  res.status(status).json(payload);
});

export { app };

export async function start() {
  await testDbConnection();
  await ensureAiTables();
  await ensureResourceSchema();
  await ensureMilestoneSchema();
  return new Promise((resolve, reject) => {
    app.listen(PORT, () => {
      console.log(`Backend API listening on port ${PORT}`);
      resolve();
    }).on("error", reject);
  });
}

const isMain = process.argv[1]?.endsWith("server.js");
if (isMain) {
  start().catch((error) => {
    console.error("Failed to connect to PostgreSQL", error);
    process.exit(1);
  });
}
