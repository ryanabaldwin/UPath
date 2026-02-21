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

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

testDbConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to PostgreSQL", error);
    process.exit(1);
  });
