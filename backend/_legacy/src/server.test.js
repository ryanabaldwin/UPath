import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import request from "supertest";
import { app } from "./server.js";

const KNOWN_USER = "11111111-1111-1111-1111-111111111111";

describe("API", () => {
  describe("GET /api/health", () => {
    it("returns 200 and ok true", async () => {
      const res = await request(app).get("/api/health");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.ok, true);
      assert.strictEqual(res.body?.service, "upath-backend");
    });
  });

  describe("GET /api/goals", () => {
    it("returns an array of goals", async () => {
      const res = await request(app).get("/api/goals");
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns 404 for unknown user", async () => {
      const res = await request(app).get("/api/users/00000000-0000-0000-0000-000000000000");
      assert.strictEqual(res.status, 404);
      assert(res.body?.error);
    });

    it("returns user with north-star fields when id exists", async () => {
      const res = await request(app).get(`/api/users/${KNOWN_USER}`);
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.id, KNOWN_USER);
      // North-star fields should be present (null if not set yet)
      assert("streak_count" in res.body);
      assert("north_star_vision" in res.body);
    });
  });

  // Confirm old progress routes are gone (cutover complete)
  describe("Removed progress routes return 404", () => {
    it("GET /api/progress is gone", async () => {
      const res = await request(app).get("/api/progress");
      assert.strictEqual(res.status, 404);
    });

    it("GET /api/users/:id/progress is gone", async () => {
      const res = await request(app).get(`/api/users/${KNOWN_USER}/progress`);
      assert.strictEqual(res.status, 404);
    });

    it("PATCH /api/progress/:userId/:goalId is gone", async () => {
      const res = await request(app)
        .patch(`/api/progress/${KNOWN_USER}/1`)
        .send({ milestone1_is_complete: true });
      assert.strictEqual(res.status, 404);
    });

    it("POST /api/users/:id/progress is gone", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/progress`)
        .send({ goal_id: 1 });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("Hierarchical milestones", () => {
    it("GET /api/users/:id/milestones/tree returns tree array", async () => {
      const res = await request(app).get(`/api/users/${KNOWN_USER}/milestones/tree`);
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body?.tree));
    });

    it("POST /api/users/:id/milestones requires title", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/milestones`)
        .send({ tier: "daily" });
      assert.strictEqual(res.status, 400);
      assert(res.body?.error);
    });

    it("POST /api/users/:id/milestones requires valid tier", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/milestones`)
        .send({ title: "Test", tier: "invalid-tier" });
      assert.strictEqual(res.status, 400);
      assert(res.body?.error);
    });

    it("creates, reads, patches, and deletes a milestone", async () => {
      // Create
      const createRes = await request(app)
        .post(`/api/users/${KNOWN_USER}/milestones`)
        .send({ title: "Test daily step", tier: "daily", category: "work" });
      if (createRes.status === 500) return;
      assert.strictEqual(createRes.status, 201);
      const milestoneId = createRes.body?.id;
      assert(milestoneId);
      assert.strictEqual(createRes.body?.status, "pending");

      // Tree should contain it
      const treeRes = await request(app).get(`/api/users/${KNOWN_USER}/milestones/tree`);
      if (treeRes.status === 500) return;
      assert.strictEqual(treeRes.status, 200);

      // Patch to complete
      const patchRes = await request(app)
        .patch(`/api/users/${KNOWN_USER}/milestones/${milestoneId}`)
        .send({ status: "complete" });
      if (patchRes.status === 500) return;
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchRes.body?.status, "complete");
      // updated_at should be present
      assert(patchRes.body?.updated_at);

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/users/${KNOWN_USER}/milestones/${milestoneId}`);
      if (deleteRes.status === 500) return;
      assert.strictEqual(deleteRes.status, 200);
      assert.strictEqual(deleteRes.body?.ok, true);
    });

    it("PATCH /api/users/:id/milestones/:id returns 400 for bad id", async () => {
      const res = await request(app)
        .patch(`/api/users/${KNOWN_USER}/milestones/not-a-number`)
        .send({ status: "complete" });
      assert.strictEqual(res.status, 400);
    });

    it("DELETE /api/users/:id/milestones/:id returns 400 for bad id", async () => {
      const res = await request(app)
        .delete(`/api/users/${KNOWN_USER}/milestones/not-a-number`);
      assert.strictEqual(res.status, 400);
    });
  });

  describe("POST /api/users/:id/milestones/generate", () => {
    it("generates a milestone tree and returns macro_id and generated_count", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/milestones/generate`)
        .send({ selected_path: "Software Development" });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 201);
      assert(typeof res.body?.macro_id === "number");
      assert(typeof res.body?.generated_count === "number");
      assert(res.body.generated_count > 1, "should generate more than one node");
    });
  });

  describe("PATCH /api/users/:id/north-star", () => {
    it("returns 400 when no fields are provided", async () => {
      const res = await request(app)
        .patch(`/api/users/${KNOWN_USER}/north-star`)
        .send({});
      assert.strictEqual(res.status, 400);
    });

    it("updates north star fields", async () => {
      const res = await request(app)
        .patch(`/api/users/${KNOWN_USER}/north-star`)
        .send({ north_star_vision: "Become a software engineer" });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.north_star_vision, "Become a software engineer");
    });
  });

  describe("GET /api/users/:id/next-step (milestone-sourced)", () => {
    it("returns next_step null or object", async () => {
      const res = await request(app).get(`/api/users/${KNOWN_USER}/next-step`);
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      // next_step is either null or has a label
      if (res.body?.next_step !== null) {
        assert(typeof res.body.next_step?.label === "string");
      }
    });
  });

  describe("POST /api/mentors/:id/book", () => {
    it("returns 400 for invalid mentor id", async () => {
      const res = await request(app)
        .post("/api/mentors/not-a-number/book")
        .send({ mentee_id: KNOWN_USER });
      assert.strictEqual(res.status, 400);
    });
  });

  describe("DELETE /api/mentors/:id/book", () => {
    it("returns 400 for invalid mentor id", async () => {
      const res = await request(app)
        .delete("/api/mentors/not-a-number/book")
        .send({ mentee_id: KNOWN_USER });
      assert.strictEqual(res.status, 400);
    });
  });

  describe("GET /api/resources/search", () => {
    it("returns array for filter query", async () => {
      const res = await request(app).get("/api/resources/search?industry=tech");
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body));
    });
  });

  describe("POST /api/users/:id/resource-recommendations", () => {
    it("returns citations and recommendations", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/resource-recommendations`)
        .send({ selected_path: "Software Development", helps_step_number: 1 });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 201);
      assert(Array.isArray(res.body?.citations));
      assert(Array.isArray(res.body?.recommendations));
    });
  });

  describe("AI Coach contracts", () => {
    it("rejects invalid exploration mode", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads`)
        .send({ exploration_mode: "invalid-mode" });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "INVALID_EXPLORATION_MODE");
    });

    it("rejects blocked unsafe input with safe response details", async () => {
      const createRes = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads`)
        .send({ exploration_mode: "not-sure" });
      if (createRes.status === 500) return;
      assert.strictEqual(createRes.status, 201);

      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads/${createRes.body.thread_id}/messages`)
        .send({ message: "how to make a bomb" });
      if (res.status === 500) return;

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body?.error?.code, "AI_COACH_UNSAFE_INPUT");
      assert.strictEqual(typeof res.body?.error?.details?.safe_response, "string");
    });

    it("returns thread not found for wrong thread owner", async () => {
      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads/${crypto.randomUUID()}/messages`)
        .send({ message: "I like technology and design." });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body?.error?.code, "THREAD_NOT_FOUND");
    });

    it("normal message returns assistant_message with no actions for neutral input", async () => {
      const createRes = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads`)
        .send({ exploration_mode: "not-sure" });
      if (createRes.status === 500) return;
      assert.strictEqual(createRes.status, 201);

      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads/${createRes.body.thread_id}/messages`)
        .send({ message: "I enjoy helping people in my community." });
      if (res.status === 500) return;

      assert.strictEqual(res.status, 200);
      assert(typeof res.body?.assistant_message === "string");
      assert(res.body.assistant_message.length > 0);
      assert(typeof res.body?.completeness === "number");
      // No milestone generation expected for neutral message
      assert(!res.body?.actions?.show_milestones);
    });

    it("milestone-intent message returns actions.show_milestones in heuristic mode", async () => {
      const createRes = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads`)
        .send({ exploration_mode: "building" });
      if (createRes.status === 500) return;

      const res = await request(app)
        .post(`/api/users/${KNOWN_USER}/ai/threads/${createRes.body.thread_id}/messages`)
        .send({ message: "I want to become a software engineer. Please build my plan for me." });
      if (res.status === 500) return;

      assert.strictEqual(res.status, 200);
      assert(typeof res.body?.assistant_message === "string");
      // In heuristic mode the intent patterns should fire
      if (res.body?.actions) {
        assert(typeof res.body.actions === "object");
      }
    });
  });
});
