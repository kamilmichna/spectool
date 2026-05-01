import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { createApp } from "../server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createConfig(rootPath) {
  return {
    port: 0,
    rootPath,
    watch: false,
    open: false,
  };
}

test("GET /api/file returns markdown content", async () => {
  const rootPath = path.join(__dirname, "fixtures", "openspec");
  const app = createApp(createConfig(rootPath));

  const response = await request(app).get(
    "/api/file?path=changes/add-auth/proposal.md",
  );

  assert.equal(response.status, 200);
  assert.ok(response.body.content.includes("Test proposal"));
});

test("GET /api/file rejects traversal", async () => {
  const rootPath = path.join(__dirname, "fixtures", "openspec");
  const app = createApp(createConfig(rootPath));

  const response = await request(app).get("/api/file?path=../secrets.md");

  assert.equal(response.status, 400);
});
