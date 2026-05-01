# Product Requirements Document

# `spectool` — Universal Spec Viewer for Spec-Driven Development Frameworks

**Version:** 1.0  
**Status:** Draft  
**Author:** —  
**Last Updated:** 2026-04-30

---

## 1. Overview

### 1.1 Problem Statement

Spec-Driven Development (SDD) frameworks — BMAD, Spec-Kit, OpenSpec, Kiro, and others — store project specifications as Markdown files scattered across multiple directories. Reading, navigating, and tracking the status of these specs inside a code editor is painful: there is no overview, no visual hierarchy, no task progress tracking, and no cross-file navigation optimized for the SDD mental model.

Developers using SDD spend non-trivial time context-switching between raw files instead of understanding and acting on the specification itself.

### 1.2 Solution

`spectool` is a zero-config, framework-agnostic CLI tool that spins up a local web UI for browsing SDD specs. One command. No install. Works with any SDD framework.

```bash
npx spectool
# → Auto-detects framework
# → Starts server on http://localhost:3000
# → Opens browser
```

### 1.3 Goals

- Let developers read, navigate, and track SDD specs without touching their editor.
- Support the top 10 SDD frameworks with zero configuration.
- Be fast to start, easy to extend, and pleasant to use.

### 1.4 Non-Goals

- Does not generate, edit, or run specs.
- Does not replace the AI agent workflow (Cursor, Claude Code, Copilot, etc.).
- Does not require cloud services or authentication.
- Does not sync specs to any remote source.

---

## 2. Target Users

| Persona                       | Context                                                  | Primary Need                                                               |
| ----------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Solo developer**            | Running BMAD or OpenSpec on personal project             | Quick visual overview of spec progress without opening 15 tabs in VS Code  |
| **Team lead / reviewer**      | Reviewing feature specs before approving agent execution | Readable, navigable view of requirements, design, and tasks                |
| **Non-technical stakeholder** | Checking project status                                  | Understands what is planned, what is done, no Markdown knowledge needed    |
| **SDD framework evaluator**   | Comparing multiple frameworks                            | Sees the output of each framework without deep-diving into file structures |

---

## 3. Supported Frameworks

| #   | Framework            | Detection Signal             | Key Files                                                                      |
| --- | -------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| 1   | **BMAD-METHOD**      | `.bmad-core/` dir            | `docs/prd.md`, `docs/architecture.md`, `docs/stories/*.md`                     |
| 2   | **GitHub Spec-Kit**  | `specs/CONSTITUTION.md`      | `specs/CONSTITUTION.md`, `specs/features/*/`                                   |
| 3   | **OpenSpec**         | `changes/` dir + `AGENTS.md` | `changes/*/proposal.md`, `changes/*/tasks.md`, `changes/*/design.md`           |
| 4   | **Kiro (AWS)**       | `.kiro/specs/` dir           | `.kiro/specs/requirements.md`, `.kiro/specs/design.md`, `.kiro/specs/tasks.md` |
| 5   | **Tessl**            | `.tessl/` dir                | `.tessl/spec.md`, `.tessl/tiles/`                                              |
| 6   | **PromptX**          | `.promptx/` dir              | `.promptx/prompts/`, `.promptx/context/`                                       |
| 7   | **Spec Kitty**       | `.spec-kitty/` dir           | `.spec-kitty/specs/`, worktree configs                                         |
| 8   | **Intent (Augment)** | `.intent/` dir               | `.intent/spec.md`, living spec files                                           |
| 9   | **AgentOS**          | `agentOS.config.yml`         | Agent definitions, workflow YAML                                               |
| 10  | **GTPlanner**        | `gtplanner.config.json`      | `prd.md`, generated task files                                                 |

When no framework is detected, the tool falls back to **generic Markdown mode**: scans for any `.md` files in the project root and `docs/` directory.

---

## 4. User Stories

### Core

**US-01** — As a developer, I want to run `npx spectool` from my project root and have the UI open automatically in my browser within 3 seconds, so I can start reading specs immediately.

**US-02** — As a developer, I want the tool to automatically detect which SDD framework I'm using, so I don't have to configure anything.

**US-03** — As a developer, I want to see all spec files organized in a sidebar according to the framework's logical structure (requirements → design → tasks), not raw directory paths.

**US-04** — As a developer, I want spec content rendered as readable HTML (not raw Markdown), including proper heading hierarchy, code blocks, and tables.

**US-05** — As a developer, I want Mermaid diagrams in architecture files to render as visual diagrams, not raw code blocks.

**US-06** — As a developer, I want task lists (checkboxes in `tasks.md`) to display with a visual progress bar, so I can see completion status at a glance.

**US-07** — As a developer, I want the UI to automatically refresh when I save a spec file in my editor (live reload), so I always see the latest version.

### Navigation & UX

**US-08** — As a developer, I want to search across all spec files by keyword, so I can find relevant context without clicking through every file.

**US-09** — As a developer, I want a breadcrumb trail showing where the current file sits in the spec hierarchy.

**US-10** — As a developer, I want to use keyboard shortcuts to navigate between sections (next/prev file), so I can stay on the keyboard.

### Framework-Specific

**US-11** — As an OpenSpec user, I want to see each `changes/` entry as a "proposal card" with status badges (ADDED / MODIFIED / REMOVED), so I can review delta-based changes at a glance.

**US-12** — As a BMAD user, I want to see the agent workflow as a visual pipeline (Analyst → PM → Architect → Dev → QA), with each phase linked to its corresponding docs.

**US-13** — As a Spec-Kit user, I want the `CONSTITUTION.md` to be pinned at the top of the sidebar as the primary reference document.

### CLI

**US-14** — As a developer, I want to pass `--port` to change the default port (3000), and `--dir` to point to a specific project directory, so the tool fits into any workflow.

**US-15** — As a developer, I want the tool to print a clear error if no specs are found, with a hint about which frameworks are supported.

---

## 5. Functional Requirements

### 5.1 CLI Interface

| Flag          | Default         | Description                        |
| ------------- | --------------- | ---------------------------------- |
| `--port`      | `3000`          | HTTP server port                   |
| `--dir`       | `process.cwd()` | Project root directory to scan     |
| `--no-open`   | `false`         | Skip auto-opening the browser      |
| `--watch`     | `true`          | Enable file watching / live reload |
| `--framework` | auto-detect     | Force a specific framework adapter |

### 5.2 Framework Detection

The detector runs on startup and scores each framework by checking for its signature files/directories. The highest-scoring match wins. If score is zero for all frameworks, fall back to generic Markdown mode.

Detection must complete in under 100ms.

### 5.3 Spec Tree API

`GET /api/specs` returns a normalized JSON tree:

```json
{
  "framework": "openspec",
  "version": "detected",
  "rootPath": "/home/user/project",
  "sections": [
    {
      "id": "changes",
      "label": "Changes",
      "type": "proposals",
      "children": [
        {
          "id": "changes/add-auth",
          "label": "Add Auth",
          "type": "proposal",
          "status": "in-progress",
          "files": [
            {
              "path": "changes/add-auth/proposal.md",
              "label": "Proposal",
              "modified": "2026-04-30T10:00:00Z"
            },
            {
              "path": "changes/add-auth/tasks.md",
              "label": "Tasks",
              "modified": "2026-04-30T11:00:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

### 5.4 File Content API

`GET /api/file?path=relative/path.md` returns raw Markdown content. Paths are validated against the project root to prevent directory traversal.

### 5.5 Live Reload

The server uses `chokidar` to watch all detected spec files. On any change, it broadcasts a WebSocket message `{ type: "file_changed", path: "..." }`. The client reloads the affected file content without a full page refresh.

### 5.6 Task Progress Extraction

The server parses `tasks.md` files (or equivalent) and extracts checkbox counts:

- `- [x]` = done
- `- [ ]` = pending

Returns `{ total: N, done: M }` per file. Used by the frontend to render progress bars.

### 5.7 Mermaid Rendering

Fenced code blocks with ` ```mermaid ` are rendered client-side using the Mermaid.js library. Other code blocks use syntax highlighting via highlight.js.

---

## 6. Non-Functional Requirements

| Category          | Requirement                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Startup time**  | Server ready in under 2 seconds on a standard laptop                                       |
| **Bundle size**   | npm package under 15 MB including pre-built frontend assets                                |
| **Dependencies**  | Minimal: Express, chokidar, ws, gray-matter — no heavy build tools at runtime              |
| **Node.js**       | Requires Node.js v18+                                                                      |
| **OS**            | macOS, Linux, Windows (WSL recommended on Windows)                                         |
| **Security**      | Serves only files within the specified project directory; no remote access; localhost only |
| **Accessibility** | WCAG 2.1 AA for text contrast; keyboard navigable                                          |

---

## 7. Architecture

### 7.1 High-Level

```
npx spectool
    │
    ├── [CLI] bin/spectool.js
    │       detect framework → start server → open browser
    │
    ├── [Server] server/index.js   (Express + ws)
    │       GET  /api/specs         → normalized tree
    │       GET  /api/file          → markdown content
    │       GET  /*                 → serve pre-built SPA
    │       WS   /ws                → file change events
    │
    ├── [Adapters] server/adapters/
    │       bmad.js       spec-kit.js    openspec.js
    │       kiro.js       tessl.js       promptx.js
    │       generic.js    ...
    │
    └── [Client] client/dist/       (pre-built Vite + React SPA)
            Sidebar                 — spec tree navigation
            MarkdownViewer          — rendered content + Mermaid
            TaskBoard               — progress visualization
            SearchOverlay           — full-text search (cmd+k)
            FrameworkBadge          — detected framework name + logo
```

### 7.2 Adapter Interface

Each adapter exports:

```typescript
interface FrameworkAdapter {
  name: string;
  detect(rootPath: string): number; // 0–100 confidence score
  buildTree(rootPath: string): SpecSection[]; // normalized sections
}
```

### 7.3 Frontend Stack

| Concern          | Choice                         | Reason                        |
| ---------------- | ------------------------------ | ----------------------------- |
| Framework        | React 18                       | ecosystem, team familiarity   |
| Bundler          | Vite                           | fast dev builds, small output |
| Styling          | Tailwind CSS (JIT, pre-purged) | utility-first, no runtime     |
| Markdown         | react-markdown + remark-gfm    | extensible pipeline           |
| Diagrams         | mermaid (lazy)                 | standard in SDD docs          |
| Syntax highlight | highlight.js (lazy)            | lightweight, treeshakeable    |
| State            | Zustand                        | minimal boilerplate           |
| WS client        | native WebSocket               | no extra deps                 |

---

## 8. UI Design

### 8.1 Layout

Three-column layout on desktop, collapsible sidebar on mobile:

```
┌──────────────┬───────────────────────────────────┬────────────┐
│  Sidebar     │  Content Viewer                   │  Outline   │
│              │                                   │            │
│  [Framework  │  # Requirements                   │  H1        │
│   Badge]     │                                   │    H2      │
│              │  ## User Stories                  │    H2      │
│  ▼ Changes   │  ...                              │  H1        │
│    add-auth  │                                   │            │
│    fix-login │  [Mermaid diagram renders here]   │            │
│  ▼ Docs      │                                   │            │
│    prd.md    │  Tasks: ████████░░ 8/10           │            │
│    arch.md   │                                   │            │
└──────────────┴───────────────────────────────────┴────────────┘
```

### 8.2 Visual Style

- Dark theme (default), light theme toggle.
- Monospace accents for file paths, section IDs, status badges.
- Color coding for section types: blue (requirements), orange (architecture), green (tasks done), grey (tasks pending).
- Status badges on proposal cards (OpenSpec): green ADDED, yellow MODIFIED, red REMOVED.
- BMAD pipeline: horizontal stepper at top of BMAD view, each agent phase clickable.

### 8.3 Keyboard Shortcuts

| Shortcut       | Action                          |
| -------------- | ------------------------------- |
| `Cmd/Ctrl + K` | Open search overlay             |
| `[` / `]`      | Previous / next file            |
| `Escape`       | Close search / collapse sidebar |
| `Cmd/Ctrl + B` | Toggle sidebar                  |

---

## 9. Milestones

### Milestone 1 — Core MVP (Week 1–2)

- [ ] CLI entry point with `--port` and `--dir`
- [ ] Framework detection engine (confidence scoring)
- [ ] Adapters: OpenSpec, BMAD, Spec-Kit (top 3 by usage)
- [ ] Express server with `/api/specs` and `/api/file`
- [ ] React SPA: sidebar + markdown viewer (no Mermaid yet)
- [ ] Published to npm as `spectool`

### Milestone 2 — Live Reload & Enhanced Rendering (Week 3)

- [ ] chokidar file watcher + WebSocket live reload
- [ ] Mermaid diagram rendering
- [ ] Task progress bar extraction
- [ ] Full-text search (`Cmd+K`)
- [ ] Dark / light theme toggle

### Milestone 3 — Framework Expansion (Week 4–5)

- [ ] Adapters: Kiro, Tessl, PromptX, Spec Kitty, Intent, AgentOS, GTPlanner
- [ ] Generic Markdown fallback mode
- [ ] OpenSpec proposal cards with delta badges
- [ ] BMAD agent pipeline stepper

### Milestone 4 — Polish & Distribution (Week 6)

- [ ] `--export` flag: generates single-file static HTML report
- [ ] README with per-framework quickstart
- [ ] GitHub Actions: lint + publish on tag
- [ ] Landing page / demo GIF

---

## 10. Success Metrics

| Metric               | Target (90 days post-launch) |
| -------------------- | ---------------------------- |
| npm weekly downloads | 1,000+                       |
| GitHub stars         | 200+                         |
| Framework adapters   | 10                           |
| p50 startup time     | < 1.5s                       |
| Open issues / bugs   | < 10                         |

---

## 11. Open Questions

1. **Monorepo support** — Should `spectool` scan sub-packages and aggregate specs from multiple workspaces? (defer to v1.1)
2. **Authentication** — Some teams may want to expose the UI on a non-localhost port behind basic auth for remote review. Out of scope for v1, revisit based on demand.
3. **Plugin API** — Should third-party framework authors be able to publish their own adapter as an npm package (e.g., `spectool-adapter-mytool`)? Yes — define the adapter interface clearly in v1 so this is possible in v2 without breaking changes.
4. **Tessl access** — Tessl is in closed beta as of April 2026; adapter may need to be stubbed until API/file format is public.

---

## 12. Dependencies & Risks

| Risk                                 | Likelihood | Impact | Mitigation                                                         |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------------------------ |
| Framework changes its file structure | Medium     | High   | Adapter versioning; detect framework version from config           |
| npx caching causes stale versions    | Medium     | Low    | Document `npx spectool@latest`; clear cache instructions in README |
| Mermaid bundle size too large        | Low        | Medium | Lazy-load Mermaid only when a mermaid block is detected            |
| Windows path separator issues        | Medium     | Medium | Use `path.posix` in adapters; test on Windows CI                   |
| Framework becomes defunct            | Low        | Low    | Adapter stays in codebase; detection score stays dormant           |

---

_End of document._
