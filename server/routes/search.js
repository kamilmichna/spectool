import express from "express";
import path from "node:path";
import fsp from "node:fs/promises";
import fs from "node:fs";
import Fuse from "fuse.js";
import { detectFramework, getAdapters } from "../adapters/index.js";

async function getTreeFiles(config) {
  const allFiles = [];
  await Promise.all(config.rootPaths.map(async (rp) => {
    let adapter;
    if (config.provider && config.provider !== "auto") {
      const adapters = getAdapters();
      adapter = adapters.find(a => a.name === config.provider) || detectFramework(rp).adapter;
    } else {
      adapter = detectFramework(rp).adapter;
    }
    let sections = [];
    try {
      sections = await adapter.buildTree(rp);
    } catch (err) {
      console.warn(`search.js: failed to build tree for ${rp}:`, err.message);
      return;
    }

    function extract(sectionsList, sectionName) {
      if (!sectionsList || !Array.isArray(sectionsList)) {
        console.warn("search.js: extract called with invalid sectionsList:", sectionsList);
        return;
      }
      for (const sec of sectionsList) {
        if (sec.files) {
          for (const f of sec.files) {
            allFiles.push({
              rp,
              path: f.path,
              label: f.label,
              section: sectionName || sec.label,
            });
          }
        }
        if (sec.children) {
          extract(sec.children, sectionName || sec.label);
        }
      }
    }
    extract(sections, "");
  }));
  return allFiles;
}

function buildSnippet(content, match, contextLength = 40) {
  if (!content || !match || !match.indices || match.indices.length === 0) {
    return "";
  }

  const [start, end] = match.indices[0];
  const sliceStart = Math.max(0, start - contextLength);
  const sliceEnd = Math.min(content.length, end + 1 + contextLength);
  let snippet = content.slice(sliceStart, sliceEnd).replace(/\s+/g, " ").trim();
  if (sliceStart > 0) snippet = "..." + snippet;
  if (sliceEnd < content.length) snippet = snippet + "...";
  return snippet;
}

function createSearchRouter(config) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const query = (req.query.q || "").toLowerCase().trim();
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      const files = await getTreeFiles(config);

      const indexed = (await Promise.all(files.map(async (file) => {
        const absPath = path.resolve(file.rp, file.path);
        if (!fs.existsSync(absPath)) return null;
        try {
          const content = await fsp.readFile(absPath, "utf8");
          return {
            path: file.path,
            label: file.label,
            section: file.section,
            content,
          };
        } catch (err) {
          console.warn(`search.js: failed to read ${absPath}:`, err.message);
          return null;
        }
      }))).filter(Boolean);

      const fuse = new Fuse(indexed, {
        includeMatches: true,
        includeScore: true,
        minMatchCharLength: 2,
        threshold: 0.35,
        ignoreLocation: true,
        keys: [
          { name: "label", weight: 0.5 },
          { name: "path", weight: 0.2 },
          { name: "content", weight: 0.6 },
        ],
      });

      const results = fuse.search(query, { limit: 30 }).map((result) => {
        const matches = result.matches || [];
        const contentMatch = matches.find((match) => match.key === "content");
        const labelMatch = matches.find((match) => match.key === "label");
        const snippet = contentMatch
          ? buildSnippet(result.item.content, contentMatch)
          : labelMatch
            ? buildSnippet(result.item.label, labelMatch, 10)
            : "";

        return {
          path: result.item.path,
          label: result.item.label,
          section: result.item.section,
          snippet,
        };
      });

      res.json({ results });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { createSearchRouter };
