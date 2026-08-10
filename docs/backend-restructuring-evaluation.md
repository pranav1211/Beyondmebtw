# Backend Restructuring Evaluation

> Comprehensive analysis of the current backend architecture, the proposed changes, and recommended improvements.
> Created: 2026-08-10

---

## Current State — By the Numbers

| Component | Lines | Bytes | Role |
|---|---|---|---|
| `manage/manageserver.js` | 1,741 | 72 KB | REST API: blog, projects, photos, categories, deploys, minis proxy, homepage |
| `manage/index.js` | 2,831 | 117 KB | Dashboard client logic |
| `manage/styles.css` | 2,013 | 46 KB | Dashboard styles |
| `manage/manage.html` | 781 | 33 KB | Dashboard markup |
| `manage/dashboard.html` | 571 | 17 KB | Secondary dashboard page |
| `manage/authentication.js` | 248 | 9 KB | Auth system |
| **Total manage/** | **8,184** | **~294 KB** | — |
| `multigitman.js` | 282 | 11 KB | Multi-repo webhook deployer |
| `beyondgitman.js` | 116 | 3 KB | Main site webhook deployer |

The manage section is **60%+ of the repo's non-library code**. It's already the single largest subsystem and is growing with every new feature (photos, deploys, minis).

---

## Part 1 — Should manage/ be in its own folder/repo?

### Verdict: **Yes, separate it, but keep it in _this_ repo for now.**

The manage section already _is_ in its own folder. What's needed is to decouple its **server** from the folder path assumptions so it can be routed independently — which you've already done with the multigitman architecture.

### What "separation" actually means here

```
Current nginx routing:
  manage.beyondmebtw.com → /bmbsifi/Beyondmebtw/manage/  (static files)
  manage.beyondmebtw.com/latestdata → proxy_pass localhost:7000
  manage.beyondmebtw.com/blogdata → proxy_pass localhost:7000
  ...etc

PM2:
  manageserver → cwd: /bmbsifi/Beyondmebtw/manage/, script: manageserver.js
```

The server file (`manageserver.js`) uses `__dirname` and relative paths extensively — it already resolves paths relative to itself. **No file restructuring is needed.** The "separation" is already architecturally in place.

### What _would_ be worth doing

> Rather than moving files around, the real win is **server-side routing consolidation** — which leads directly into Part 2.

---

## Part 2 — Centralizing Data Behind One API Server

### The Problem Today

```
beyondmebtw.com (main site)  ──fetch──→  latest.json (static file)
                             ──fetch──→  project-data.json (static file)
manage.beyondmebtw.com       ──API────→  manageserver :7000
                             ──fetch──→  minis metadata (cross-origin)
                   manageserver ──proxy→  minis metadata
minis.beyondmebtw.com        ──reads──→  minis backend :7004
Homepage script.js           ──fetch──→  latest.json
                             ──fetch──→  project-data.json
```

**Problems:**
1. **Scattered data sources** — `latest.json`, `project-data.json`, `photos.json`, blog category JSONs are all static files served by nginx. The server writes them, then a shell script syncs to the live path. This is fragile.
2. **Minis CORS dance** — The manage dashboard needs minis metadata. Today it either fetches cross-origin (CORS-dependent) or proxies through manageserver's `/minismetadata` endpoint. Neither is clean.
3. **Multiple servers for overlapping concerns** — manageserver manages projects data, but `multigitman` also manages project _deployment_ data. They share the registry file but are separate processes.
4. **No unified API surface** — External consumers (homepage, blog page, minis) each speak to different static files or servers.

### The Centralized Server Proposal

```
Central API Server (manageserver :7000)
  /api/v1/*
    ├── /blog/*         → categories, posts
    ├── /projects/*     → project-data CRUD
    ├── /photos/*       → series, images
    ├── /minis/*        → metadata proxy + featured
    ├── /deploys/*      → registry, status
    ├── /homepage/*     → latest.json, featured
    └── /auth/*         → login

Consumers:
  Main Site Frontend     ──fetch /api/v1/projects──→  API
  Dashboard Frontend     ──authenticated calls────→  API
  Minis Site             ──fetch /api/v1/minis────→  API
```

### Assessment: **Yes, this is the right direction — but phase it.**

#### Benefits
1. **One CORS policy** — all cross-origin headaches evaporate. Every consumer talks to `manage.beyondmebtw.com/api/v1/*`.
2. **One auth layer** — API key validation in one place, one middleware.
3. **Live data** — no more write-to-JSON-then-shell-script-sync. The API _is_ the source of truth. Frontend `fetch`es can hit the API directly.
4. **Minis integration** — instead of minis running its own backend for its own metadata, it can store/fetch through the central API. Or the central API proxies + caches it.
5. **Observability** — one server to monitor, one log stream, one PM2 process (or two if you keep multigitman separate for blast-radius isolation).

#### Risks
1. **Single point of failure** — if manageserver crashes, everything goes dark. Today, static JSON files still serve even if the server is down.
2. **Migration complexity** — every frontend page that does `fetch('/blog/categories.json')` needs updating. That's `script.js`, `blog/blog.js`, `projects/projects.js`, `photos/photos.js`.
3. **Latency** — API responses are marginally slower than nginx serving static files. Mitigate with in-memory caching (which the server already does for blog data).

> **The fallback pattern**: Keep writing JSON files _as a cache layer_ even after the API is primary. If the API is down, nginx can serve the last-written static file as a fallback. Best of both worlds.

---

## Part 3 — Backend Improvements & Fixes

### P0 — Critical

**[P0] Shell command injection in `executeScript`**
File: `manage/manageserver.js` — Line 980
```javascript
exec(`sh ${scriptPath}`, { timeout: 15000 }, ...);
```
Uses `exec` with string interpolation. While `scriptPath` is currently hardcoded, the function signature accepts arbitrary paths. Should use `execFile` like the rest of the codebase.
```diff
-exec(`sh ${scriptPath}`, { timeout: 15000 }, (error, stdout, stderr) => {
+execFile('sh', [scriptPath], { timeout: 15000 }, (error, stdout, stderr) => {
```

**[P0] Wildcard CORS allows any origin**
File: `manage/manageserver.js` — Line 1304
```javascript
response.setHeader("Access-Control-Allow-Origin", "*");
```
The manage API accepts authenticated requests (passkey) and performs mutations. Wildcard CORS means any website can make authenticated requests if the key is somehow exposed. Should whitelist specific origins:
```javascript
const ALLOWED_ORIGINS = new Set([
  'https://manage.beyondmebtw.com',
  'https://beyondmebtw.com',
  'https://minis.beyondmebtw.com'
]);
const origin = request.headers.origin;
if (ALLOWED_ORIGINS.has(origin)) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
}
```

### P1 — High

**[P1] No request body size limit on the raw HTTP server**
File: `manage/manageserver.js` — Lines 103-115
`getJSONBody` accumulates chunks without any size limit. A malicious or accidental large POST could consume all memory. Add a limit:
```javascript
function getJSONBody(request, callback, maxBytes = 5 * 1024 * 1024) {
  let body = "";
  let size = 0;
  request.on("data", chunk => {
    size += chunk.length;
    if (size > maxBytes) { request.destroy(); return callback(new Error("Body too large")); }
    body += chunk.toString();
  });
  ...
}
```

**[P1] Non-atomic file writes risk corruption**
File: `manage/manageserver.js` — Lines 253-275
Every JSON file write uses `fs.writeFileSync` directly. If the process crashes mid-write, you get a corrupt/truncated JSON file. Use write-to-temp-then-rename:
```javascript
function atomicWriteSync(filePath, data) {
  const tmp = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filePath);  // atomic on same filesystem
}
```

**[P1] Blog data fetched from the _live site_ on startup**
File: `manage/manageserver.js` — Lines 188-220
The server fetches `https://beyondmebtw.com/manage/latest.json` over the internet at startup. If DNS or the main site is down, the server starts with empty/stale data. It should read from the local filesystem first (which it partially does with `loadExistingData`), then optionally sync.

**[P1] Duplicate project CRUD routes**
File: `manage/manageserver.js` — `projectCreate/Update/Delete` inside `/blogdata` (lines 1417-1471)
File: `manage/manageserver.js` — separate `/projectsdata` REST endpoints (lines 1577-1644)
The same project CRUD logic exists in two places — once as `action=projectCreate` inside the `/blogdata` POST handler, and again as proper REST routes on `/projectsdata`. The `/blogdata` versions should be removed.

### P2 — Medium

**[P2] The `http` module server should be upgraded to Express**
File: `manage/manageserver.js` — Line 1300
The server uses raw `http.createServer` with a massive if/else-if chain for routing (lines 1300-1700). Express is already a dependency (`multigitman.js` and `beyondgitman.js` use it). Migrating manageserver to Express would give you:
- Clean route declarations (`app.post('/blogdata', handler)`)
- Middleware (auth, body parsing, CORS, error handling)
- Proper 404/405 handling
- Body size limits built-in

**[P2] `loadJSON` callback pattern mixed with sync code**
The server mixes callback-style (`loadJSON`, `writeJSONFile`, `loadBlogJSON`) with synchronous operations. This makes error propagation fragile. Moving to `async/await` with `fs.promises` would clean this up significantly.

**[P2] `runScriptIgnoreError` — shell script for data sync is a fragile pattern**
File: `manage/manageserver.js` — Lines 974-993
After every data mutation, the server runs `/shellfiles/jsonupdatebmb.sh` to sync JSON files to the live nginx-served path. This is the weakest link — if the shell script fails or the file system gets into a weird state, the API says "success" but nothing is actually live. A centralized API (Part 2) eliminates this entirely.

**[P2] `multigitman.js` duplicates several functions from `manageserver.js`**
Functions like `checkoutDir`, `loadRegistry`, `listProjects`, `FOLDER_RE`, `BRANCH_RE`, `SERVE_PATH_RE` are copy-pasted between the two files. These should be in a shared module.

**[P2] `beyondgitman.js` GET endpoint runs deploy without auth**
File: `beyondgitman.js` — Lines 43-74
The GET handler on `/bmbg` runs the deploy script with zero authentication (no signature, no key). Anyone who visits the URL in a browser triggers a deploy. This should at minimum require a query-string token, or be removed entirely.

### P3 — Low

**[P3] `safeJSONParse` return value inconsistency** — returns `null` on error but some callers check for `null` and others don't, leading to potential silent failures.

**[P3] `normalizeProjectImages` is duplicated** — exists in both `manageserver.js` and `index.js` (client). If the normalization logic changes, both need updating.

**[P3] Hardcoded URLs and paths** — `https://beyondmebtw.com`, `/bmbsifi/Beyondmebtw/`, and `/projects` appear as string literals throughout. These should be configuration constants.

---

## Recommended Implementation — Phased Approach

### Phase 1: Quick Wins (No architecture change)
- [ ] Fix P0: `exec` → `execFile` in `executeScript`
- [ ] Fix P0: Whitelist CORS origins
- [ ] Fix P1: Add body size limit to `getJSONBody`
- [ ] Fix P1: Implement atomic file writes
- [ ] Fix P1: Remove duplicate project CRUD from `/blogdata`
- [ ] Fix P2: Remove unauthenticated GET deploy in `beyondgitman.js`

### Phase 2: Express Migration + Shared Modules
- [ ] Migrate `manageserver.js` from raw `http` to Express
- [ ] Extract shared code (registry helpers, constants, validators) into a `lib/` folder
- [ ] Add proper middleware stack: auth, body parsing, CORS, error handler, request logging
- [ ] Add `/api/v1/` prefix to all API routes

### Phase 3: Centralized Data API
- [ ] Add read-only API endpoints for public data:
  - `GET /api/v1/blog/categories` — serves `categories.json`
  - `GET /api/v1/blog/:category` — serves category posts
  - `GET /api/v1/projects` — serves `project-data.json`
  - `GET /api/v1/photos` — serves `photos.json`
  - `GET /api/v1/homepage` — serves `latest.json`
  - `GET /api/v1/minis/metadata` — proxy + cache from minis
- [ ] Add in-memory caching with TTL for read endpoints
- [ ] Keep writing static JSON files as nginx fallback
- [ ] Update frontend pages to use API endpoints instead of static JSON URLs
- [ ] Update nginx to route `/api/v1/*` to manageserver

### Phase 4: Minis Integration
- [ ] Define what "minis data" the central server should own vs. proxy
- [ ] If minis metadata should be managed centrally: add CRUD endpoints
- [ ] If proxied only: add caching layer with configurable TTL
- [ ] Update minis frontend to consume from central API

### Phase 5 (Optional): Merge multigitman into manageserver
- [ ] Mount multigitman's routes as `/api/v1/deploy/webhook` inside manageserver
- [ ] Share the registry read/write code
- [ ] Remove multigitman as a separate PM2 process
- [ ] **Counter-argument**: keeping them separate has blast-radius benefits — a bad deploy can't crash the API server. This one is a judgement call.

---

## Decision Points Needing Input

1. **Minis data ownership**: Should the central server _own_ minis metadata (write it, store it), or just _proxy_ it from the minis backend? Owning is simpler but means minis loses autonomy.

2. **Multigitman merge vs. keep separate**: Merging reduces operational complexity (one less process), but a broken webhook deploy can't crash the entire API if they're separate. Which matters more?

3. **Static file fallback**: Should the API keep writing static JSON files after every mutation (as a CDN/fallback layer), or go fully dynamic (API-only, no static files)?

4. **API versioning**: Start with `/api/v1/` prefix now so there's room to evolve without breaking existing consumers?

5. **Frontend migration order**: Which pages should be updated first to use the central API? (Homepage → Blog → Projects → Photos → Minis is the natural dependency order.)
