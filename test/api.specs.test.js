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

test("GET /api/specs returns framework and sections", async () => {
  const rootPath = path.join(__dirname, "fixtures", "openspec");
  const app = createApp(createConfig(rootPath));

  const response = await request(app).get("/api/specs");

  assert.equal(response.status, 200);
  assert.equal(response.body.framework, "openspec");
  assert.ok(Array.isArray(response.body.sections));
});
