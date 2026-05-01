#!/usr/bin/env node

import mri from "mri";
import { resolveConfig } from "../server/config.js";
import { startServer } from "../server/index.js";
import { select, checkbox } from "@inquirer/prompts";
import fs from "node:fs";
import path from "node:path";

function printHelp() {
  console.log(
    [
      "spectool",
      "",
      "Usage:",
      "  spectool [--port 3000] [--dir /path/to/project] [--no-open] [--watch]",
      "",
      "Options:",
      "  --port     HTTP port (default: 3000)",
      "  --dir      Project root directory (default: cwd)",
      "  --no-open  Do not open browser automatically",
      "  --watch    Enable file watching (default: true)",
      "  --help     Show this help",
    ].join("\n"),
  );
}

async function main() {
  const args = mri(process.argv.slice(2), {
    boolean: ["open", "watch", "help"],
    default: {
      open: true,
      watch: true,
    },
  });

  if (args.help) {
    printHelp();
    return;
  }

  let config = resolveConfig(args);

  if (!args.dir && process.stdin.isTTY) {
    try {
      const cwd = process.cwd();
      const entries = await fs.promises.readdir(cwd, { withFileTypes: true });
      const subDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules').map(e => e.name);

      const dirChoice = await select({
        message: "Select project directory:",
        choices: [
          { name: "Current Directory (Auto detect all)", value: "current" },
          { name: "Select specific subdirectories (Multiple repos)", value: "multiple" }
        ]
      });

      let selectedDirs = [cwd];
      if (dirChoice === "multiple" && subDirs.length > 0) {
        const chosen = await checkbox({
          message: "Select repositories:",
          choices: subDirs.map(d => ({ name: d, value: path.join(cwd, d) }))
        });
        if (chosen.length > 0) {
          selectedDirs = chosen;
        }
      }

      const providerChoice = await select({
        message: "Select provider:",
        choices: [
          { name: "Auto detect", value: "auto" },
          { name: "OpenSpec", value: "openspec" },
          { name: "Generic (Markdown files)", value: "generic" }
        ]
      });

      args.dirs = selectedDirs;
      args.provider = providerChoice;
      config = resolveConfig(args);
    } catch (err) {
      // fallback to default if TUI fails
      console.warn("TUI failed, using defaults:", err.message);
    }
  }

  console.log("Starting spectool...");
  console.log(`Roots: ${config.rootPaths.join(", ")}`);
  console.log(`Port: ${config.port}`);
  console.log(`Watch: ${config.watch ? "on" : "off"}`);

  const { url } = await startServer(config);
  console.log(`Server running at ${url}`);
}

main().catch((err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      "Error: port is already in use. Use --port to choose another.",
    );
  } else {
    console.error(
      err && err.message ? `Error: ${err.message}` : "Error: failed to start",
    );
  }
  process.exit(1);
});
