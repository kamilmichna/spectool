# spectool

Universal spec viewer for spec-driven development frameworks.

## Quick start

```bash
npm install
npm run client:build
node bin/spectool.js
```

Then open http://localhost:3000.

## Dev workflow

```bash
npm run dev:full
```

The Vite dev server proxies `/api` and `/ws` to the backend on port 3000.

## CLI flags

- `--port`: HTTP port (default 3000)
- `--dir`: root directory to scan (default: cwd)
- `--no-open`: skip auto-open
- `--watch`: enable watching (default: true)
