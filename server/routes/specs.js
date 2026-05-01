import express from "express";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { detectFramework, getAdapters } from "../adapters/index.js";
import { parseTaskProgress } from "../utils/taskProgress.js";

function collectTaskFiles(sections) {
  const tasks = [];
  for (const section of sections) {
    if (section.files) {
      for (const file of section.files) {
        if (file.path && file.path.endsWith("tasks.md")) {
          tasks.push(file);
        }
      }
    }
    if (section.children) {
      tasks.push(...collectTaskFiles(section.children));
    }
  }
  return tasks;
}

async function addTaskProgress(rootPath, sections) {
  const taskFiles = collectTaskFiles(sections);
  for (const file of taskFiles) {
    const absPath = path.resolve(rootPath, file.path);
    if (!fs.existsSync(absPath)) {
      continue;
    }
    const content = await fsp.readFile(absPath, "utf8");
    file.progress = parseTaskProgress(content);
  }
}

function createSpecsRouter(config) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const results = await Promise.all(config.rootPaths.map(async (rp) => {
        let adapter;
        if (config.provider && config.provider !== "auto") {
          const adapters = getAdapters();
          adapter = adapters.find(a => a.name === config.provider) || detectFramework(rp).adapter;
        } else {
          adapter = detectFramework(rp).adapter;
        }
        const sections = await adapter.buildTree(rp);
        await addTaskProgress(rp, sections);
        if (config.rootPaths.length > 1) {
           return [{
             id: path.basename(rp),
             label: `Repo: ${path.basename(rp)}`,
             type: "repo",
             children: sections
           }];
        }
        return sections;
      }));

      const sections = results.flat();
      let framework = config.provider && config.provider !== "auto" ? config.provider : "mixed";
      if (config.rootPaths.length === 1 && (!config.provider || config.provider === "auto")) {
         framework = detectFramework(config.rootPaths[0]).adapter.name;
      }

      res.json({
        framework,
        rootPath: config.rootPaths.length > 1 ? "Multiple Repos" : config.rootPaths[0],
        sections,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { createSpecsRouter };
