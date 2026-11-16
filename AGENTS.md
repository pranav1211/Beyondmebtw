# AGENTS.md — Beyond Me Btw Universal Agent Guidelines

This file is the single, universal instruction and context guide for all AI coding agents (Antigravity, Codex, Claude Code, Cursor, Copilot, Windsurf, etc.) working on the **Beyond Me Btw** repository.

> **Scope of this repo (since Phase 3, Nov 2026):** the public static site only. The admin, the data and the deployment system live elsewhere — see §2. System architecture and operations docs live in the **`manage-beyondmebtw`** repository, not here.

---

## 1. Pre-Flight Checklist — Before Starting Any Task

1. **Consult `repo_map.json` First**: it maps the site's files, symbols and data relationships (including which Manage resources each page reads).
2. **Understand the Architecture**: pure client-side HTML/CSS/JS served as static files — no server code in this repo.
3. **Preserve Raw Serving**: Do not introduce mandatory build steps, bundlers, or non-browser-native syntax unless explicitly instructed by the user. Argus serves this checkout as-is; it never builds.

---

## 2. Project Overview & Where Things Live

### What This Is
- **Public Website ([beyondmebtw.com](https://beyondmebtw.com))**: portfolio, blog, about, projects showcase and music tools.
- **Section subdomains**: `blog.`, `about.` and `projects.beyondmebtw.com` are folders of this repo (`blog/`, `about/`, `projects/`), mapped by nginx — not separate projects.

### What This Is Not (moved out in Phase 3)
| Concern | Now lives in |
|---|---|
| Admin / data editing | **Manage** — `manage.beyondmebtw.com`, repo `manage-beyondmebtw` |
| Canonical data (blog posts, categories, homepage `latest`, projects) | private **`bmb-data`** repo, owned by Manage |
| Deployment (webhooks, PM2, checkouts) | **Argus** (inside `manage-beyondmebtw`); config in `bmb-infrastructure` |
| Photos | separate repo `PhotosBMB` (`photos.beyondmebtw.com`) |
| Standalone projects (`mynyl`, `beyondpages`, `uceedanswer`, …) | their own repositories |

The old `manage/` admin, `manageserver.js`, `beyondgitman.js`, `multigitman.js`, the local data JSON files and `/bmbsifi` serving are retired. Do not reintroduce them.

### Directory Map

```
/                 — Landing page (index.html, script.js, analytics.js)
├── about/        — About page (about.js, about/data/ ES modules)
├── blog/         — Blog listing + category pages (blog.js)
├── projects/     — Projects showcase (projects.js, Vue) + static tools (minescan/, V1/)
├── music/        — Audio tools (audio-monitor.js)
├── homecss/, css/— Styling
├── assets/       — Static assets
├── docs/         — HISTORICAL design notes from before Phase 3 (superseded)
├── argus.deploy.json — Argus deployment declaration (static app)
└── repo_map.json — Machine-readable map of files, symbols and data relationships
```

---

## 3. Technical & Architectural Conventions

### Data: always through Manage
- Pages read canonical data from **Manage's public data API**, never from local JSON files:

  | Page | Resource(s) |
  |---|---|
  | `script.js` (home) | `home.latest`, `projects` |
  | `blog/blog.js` | `blog.categories`, `blog.posts.<category>` |
  | `projects/projects.js` | `projects` |

  Base URL: `https://manage.beyondmebtw.com/api/v1/data/resources/<key>`; the document is in the response's `data` field.
- Public reads need no credentials (CORS allows `*.beyondmebtw.com`). **Never put a Manage API token in this repo** — it is a static site; anything shipped here is public. Writing data needs an app with its own server and a Manage-issued token, or the Manage dashboard.

### Modules & Dependencies
- **ES Modules**: only `about/about.js` uses `import`/`export` (from `about/data/`).
- **Browser Globals**: other pages use plain scripts, explicit load order, and `fetch()`.
- **No Framework Lock-in**: vanilla JS/CSS; Vue only in `projects/projects.js`.

### Deployment
- A push to `main` triggers the GitHub webhook → Argus deploys the checkout to `/projects/beyondmebtw` (static; no build, no process). Webhook secret: custom (`ARGUS_WEBHOOK_SECRET_BEYONDMEBTW`).

---

## 4. Product, Design & Aesthetic Principles

### Brand & Interface Guidelines
- **Visual Identity**: Modern, dense, fast, and responsive. Uses curated HSL color palettes with signature magenta/purple accents (`#a855f7`, `#ec4899`) and dark mode surfaces.
- **Typography & Motion**: Google Fonts (Inter, Outfit). Smooth, targeted CSS transitions limited to `transform` and `box-shadow`. Respects `prefers-reduced-motion`.
- **Zero-Placeholder Policy**: Never introduce fake or unrendered placeholders. Use `generate_image` or real asset paths when generating UI components.

(The admin-dashboard principles formerly here now apply to the Manage UI in `manage-beyondmebtw`.)

---

## 5. Code Review & Quality Guidelines

AI agents performing automated audits or pull request reviews must apply the following scope and severity rules.

### Review Scope Modes
- **Recent Changes Mode**: Review *only* new changes introduced in the diff/commit. Ignore pre-existing issues.
- **Full Repo Audit Mode**: Audit the entire codebase across security, performance, dead code, and correctness.

### Priority Levels
- **P0 - Critical**: Security vulnerabilities, secret/token exposure, data corruption, site-breaking bugs.
- **P1 - High**: Performance bottlenecks, broken error handling, missing input sanitization, XSS vectors, unhandled fetch failures/timeouts.
- **P2 - Medium**: Maintainability issues, dead code, duplicate logic, confusing flow control, missing edge case guards.
- **P3 - Low**: Cosmetic naming inconsistencies, non-functional style updates, minor documentation gaps.

### Output Format
```markdown
**[P0] Short title of the issue**
File: `path/to/file.ext` - Line(s): 42-47
Explanation: One or two sentences describing the problem and its impact.
Suggested fix: Targeted recommendation or code fix.
```

### Full Repo Audit Sub-Modes
- **Full Review**: Correctness, security, error handling, input validation, and architectural integrity.
- **Performance**: Excessive DOM reflows, unoptimized sequential fetches, missing request timeouts, un-cached operations.
- **Dead Code**: Unused functions, unreachable branches, orphaned CSS/asset files, unused CSS selectors, dead event listeners.

---

## 6. Security Guardrails

- **No secrets in this repo, ever** — no Manage API tokens, webhook secrets, passwords or keys. The whole repo is served publicly.
- **Escape rendered data**: content from Manage (titles, excerpts, links) is inserted into the DOM — never via unescaped `innerHTML` of untrusted fields.
- **Dotfiles are not served** (nginx denies `/.git`, `/.env`, …), but do not rely on that: keep private material out of the repo.
- **Data changes do not happen here**: editing blog/projects/homepage data goes through Manage (dashboard today; a future editor app with its own scoped token).

---

## 7. Local Development

Static files — serve the repo root with any static server, e.g.:

```bash
npx serve .
```

Pages fetch live data from `manage.beyondmebtw.com` (public, CORS-enabled for `*.beyondmebtw.com`; from `localhost` use a browser with CORS relaxed or a small local proxy).
