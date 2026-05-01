import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import openspec from "../server/adapters/openspec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("openspec adapter builds change tree", async () => {
  const rootPath = path.join(__dirname, "fixtures", "openspec");
  const sections = await openspec.buildTree(rootPath);

  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, "changes");
  assert.ok(Array.isArray(sections[0].children));

  const child = sections[0].children.find((item) => item.label === "add-auth");
  assert.ok(child, "Expected add-auth change");

  const filePaths = child.files.map((file) => file.path);
  assert.ok(filePaths.includes("changes/add-auth/proposal.md"));
  assert.ok(filePaths.includes("changes/add-auth/design.md"));
  assert.ok(filePaths.includes("changes/add-auth/tasks.md"));
});
