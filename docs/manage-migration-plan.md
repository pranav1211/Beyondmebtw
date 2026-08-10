# Practical Migration Plan — Where Things Live & How They Deploy

> Answering the concrete questions: where do the JSON files go, how does manage become its own repo, and what's the actual deployment path.
> Created: 2026-08-10

---

## Where Things Are Today (Server Filesystem)

```
/bmbsifi/Beyondmebtw/              ← main site repo (beyondgitman deploys here)
├── blog/
│   ├── categories.json            ← manageserver reads/writes
│   ├── tech.json                  ← manageserver reads/writes
│   └── ...
├── manage/
│   ├── manageserver.js            ← the API server (PM2 process)
│   ├── index.js, styles.css, ...  ← dashboard frontend (nginx serves)
│   └── latest.json                ← manageserver reads/writes
├── photos/
│   └── photos.json                ← manageserver reads/writes
├── projects/
│   └── project-data.json          ← manageserver reads/writes
├── beyondgitman.js                ← main deploy webhook (PM2)
└── multigitman.js                 ← project deploy webhook (PM2)

/projects/                          ← multigitman deploy root
├── .registry.json                  ← deploy registry (manageserver + multigitman share)
├── .checkouts/                     ← git checkouts for serve-path projects
├── mynyl/
├── f1hapticandroid/
└── ...

/shellfiles/
└── jsonupdatebmb.sh               ← sync script run after every API mutation
```

**The problem:** Data files are *inside* the main site repo tree. The shell script (`jsonupdatebmb.sh`) exists solely to copy updated JSON from where manageserver writes them to where nginx serves them (same path, actually — the script likely does a `git checkout` or cache-bust). Once manage moves out, these paths break.

---

## Where Things Should Live (Target State)

```
/bmbsifi/Beyondmebtw/              ← main site repo (slimmed down — NO manage/)
├── blog/
│   ├── categories.json            ← STILL HERE (nginx serves as static fallback)
│   ├── tech.json, etc.            ← STILL HERE (static fallback)
│   └── index.html, blog.js, ...
├── photos/                         ← if photos is moving to its own repo, this empties
├── projects/
│   ├── index.html, projects.js    ← gallery UI stays
│   └── project-data.json          ← STILL HERE (static fallback)
├── beyondgitman.js
└── multigitman.js

/projects/manage/                   ← NEW: manage's own deploy root (via multigitman)
├── manageserver.js                 ← the API server
├── data/                           ← ★ THE CANONICAL DATA STORE ★
│   ├── latest.json
│   ├── blog/
│   │   ├── categories.json
│   │   ├── tech.json
│   │   └── ...
│   ├── projects/
│   │   └── project-data.json
│   └── photos/
│       └── photos.json
├── index.html, index.js, ...       ← dashboard frontend
├── styles.css
├── authentication.js
└── package.json                    ← own deps (express)

/projects/                          ← unchanged
└── (other multigitman targets)
```

### ★ The Key Insight: `data/` directory

The `data/` directory lives **inside the manage deploy root** but is **gitignored**. It's purely server-side state that persists across deploys.

```gitignore
# In the manage repo's .gitignore:
data/
```

> **IMPORTANT:** `data/` is NOT in the git repo. It lives only on the server. The API server creates it on first boot if missing, seeding from the live site URLs (which it already does today via `loadJSON()` and `loadBlogJSON()`). After that, it's the single source of truth.

### Why not a separate `/data/` directory at the server root?

You *could* do `/data/bmb/` at the root level. But keeping it inside `/projects/manage/data/` means:
1. It deploys alongside the code that reads/writes it (same `pvr` ownership, same directory)
2. `__dirname + '/data/'` just works — no env vars needed for local dev
3. The git checkout won't touch it because it's gitignored (and `git clean -fd` only cleans tracked paths + untracked non-ignored files)

> **NOTE:** There's one gotcha: `git clean -fd` removes **untracked files** but respects `.gitignore`. So `data/` is safe as long as it's in `.gitignore`. The multigitman deploy command is `git fetch + git reset --hard + git clean -fd` — the `-fd` cleans untracked but `.gitignore`d paths survive. **This is already how it works.** ✓

---

## How Manage Deploys as Its Own Repo

### The Real Problem

multigitman does: `git fetch → reset --hard → clean -fd`. That's it. For static sites that's perfect. But manage has a **Node.js server process** — after updating the code, you need `pm2 restart manageserver` or the old code keeps running.

### Solution: Post-deploy hook in multigitman

Add a simple `postDeploy` field to the registry. When present, multigitman runs it after a successful deploy:

```json
{
  "beyondmebtw-manage": {
    "folder": "manage",
    "postDeploy": "pm2 restart manageserver --update-env"
  }
}
```

**But wait** — manage wouldn't deploy to `/projects/manage`. It should deploy to `/manage/`. That means either:

**Option A: Manage goes under `/projects/` like everything else**
```
/projects/manage/          ← multigitman deploys here
├── manageserver.js
├── data/                  ← gitignored, persists
└── ...
```
- nginx `manage.beyondmebtw.com` root changes from `/bmbsifi/Beyondmebtw/manage` to `/projects/manage`
- The wildcard nginx would catch `manage.beyondmebtw.com` but the explicit server block takes priority (nginx exact-match wins over regex) ✓
- PM2 ecosystem updates: `script: '/projects/manage/manageserver.js'`, `cwd: '/projects/manage'`

**Option B: Manage gets its own top-level directory `/manage/`**
- Own gitman script (tiny, like beyondgitman — just adds `pm2 restart` after the pull)
- More isolated, but one more PM2 process

### Recommendation: **Option A — deploy to `/projects/manage/`**

It reuses the entire multigitman infrastructure. All you add is a `postDeploy` field. Here's concretely what changes:

#### 1. Add `postDeploy` support to multigitman.js (~10 lines)

```javascript
// After successful deploy() callback, before recording lastDeploys:
const entry = resolveEntry(repoName);
if (!error && entry.postDeploy) {
  log(`${repoName} → ${folder}: running postDeploy: ${entry.postDeploy}`);
  execFile('sh', ['-c', entry.postDeploy], { timeout: 15000 }, (pdErr, pdOut, pdStderr) => {
    if (pdErr) log(`${repoName}: postDeploy failed: ${pdErr.message}`);
    else log(`${repoName}: postDeploy ok`);
    // continue to record deploy result either way
  });
}
```

#### 2. Registry entry for manage

```json
{
  "beyondmebtw-manage": {
    "folder": "manage",
    "postDeploy": "pm2 restart manageserver --update-env"
  }
}
```

#### 3. Clone + initial setup (one-time, on server)

```bash
git clone git@github.com:pranav1211/beyondmebtw-manage.git /projects/manage

# Seed the data directory from live site
mkdir -p /projects/manage/data/blog
cp /bmbsifi/Beyondmebtw/manage/latest.json /projects/manage/data/
cp /bmbsifi/Beyondmebtw/blog/categories.json /projects/manage/data/blog/
cp /bmbsifi/Beyondmebtw/blog/*.json /projects/manage/data/blog/
cp /bmbsifi/Beyondmebtw/projects/project-data.json /projects/manage/data/projects/
cp /bmbsifi/Beyondmebtw/photos/photos.json /projects/manage/data/photos/
```

#### 4. nginx change

```diff
 # /etc/nginx/sites-enabled/manage.beyondmebtw.com
 server {
     server_name manage.beyondmebtw.com www.manage.beyondmebtw.com;
-    root  /bmbsifi/Beyondmebtw/manage;
+    root  /projects/manage;
     index index.html;
     ...
 }
```

#### 5. PM2 ecosystem change

```diff
 {
   name: 'manageserver',
-  script: '/bmbsifi/Beyondmebtw/manage/manageserver.js',
-  cwd: '/bmbsifi/Beyondmebtw/manage',
+  script: '/projects/manage/manageserver.js',
+  cwd: '/projects/manage',
   env: { managekey: 'REPLACE' },
 },
```

#### 6. GitHub webhook

Same URL as all other projects: `https://beyondmebtw.com/multig` + same shared secret. Identical setup.

---

## manageserver.js Path Changes

The server currently uses hardcoded absolute paths. With data living in `./data/`:

```diff
-const PROJECTS_JSON_PATH = "/bmbsifi/Beyondmebtw/projects/project-data.json";
-const BLOG_BASE_PATH = "/bmbsifi/Beyondmebtw/blog";
-const PHOTOS_JSON_PATH = "/bmbsifi/Beyondmebtw/photos/photos.json";
+const DATA_DIR = nodePath.join(__dirname, 'data');
+const PROJECTS_JSON_PATH = nodePath.join(DATA_DIR, 'projects', 'project-data.json');
+const BLOG_BASE_PATH = nodePath.join(DATA_DIR, 'blog');
+const PHOTOS_JSON_PATH = nodePath.join(DATA_DIR, 'photos', 'photos.json');
```

All the dual-path resolution (`resolve...Path()` functions, server-path-then-local-fallback pattern) simplifies to one path. The ~30 lines of fallback logic goes away.

---

## The Shell Script Problem Goes Away

Today's flow:
```
API mutation → write JSON → run /shellfiles/jsonupdatebmb.sh → ??? → data is "live"
```

New flow:
```
API mutation → write JSON to ./data/ → done (API serves it directly)
```

But what about the static site? The homepage (`script.js`) currently fetches:
- `https://beyondmebtw.com/manage/latest.json` — served by nginx from `/bmbsifi/Beyondmebtw/manage/latest.json`
- `https://beyondmebtw.com/projects/project-data.json` — served by nginx

These break once the data moves. **Two options:**

### Option A: Static sync (keep the fallback)
After writing `./data/latest.json`, also copy to `/bmbsifi/Beyondmebtw/manage/latest.json` so the main static site still serves it. Replaces the shell script with a simple `fs.copyFile`.

### Option B: API serves read endpoints (the centralized API)
Add read-only API routes. Frontend pages fetch from `manage.beyondmebtw.com/api/...` instead of static files:

```
GET manage.beyondmebtw.com/api/latest     → serves latest.json
GET manage.beyondmebtw.com/api/projects   → serves project-data.json
GET manage.beyondmebtw.com/api/blog/:cat  → serves category JSON
```

The homepage `script.js` changes from:
```javascript
fetch('https://beyondmebtw.com/manage/latest.json')
```
to:
```javascript
fetch('https://manage.beyondmebtw.com/api/latest')
```

> **TIP:** Do both. Serve from the API (fast, no stale cache) AND write static copies as CDN fallback. If manageserver is down, nginx still serves the last-written static file. This is exactly what you're doing today, just without the shell script.

---

## The "What Doesn't Get Deployed" Concern

The worry about multigitman accidentally overwriting the running server — here's why it's fine:

1. **`git reset --hard` only changes tracked files.** The `data/` directory is gitignored → untouched.
2. **`manageserver.js` IS tracked** — it WILL be replaced with the latest version. That's the point! The code updates.
3. **`pm2 restart`** then picks up the new code. This is a ~100ms restart. Same as how you'd deploy any Node.js app.
4. **If the new code is broken**, `pm2` auto-restarts it (up to `max_restarts`). Worst case, you `git revert` in the repo, push, webhook redeploys + restarts.

There's no "generated server file" to worry about. The only thing that persists across deploys is `data/` (gitignored) and `node_modules/` (also gitignored — but you'd want a `postDeploy` that runs `npm install` if you add dependencies).

Updated `postDeploy`:
```
"postDeploy": "cd /projects/manage && npm install --production && pm2 restart manageserver --update-env"
```

---

## Migration Order — Step by Step

### Phase 0: Prep (no deployment changes)
1. Create the `beyondmebtw-manage` GitHub repo
2. Copy the manage files into it: `manageserver.js`, `index.html`, `manage.html`, `dashboard.html`, `index.js`, `styles.css`, `authentication.js`, `latest.json`, `package.json`, `robots.txt`
3. Add `.gitignore` with `data/` and `node_modules/`
4. Update path constants in manageserver.js to use `__dirname + '/data/'`
5. Push the repo

### Phase 1: Deploy alongside (parallel running)
1. Clone to `/projects/manage` on the server
2. Seed `/projects/manage/data/` from current live files
3. Add registry entry with `postDeploy`
4. Add the `postDeploy` feature to multigitman (~10 lines)
5. Update PM2 to point at `/projects/manage/manageserver.js`
6. Update nginx `manage.beyondmebtw.com` root to `/projects/manage`
7. Test: dashboard loads, API works, data mutations persist
8. Add GitHub webhook to the new repo

### Phase 2: Sync layer (keep static fallback)
1. After API writes, have manageserver `fs.copyFile` to the old paths (`/bmbsifi/Beyondmebtw/blog/`, etc.)
2. This replaces the shell script entirely
3. Frontend pages still work because they fetch from `beyondmebtw.com/blog/categories.json` etc.
4. No frontend changes needed yet

### Phase 3: Read API + frontend migration (optional, later)
1. Add `GET /api/latest`, `/api/projects`, `/api/blog/:cat` to manageserver
2. Update `script.js`, `blog.js`, `projects.js` to fetch from API
3. Once all consumers use the API, stop writing static copies
4. Shell script deleted, all fallback logic removed

### Phase 4: Remove manage/ from main repo
```bash
# In Beyondmebtw repo:
echo 'manage/' >> .gitignore
git rm -r --cached manage/
git commit -m "manage now lives in its own repo"
```

---

## Summary Diagram

```
Server Filesystem (Target)
├── /bmbsifi/Beyondmebtw        (main site — no manage/)
├── /projects/manage             (manage repo checkout)
│   └── /projects/manage/data/   ★ gitignored, persists ★
└── /projects/*                  (other project repos)

PM2 Processes
├── beyondgitman :6009          deploys main site
├── multigitman :6030           deploys projects + manage
└── manageserver :7000          central API

nginx
├── beyondmebtw.com             root: /bmbsifi/Beyondmebtw
├── manage.beyondmebtw.com      root: /projects/manage,  API → :7000
└── *.beyondmebtw.com           root: /projects/$sub

Flow: multigitman ──git pull + pm2 restart──→ /projects/manage
      manageserver ──reads/writes──→ /projects/manage/data/
      /projects/manage/data/ ─·sync copies (Phase 2)·─→ /bmbsifi/Beyondmebtw
```

---

## Decision Points

1. **`/projects/manage` vs `/manage/`** — Recommendation is `/projects/manage` to reuse multigitman. Does that feel right?

2. **Registry `postDeploy` field** — this is the only code addition needed in multigitman. Should it be implemented now?

3. **Phase 2 sync vs jump to Phase 3** — static-copy fallback (safe, incremental), or skip straight to API-only reads (faster but all-or-nothing)?

4. **What about minis data?** — should the manage `data/` directory also store a cached copy of minis metadata, or keep proxying live from `minis.beyondmebtw.com`?
