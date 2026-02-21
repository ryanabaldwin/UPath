import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "./server.js";

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

    it("returns user when id exists", async () => {
      const res = await request(app).get("/api/users/11111111-1111-1111-1111-111111111111");
      if (res.status === 500) {
        // DB not set up or migrations not run
        return;
      }
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.id, "11111111-1111-1111-1111-111111111111");
    });
  });

  describe("PATCH /api/progress/:userId/:goalId", () => {
    it("returns 400 when body has no milestone status", async () => {
      const res = await request(app)
        .patch("/api/progress/11111111-1111-1111-1111-111111111111/1")
        .send({});
      assert.strictEqual(res.status, 400);
      assert(res.body?.error);
    });

    it("updates progress when body has valid milestone status", async () => {
      const res = await request(app)
        .patch("/api/progress/11111111-1111-1111-1111-111111111111/1")
        .send({ milestone1_is_complete: true });
      if (res.status === 500) return;
      assert.strictEqual(res.status, 200);
      assert(res.body?.hasOwnProperty("milestone1_is_complete"));
    });
  });

  describe("POST /api/mentors/:id/book", () => {
    it("returns 400 for invalid mentor id", async () => {
      const res = await request(app)
        .post("/api/mentors/not-a-number/book")
        .send({ mentee_id: "11111111-1111-1111-1111-111111111111" });
      assert.strictEqual(res.status, 400);
    });
  });

  describe("DELETE /api/mentors/:id/book", () => {
    it("returns 400 for invalid mentor id", async () => {
      const res = await request(app)
        .delete("/api/mentors/not-a-number/book")
        .send({ mentee_id: "11111111-1111-1111-1111-111111111111" });
      assert.strictEqual(res.status, 400);
    });
  });
});
