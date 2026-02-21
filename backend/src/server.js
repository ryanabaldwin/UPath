import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { query, testDbConnection } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()),
  })
);

app.use(express.json());

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

app.get("/api/progress", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT
         p.id,
         p.goal_id,
         p.milestone1_is_complete,
         p.milestone2_is_complete,
         p.milestone_n_is_complete
       FROM progressstatus p
       ORDER BY p.goal_id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.user_first, u.user_last, u.user_region, u.goal_id, u.user_img_src, g.title AS goal_title
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

app.get("/api/users/:id/progress", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.id, p.goal_id, p.milestone1_is_complete, p.milestone2_is_complete, p.milestone_n_is_complete,
              g.title AS goal_title, g.milestone1, g.milestone2, g.milestone_n
       FROM progressstatus p
       JOIN goals g ON g.goal_id = p.goal_id
       WHERE p.id = $1
       ORDER BY p.goal_id`,
      [id]
    );
    res.json(result.rows);
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
    const gid = Number(goalId);
    await query(
      `INSERT INTO progressstatus (id, goal_id, milestone1_is_complete, milestone2_is_complete, milestone_n_is_complete)
       VALUES ($1, $2, FALSE, FALSE, FALSE)
       ON CONFLICT (id, goal_id) DO NOTHING`,
      [id, gid]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/progress", async (req, res, next) => {
  try {
    const { id } = req.params;
    const goalId = req.body?.goal_id;
    if (goalId == null || Number.isNaN(Number(goalId))) {
      return res.status(400).json({ error: "Valid goal_id required" });
    }
    const gid = Number(goalId);
    await query(
      `INSERT INTO progressstatus (id, goal_id, milestone1_is_complete, milestone2_is_complete, milestone_n_is_complete)
       VALUES ($1, $2, FALSE, FALSE, FALSE)
       ON CONFLICT (id, goal_id) DO NOTHING`,
      [id, gid]
    );
    const result = await query(
      `SELECT p.id, p.goal_id, p.milestone1_is_complete, p.milestone2_is_complete, p.milestone_n_is_complete
       FROM progressstatus p WHERE p.id = $1 AND p.goal_id = $2`,
      [id, gid]
    );
    res.status(201).json(result.rows[0] ?? { id, goal_id: gid });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/progress/:userId/:goalId", async (req, res, next) => {
  try {
    const { userId, goalId } = req.params;
    const gid = parseInt(goalId, 10);
    if (Number.isNaN(gid)) {
      return res.status(400).json({ error: "Invalid goal_id" });
    }
    const body = req.body || {};
    const updates = [];
    const values = [];
    let i = 1;
    if (typeof body.milestone1_is_complete === "boolean") {
      updates.push(`milestone1_is_complete = $${i++}`);
      values.push(body.milestone1_is_complete);
    }
    if (typeof body.milestone2_is_complete === "boolean") {
      updates.push(`milestone2_is_complete = $${i++}`);
      values.push(body.milestone2_is_complete);
    }
    if (typeof body.milestone_n_is_complete === "boolean") {
      updates.push(`milestone_n_is_complete = $${i++}`);
      values.push(body.milestone_n_is_complete);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "At least one milestone status required" });
    }
    values.push(userId, gid);
    const result = await query(
      `UPDATE progressstatus
       SET ${updates.join(", ")}
       WHERE id = $${i} AND goal_id = $${i + 1}
       RETURNING id, goal_id, milestone1_is_complete, milestone2_is_complete, milestone_n_is_complete`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Progress record not found" });
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
    const category = req.query.category;
    let sql = `SELECT resource_id, title, description, category, link FROM resources ORDER BY category, title`;
    const params = [];
    if (category && String(category).trim()) {
      sql = `SELECT resource_id, title, description, category, link FROM resources WHERE category = $1 ORDER BY title`;
      params.push(String(category).trim());
    }
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

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

export { app };

export async function start() {
  await testDbConnection();
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
