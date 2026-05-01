import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { toPosixPath } from "./types.js";

function detect(rootPath) {
  let score = 0;
  if (fs.existsSync(path.join(rootPath, "changes"))) {
    score += 60;
  }
  if (fs.existsSync(path.join(rootPath, "AGENTS.md"))) {
    score += 30;
  }
  if (fs.existsSync(path.join(rootPath, "openspec", "changes"))) {
    score += 40;
  }
  return Math.min(score, 100);
}

async function findChangesRoots(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];
  const roots = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    let hasChanges = false;
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === "changes") {
         roots.push(path.join(dir, "changes"));
         hasChanges = true;
      } else if (entry.isDirectory() && entry.name === "openspec") {
         const nested = path.join(dir, "openspec", "changes");
         if (fs.existsSync(nested)) {
            roots.push(nested);
            hasChanges = true;
         }
      }
    }
    if (!hasChanges) {
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          roots.push(...(await findChangesRoots(path.join(dir, entry.name), depth + 1, maxDepth)));
        }
      }
    }
  } catch (err) {
    // ignore permission errors
  }
  return roots;
}

async function buildTree(rootPath) {
  const changesRoots = await findChangesRoots(rootPath);
  if (changesRoots.length === 0) {
    return [];
  }

  const allSections = [];

  for (const changesRoot of changesRoots) {
    const entries = await fsp.readdir(changesRoot, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const changeDir = path.join(changesRoot, entry.name);
      const files = [];
      const fileDefs = [
        { name: "proposal.md", label: "Proposal" },
        { name: "design.md", label: "Design" },
        { name: "tasks.md", label: "Tasks" },
      ];

      for (const def of fileDefs) {
        const absPath = path.join(changeDir, def.name);
        if (!fs.existsSync(absPath)) {
          continue;
        }
        const stat = await fsp.stat(absPath);
        files.push({
          path: toPosixPath(path.relative(rootPath, absPath)),
          label: def.label,
          modified: stat.mtime.toISOString(),
        });
      }

      if (files.length > 0) {
        children.push({
          id: toPosixPath(path.relative(rootPath, changeDir)),
          label: entry.name,
          type: "proposal",
          files,
        });
      }
    }

    if (children.length > 0) {
      let label = "Changes";
      if (changesRoots.length > 1) {
         const rel = path.relative(rootPath, changesRoot);
         label = `Changes (${rel})`;
      }
      allSections.push({
        id: toPosixPath(path.relative(rootPath, changesRoot)),
        label: label,
        type: "proposals",
        children,
      });
    }
  }

  return allSections;
}

export default {
  name: "openspec",
  detect,
  buildTree,
};
