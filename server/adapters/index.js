import openspec from "./openspec.js";
import generic from "./generic.js";

function getAdapters() {
  return [openspec, generic];
}

function detectFramework(rootPath) {
  let best = { adapter: generic, score: 0 };

  for (const adapter of getAdapters()) {
    const score = adapter.detect(rootPath);
    if (score > best.score) {
      best = { adapter, score };
    }
  }

  if (best.score <= 0) {
    return { adapter: generic, score: 0 };
  }

  return best;
}

export { getAdapters, detectFramework };
