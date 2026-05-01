import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { toPosixPath } from "./types.js";

function detect() {
  return 0;
}

async function listMarkdownFiles(dir, rootPath, recursive) {
  const files = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        const nested = await listMarkdownFiles(absPath, rootPath, true);
        files.push(...nested);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push({
        path: toPosixPath(path.relative(rootPath, absPath)),
        label: entry.name,
      });
    }
  }

  return files;
}

async function buildTree(rootPath) {
  const files = [];
  files.push(...(await listMarkdownFiles(rootPath, rootPath, false)));

  const docsPath = path.join(rootPath, "docs");
  if (fs.existsSync(docsPath)) {
    files.push(...(await listMarkdownFiles(docsPath, rootPath, true)));
  }

  return [
    {
      id: "docs",
      label: "Docs",
      type: "docs",
      files,
    },
  ];
}

export default {
  name: "generic",
  detect,
  buildTree,
};
