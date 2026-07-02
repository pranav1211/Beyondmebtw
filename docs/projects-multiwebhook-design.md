# Projects Multi-Webhook + Subdomain Routing — Design Doc

> Status: **Code implemented (2026-07-02) — server rollout pending.**
> See [projects-multiwebhook-implementation.md](projects-multiwebhook-implementation.md) for the runbook.
> Captured 2026-06-22.
> Goal: move projects out of the `Beyondmebtw` repo so each project lives in its own
> repo, syncs to the server automatically on push, and serves on its own subdomain
> with zero per-project infrastructure work.

---

## Problem

Today, every project lives inside `Beyondmebtw/projects/<x>/`, but each project *also*
has a separate git repo elsewhere for isolated tracking. Keeping them in sync means
manually copying files from the project repo into the serving folder and pushing. This
is tedious (esp. for actively-developed projects like `mynyl`) and couples unrelated
code into the main site repo.

Two distinct problems are tangled together here. Keep them separate:

1. **Code sync** — keep `/projects/<x>` on the server fresh with each project's own repo.
2. **Subdomain routing** — map `<name>.beyondmebtw.com` → `/projects/<name>`.

The webhook solves (1). Web server config solves (2). They are independent — the webhook
never touches routing, routing never touches sync.

---

## Target architecture

Three decoupled layers. Each is set up **once**; after that, a new project is just
"make a repo, add the webhook, clone the folder."

```
DNS + TLS (wildcard)      →  set once, covers all future subdomains
nginx regex root          →  set once, routes <sub>.beyondmebtw.com → /projects/<sub>
webhook + thin registry   →  one shared endpoint; one optional row per project
```

### Layer 1 — DNS + TLS (one-time)

- **Wildcard DNS A record:** `*.beyondmebtw.com → <server IP>`. One record covers every
  current and future project subdomain.
- **Wildcard TLS cert:** `*.beyondmebtw.com` from Let's Encrypt via the **DNS-01**
  challenge (HTTP-01 can't do wildcards). This is the only real setup tax — it removes
  the need to issue a cert per subdomain forever after.

### Layer 2 — nginx routing by convention (one-time)

Single regex `server` block maps subdomain → folder:

```nginx
server {
    listen 443 ssl;
    server_name ~^(?<sub>[^.]+)\.beyondmebtw\.com$;
    root /projects/$sub;
    index index.html;
    # ssl_certificate / ssl_certificate_key → the *.beyondmebtw.com wildcard cert
}
```

- `f1hapticandroid.beyondmebtw.com` → `/projects/f1hapticandroid`
- `mynyl.beyondmebtw.com` → `/projects/mynyl`
- A project invented next month works the instant its folder exists. **Zero config edits.**

**Reserved subdomains** (`www`, the main site, `projects`, `manage`, the webhook API)
get their own explicit `server` blocks. nginx matches exact `server_name` before regex,
so they automatically take precedence over the wildcard — no conflict.

> Routing follows the **folder name**, always. Never the repo name. (Matters for the
> alias case below.)

### Layer 3 — multi-repo webhook + thin registry

Generalize the existing single-repo deployer ([beyondgitman.js](../beyondgitman.js)) into
a multi-repo version. The existing one already has the hard parts: HMAC signature
verification, raw-body capture, `execFile` to a deploy script.

**Key decision: no query parameter.** The GitHub webhook payload already contains
`repository.name` (and `repository.full_name`). The server reads the repo name straight
out of the JSON and looks up which folder to deploy. This means **one identical webhook
URL for every repo** — nothing per-project in the webhook config, nothing to typo.

Flow:

```
POST /deploy
  → verify X-Hub-Signature-256 (shared secret)        [reject if bad]
  → parse payload
  → check ref === refs/heads/<branch>                  [ignore other branches]
  → resolve folder from repository.name (see registry) [404-ignore if unknown]
  → acquire per-folder lock                            [skip if already running]
  → cd /projects/<folder> && git fetch && git reset --hard origin/<branch> && git clean -fd
  → release lock, 200
```

---

## Decisions locked in

| Decision | Choice | Why |
|---|---|---|
| Repo identification | Read `repository.name` from payload | One URL for all repos; no query param to mistype |
| Secret | **One shared secret** across all webhooks | Fine for a personal site; fewer moving parts |
| Sync command | `git fetch` + `git reset --hard` (+ `git clean -fd`) | Server tree is a *mirror*, not a merge point. `pull` breaks on any local diff |
| Branch | Check `ref` in payload; default `main` | Prevents a feature-branch push from redeploying prod |
| Routing | Convention: subdomain = folder name | One nginx block covers all projects |
| Repo-name ≠ subdomain | Thin **alias** registry (escape hatch) | Convention by default, override when needed |
| Concurrency | Per-folder in-flight lock (in-memory `Set`) | Two fast pushes shouldn't run overlapping resets |

### The registry (thin, managed from the manage page)

Convention handles ~95% of cases, so the registry is mostly an **escape hatch**, not a
required mapping. Default: folder = repo = subdomain. Override only when needed:

```json
{
  "some-private-repo-name": { "folder": "vinyl", "branch": "dev", "enabled": true }
}
```

Webhook logic: read `repository.name` → explicit row? use its `folder`/`branch` →
otherwise fall back to a folder of the same name on `main`.

The registry only affects **deploy** (which folder gets reset). It does **not** affect
routing. So if repo `some-private-repo-name` deploys to folder `vinyl`, the live URL is
`vinyl.beyondmebtw.com` — public name always follows the folder.

Registry earns its keep for: per-project branch, enable/disable toggle, and being a
list you can eyeball. Keep it thin.

---

## "Load balancing" clarification

Not traffic load balancing — **separation of concerns / blast-radius isolation**:

- The `Beyondmebtw` repo becomes *only* the site (homepage, blog, about, manage).
- Editing the blog no longer means staring at every project in the tree.
- A push to `mynyl` redeploys only `mynyl`.
- Main repo gets smaller, its deploys faster, its git history clean of project churn.
- A messy/broken project can't muddy the site deploy.

**The mechanical step that makes this real:** `gitignore` the `projects/` folder in the
`Beyondmebtw` repo (or drop it entirely — on the server it becomes a separate top-level
`/projects` anyway). Without this, the site repo keeps tracking project files and nothing
is actually separated.

### Server path change

```
old:  /bmbsifi/Beyondmebtw/projects/f1hapticandroid
new:  /projects/f1hapticandroid
```

> Do **not** confuse this `/projects` folder with the `index.html` that serves the blog
> page. Different concern — the main site keeps serving as it does now.

---

## What's genuinely new infrastructure

Everything else is reuse. The only new pieces:

1. Wildcard DNS record (once).
2. Wildcard TLS cert via DNS-01 (once).
3. One nginx regex `server` block + explicit blocks for reserved subdomains (once).
4. Generalize `beyondgitman.js` → multi-repo webhook reading `repository.name`.
5. Thin registry + manage-page CRUD for it.

After setup, adding a project = **make repo → add the one webhook URL + secret → clone
folder once → (optional) add a registry row for branch/alias.**

---

## Open items / risks to handle at implementation time

- [ ] **Private repos** need auth for `git fetch` — deploy key or PAT on the server.
      Decide per project which are private. (Public repos fetch trivially.)
- [ ] **First clone is manual** (or could be auto-cloned on unknown repo — deferred;
      not automating for now).
- [ ] **Reserved-subdomain blocks** must exist before going live so the wildcard doesn't
      swallow `www` / `manage` / the main site.
- [ ] **Migration order:** stand up `/projects` + routing + webhook *before* removing
      `projects/` from the main repo, so nothing 404s mid-migration.
- [ ] Confirm the convention holds: every subdomain name == its folder name (repo name
      can differ via the alias).
- [ ] Per-folder lock to avoid overlapping deploys.
- [ ] Deploy script should log output (stdout/stderr) for debugging failed pulls.

---

## Migration checklist (when implementing)

1. Wildcard DNS `*.beyondmebtw.com → server IP`.
2. Wildcard cert `*.beyondmebtw.com` (DNS-01).
3. nginx: regex wildcard block + explicit reserved-subdomain blocks. Reload, verify
   reserved subdomains still resolve correctly.
4. Create top-level `/projects` on server. Clone each project repo into `/projects/<name>`.
5. Write multi-repo webhook (generalize `beyondgitman.js`); deploy on its own port +
   reserved subdomain/route. Set shared secret env var.
6. Registry JSON + manage-page CRUD.
7. Add the webhook to each project repo on GitHub (same URL + secret each time).
8. Test one project end-to-end: push → webhook fires → fetch+reset → live on subdomain.
9. Once verified for all: `gitignore` (or remove) `projects/` in the `Beyondmebtw` repo.
10. Update `CLAUDE.md` project structure to reflect projects living outside the repo.
```
