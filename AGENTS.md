# AGENTS.md — Beyond Me Btw Universal Agent Guidelines

This file is the single, universal instruction and context guide for all AI coding agents (Antigravity, Codex, Claude Code, Cursor, Copilot, Windsurf, etc.) working on the **Beyond Me Btw** repository.

---

## 1. Pre-Flight Checklist — Before Starting Any Task

1. **Consult `repo_map.json` First**: Always inspect `repo_map.json` at the root directory before exploring files or editing code. It contains the structural breakdown, symbol definitions, entrypoints, and cross-file relationships across the entire codebase.
2. **Understand the Architecture**: This repository contains pure client-side HTML/CSS/JS frontend pages served directly without bundlers or transpilation build steps, backed by Node.js server scripts for admin API management and deployment webhooks.
3. **Preserve Raw Serving**: Do not introduce mandatory build steps, bundlers, or non-browser-native syntax unless explicitly instructed by the user.

---

## 2. Project Overview & Repository Structure

### What This Is
- **Public Website ([beyondmebtw.com](https://beyondmebtw.com))**: Personal portfolio, blog platform, photo gallery, minis showcase, web audio tools, and interactive sub-projects.
- **Admin Dashboard ([manage.beyondmebtw.com](https://manage.beyondmebtw.com))**: Administrative dashboard for CRUD management of blog posts, project listings, photo metadata, categories manifest, and multi-repo deployment webhooks.
- **Deployment & Server Infrastructure**: Node.js Express REST API (`manage/manageserver.js`), single-site webhook deployer (`beyondgitman.js`), multi-repo deployer (`multigitman.js`), and PM2 ecosystem management (`ecosystem.config.js`).

### Directory Map

```
/                            — Main site landing page (index.html, script.js, analytics.js)
├── about/                   — About page with experience timeline & skills (about.js, about/data/)
├── blog/                    — Blog platform (blog.js, categories.json, category JSON data files)
├── manage/                  — Admin panel (dashboard.html, index.js, authentication.js, manageserver.js)
├── music/                   — Audio tools: Web Audio API mic monitor & waveform canvas (audio-monitor.js)
├── photos/                  — Photo gallery (photos.js, photos.json, photos.css)
├── projects/                — Projects showcase gallery and static project files
│   ├── project-data.json    — Metadata manifest for all featured projects
│   ├── projects.js          — Vue.js project grid, filter logic, and detail viewer
│   ├── index.html           — Projects page entrypoint
│   ├── V1/                  — Legacy portfolio site version
│   └── minescan/            — Minescan static tool app
│   *(Note: Standalone sub-projects such as `mynyl`, `f1hapticandroid`, `uceedanswer`, `beyondpages` live in separate Git repositories and are deployed independently via `multigitman.js` into `/projects/` on the server)*
├── homecss/                 — Modular CSS for homepage components (bento grid, cards, posts)
├── css/                     — Site-wide shared styling (base.css, responsive-unified.css, buttons.css)
├── docs/                    — Server architecture maps, deployment runbooks, and design specs
├── beyondgitman.js          — Main site GitHub webhook auto-deploy server (Port 6009)
├── multigitman.js           — Multi-repo GitHub webhook deployment manager (Port 6030)
├── ecosystem.config.js      — PM2 process manager configuration template
└── repo_map.json            — Machine-readable codebase symbol & dependency map
```

---

## 3. Technical & Architectural Conventions

### Modular Structure & Dependencies
- **ES Modules**: Only `about/about.js` uses ES module `import`/`export` syntax (importing from `about/data/`).
- **Browser Globals**: All other frontend pages use browser global scripts, explicit script load order, or runtime `fetch()` calls.
- **No Framework Lock-in**: Most pages use vanilla JS and CSS. Vue.js is used specifically in `projects/projects.js`; external sub-projects use PDF.js (`beyondpages`, `uceedanswer`).
- **Data Storage**: Content is stored in JSON files (`blog/*.json`, `manage/latest.json`, `projects/project-data.json`, `photos/photos.json`).

### Admin API & Backend Architecture
- `manage/manageserver.js`: Express Node.js HTTP server handling REST endpoints for blog post CRUD, category manifest modification, project listing management, and deploy registry operations.
- `manage/authentication.js`: Cookie-based authentication protecting admin dashboard routes.
- `multigitman.js`: Webhook handler on port 6030 deploying individual project repositories via git fetch & hard reset into `/projects/.checkouts/` with automated symlinking.

---

## 4. Product, Design & Aesthetic Principles

### Brand & Interface Guidelines
- **Visual Identity**: Modern, dense, fast, and responsive. Uses curated HSL color palettes with signature magenta/purple accents (`#a855f7`, `#ec4899`) and dark mode surfaces.
- **Typography & Motion**: Google Fonts (Inter, Outfit). Smooth, targeted CSS transitions limited to `transform` and `box-shadow`. Respects `prefers-reduced-motion`.
- **Zero-Placeholder Policy**: Never introduce fake or unrendered placeholders. Use `generate_image` or real asset paths when generating UI components.

### Admin Dashboard Principles (from PRODUCT.md)
1. **Density is a Feature**: High info density over excessive white space.
2. **State Over Decoration**: Color and animation strictly reflect status, selection, success, or warning states.
3. **Trust the Operator**: Expose exact values (file paths, branches, git commits, timestamps) directly inline.
4. **Fail Loudly Inline**: Errors surface inline at the trigger point with full server response details.

---

## 5. Code Review & Quality Guidelines

AI agents performing automated audits or pull request reviews must apply the following scope and severity rules.

### Review Scope Modes
- **Recent Changes Mode**: Review *only* new changes introduced in the diff/commit. Ignore pre-existing issues.
- **Full Repo Audit Mode**: Audit the entire codebase across security, performance, dead code, and correctness.

### Priority Levels
- **P0 - Critical**: Security vulnerabilities, auth key exposure, data corruption, command injection, site-breaking bugs.
- **P1 - High**: Performance bottlenecks, broken error boundaries, missing input sanitization, XSS vectors, unhandled HTTP timeouts.
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
- **Performance**: Excessive DOM reflows, unoptimized sequential fetches, missing HTTP timeouts, synchronous file I/O in server request loops, un-cached operations.
- **Dead Code**: Unused functions/exports, unreachable code branches, orphaned JSON/CSS files, unused CSS selectors, dead event listeners.

---

## 6. Security & Data Integrity Guardrails

### Security Rules
- **Secret Protection**: Never expose, log, or commit secret keys, passkeys, authentication cookies, or webhook tokens in logs or responses.
- **Shell Command Safety**: Calls to `exec()`, `execFile()`, or `child_process` must sanitize all parameters. **Never** interpolate raw user request parameters directly into shell command strings.
- **Directory Traversal Protection**: File operations in `manageserver.js` or deployment scripts must validate and sanitize target paths to prevent `../` traversal outside designated root directories.
- **Auth Cookies**: Admin cookies must use `HttpOnly`, `SameSite`, and `Secure` flags in production environments.
- **Webhook Verification**: GitHub webhooks (`beyondgitman.js`, `multigitman.js`) must verify `X-Hub-Signature-256` using constant-time HMAC SHA-256 buffer comparison.

### Data Integrity Rules
- **Atomic File Operations**: Server JSON file writes (`latest.json`, `categories.json`, category data files) must be written safely (e.g. write to temporary file then rename, or with try/catch fallback recovery) to prevent partial data corruption.
- **Cascading Updates**: Category deletion/renaming must update or clear secondary references (`secondaryCategory`, `secondarySubcategory`) across all affected post files and `latest.json`.

---

## 7. Development & Deployment Commands

### Local Server Execution
```bash
# Start admin REST API server (default port 7000)
node manage/manageserver.js

# Start main site webhook deployment server (port 6009)
node beyondgitman.js

# Start multi-repo project deployment server (port 6030)
node multigitman.js
```

### PM2 Process Manager Commands
```bash
# Start all server applications via ecosystem config
pm2 start ecosystem.config.js

# Restart specific service with updated environment variables
pm2 restart manageserver --update-env

# View live process statuses
pm2 status
```
