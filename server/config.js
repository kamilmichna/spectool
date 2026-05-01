import fs from "node:fs";
import path from "node:path";

function resolveConfig(args) {
  const portValue = args.port ?? 3000;
  const port = Number(portValue);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid --port. Must be a positive number.");
  }

  const dirValue = args.dir ?? process.cwd();
  const rootPaths = [];
  if (args.dirs && Array.isArray(args.dirs)) {
    args.dirs.forEach(d => {
      const rp = path.resolve(d);
      if (fs.existsSync(rp) && fs.statSync(rp).isDirectory()) {
        rootPaths.push(rp);
      }
    });
  } else {
    const rootPath = path.resolve(dirValue);
    if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
      throw new Error("Invalid --dir. Directory does not exist.");
    }
    rootPaths.push(rootPath);
  }

  const provider = args.provider || "auto";

  const watch = args.watch !== undefined ? Boolean(args.watch) : true;
  const open = args.open !== undefined ? Boolean(args.open) : true;

  return {
    port,
    rootPaths,
    provider,
    watch,
    open,
    rootPath: rootPaths[0], // fallback for backward compatibility
  };
}

export { resolveConfig };
