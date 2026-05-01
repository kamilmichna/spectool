import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectFramework } from "../server/adapters/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("detectFramework selects openspec", () => {
  const rootPath = path.join(__dirname, "fixtures", "openspec");
  const result = detectFramework(rootPath);

  assert.equal(result.adapter.name, "openspec");
  assert.ok(result.score > 0);
});
