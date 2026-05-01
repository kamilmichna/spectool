import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import open from "open";
import { createSpecsRouter } from "./routes/specs.js";
import { createFileRouter } from "./routes/file.js";
import { createSearchRouter } from "./routes/search.js";
import { createWsServer } from "./ws.js";
import { detectFramework, getAdapters } from "./adapters/index.js";
import { startWatcher } from "./watch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createApp(config) {
  const app = express();

  app.use("/api/specs", createSpecsRouter(config));
  app.use("/api/file", createFileRouter(config));
  app.use("/api/search", createSearchRouter(config));

  const clientDist = path.join(__dirname, "../client/dist");
  if (!fs.existsSync(clientDist)) {
    console.warn(
      "Warning: client/dist is missing. Build the client before running in production.",
    );
  }

  app.use(express.static(clientDist));

  app.get("*", (req, res) => {
    const indexPath = path.join(clientDist, "index.html");
    if (!fs.existsSync(indexPath)) {
      res
        .status(404)
        .send("Client build not found. Run the client build first.");
      return;
    }
    res.sendFile(indexPath);
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

function startServer(config) {
  const app = createApp(config);
  const server = http.createServer(app);
  let watcher = null;
  const { broadcast } = createWsServer(server);

  return new Promise((resolve, reject) => {
    server.on("error", (err) => reject(err));
    server.listen(config.port, () => {
      if (config.watch) {
        Promise.all(config.rootPaths.map(async (rp) => {
          let adapter;
          if (config.provider && config.provider !== "auto") {
            const adapters = getAdapters();
            adapter = adapters.find(a => a.name === config.provider) || detectFramework(rp).adapter;
          } else {
            adapter = detectFramework(rp).adapter;
          }
          const sections = await adapter.buildTree(rp);
          if (config.rootPaths.length > 1) {
             return [{
               id: path.basename(rp),
               label: `Repo: ${path.basename(rp)}`,
               type: "repo",
               children: sections
             }];
          }
          return sections;
        })).then(results => {
          const sections = results.flat();
          watcher = startWatcher({
            rootPath: config.rootPaths[0],
            sections,
            broadcast,
          });
        }).catch((err) => {
          console.warn(`Warning: failed to start watcher: ${err.message}`);
        });
      }
      const url = `http://localhost:${config.port}`;
      if (config.open) {
        // open(url).catch((err) => {
        //   console.warn(`Warning: failed to open browser: ${err.message}`);
        // });
      }
      resolve({ app, server, url, watcher });
    });
  });
}

export { createApp, startServer };
