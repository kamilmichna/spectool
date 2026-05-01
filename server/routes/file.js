import express from "express";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

function isSafePath(rootPaths, requestedPath) {
  if (!requestedPath || typeof requestedPath !== "string") {
    return false;
  }
  if (path.extname(requestedPath) !== ".md") {
    return false;
  }

  for (const rp of rootPaths) {
    const resolved = path.resolve(rp, requestedPath);
    const relative = path.relative(rp, resolved);
    if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
      return true;
    }
  }

  return false;
}

function createFileRouter(config) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const requestedPath = req.query.path;
      if (!isSafePath(config.rootPaths, requestedPath)) {
        res.status(400).json({ error: "Invalid path" });
        return;
      }

      let absolutePath = null;
      for (const rp of config.rootPaths) {
        const p = path.resolve(rp, requestedPath);
        if (fs.existsSync(p)) {
          absolutePath = p;
          break;
        }
      }

      if (!absolutePath) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      const content = await fsp.readFile(absolutePath, "utf8");
      res.json({ content });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { createFileRouter, isSafePath };
