function parseTaskProgress(markdown) {
  const lines = markdown.split(/\r?\n/);
  let total = 0;
  let done = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
      total += 1;
      done += 1;
    } else if (trimmed.startsWith("- [ ]")) {
      total += 1;
    }
  }

  return { total, done };
}

export { parseTaskProgress };
