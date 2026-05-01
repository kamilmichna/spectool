import chokidar from "chokidar";
import path from "node:path";
import { toPosixPath } from "./adapters/types.js";

function collectFilePaths(sections) {
  const paths = [];
  for (const section of sections) {
    if (section.files) {
      for (const file of section.files) {
        paths.push(file.path);
      }
    }
    if (section.children) {
      paths.push(...collectFilePaths(section.children));
    }
  }
  return paths;
}

function startWatcher({ rootPath, sections, broadcast }) {
  const filePaths = collectFilePaths(sections).map((filePath) =>
    path.resolve(rootPath, filePath),
  );

  if (filePaths.length === 0) {
    return null;
  }

  const watcher = chokidar.watch(filePaths, {
    ignoreInitial: true,
  });

  const notify = (filePath) => {
    const relative = toPosixPath(path.relative(rootPath, filePath));
    broadcast({ type: "file_changed", path: relative });
  };

  watcher.on("add", notify);
  watcher.on("change", notify);
  watcher.on("unlink", notify);

  return watcher;
}

export { startWatcher };
