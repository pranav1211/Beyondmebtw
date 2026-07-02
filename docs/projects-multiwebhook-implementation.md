# Projects Multi-Webhook — Implementation Runbook

> Companion to [projects-multiwebhook-design.md](projects-multiwebhook-design.md).
> Code shipped in the repo: [multigitman.js](../multigitman.js) (webhook server, port 6030),
> registry CRUD in [manage/manageserver.js](../manage/manageserver.js) (`/deployregistry`),
> Deploys tab in the manage page, nginx wildcard block in
> [server-config/projects-wildcard](server-config/projects-wildcard).
>
> Server facts verified 2026-07-02 (servermap): wildcard DNS `*.beyondmebtw.com`
> **already resolves** (CNAME → beyondmebtw.com → 167.71.230.251). Ports 6030+ free.
> `/gitlogs` exists (pvr-owned). pm2 manages all node services.

---

## Step 1 — Deploy the new code to the server

Push this repo; the existing `/bmbg` webhook deploys it to `/bmbsifi/Beyondmebtw` as usual.
`multigitman.js` runs from there (uses the repo's existing `express` install).

## Step 2 — Wildcard TLS cert (the one-time setup tax)

DNS already has the wildcard record — only the cert is missing. It needs DNS-01.

Identify the DNS host first:

```bash
dig NS beyondmebtw.com +short
```

**If DigitalOcean DNS** (likely — DO droplet):

```bash
# plugin install depends on how certbot is installed:
snap list certbot 2>/dev/null && sudo snap install certbot-dns-digitalocean \
  && sudo snap set certbot trust-plugin-with-root=ok \
  && sudo snap connect certbot:plugin certbot-dns-digitalocean
# (if certbot is apt: sudo apt install python3-certbot-dns-digitalocean)

# DO API token with read+write on domains → ~/.secrets/certbot/digitalocean.ini:
#   dns_digitalocean_token = <token>
sudo mkdir -p /root/.secrets/certbot
sudo nano /root/.secrets/certbot/digitalocean.ini && sudo chmod 600 /root/.secrets/certbot/digitalocean.ini

sudo certbot certonly \
  --dns-digitalocean \
  --dns-digitalocean-credentials /root/.secrets/certbot/digitalocean.ini \
  -d '*.beyondmebtw.com' \
  --cert-name star-beyondmebtw
```

**Any other DNS host:** use its certbot plugin if one exists. Avoid `--manual`
unless desperate — manual DNS-01 does not auto-renew.

Cert lands at `/etc/letsencrypt/live/star-beyondmebtw/` (the name the nginx block
expects). Covers `*.beyondmebtw.com` one level deep; the apex keeps its existing cert.

## Step 3 — Create /projects and clone

```bash
sudo mkdir /projects && sudo chown pvr:pvr /projects
echo '{}' > /projects/.registry.json

# one clone per project (the pvr SSH key already fetches pranav1211 repos —
# same auth as the main repo — so private repos work with no extra setup):
git clone git@github.com:pranav1211/<repo>.git /projects/<name>
```

Folder name = subdomain, always. Clone `mynyl`, `f1hapticandroid`, `uceedanswer`
(the three with live subdomains) plus anything new.

## Step 4 — Secret + start multigitman under pm2

```bash
openssl rand -hex 32          # this is the shared webhook secret
sudo nano /etc/environment    # add: multigitkey=<secret>

# re-login (or: export multigitkey=<secret>) so pm2 inherits it, then:
cd /bmbsifi/Beyondmebtw
pm2 start multigitman.js --name multigitman
pm2 save
```

Sanity: `curl http://localhost:6030/multig` → JSON status (registry + lastDeploys).

## Step 5 — nginx

```bash
# 1. wildcard block
sudo cp /bmbsifi/Beyondmebtw/docs/server-config/projects-wildcard /etc/nginx/sites-enabled/projects-wildcard

# 2. webhook route — add inside the main `server` block in /etc/nginx/sites-enabled/Beyondmebtw,
#    next to the existing /bmbg location:
#    location /multig {
#        proxy_set_header Host              $host;
#        proxy_set_header X-Real-IP         $remote_addr;
#        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
#        proxy_set_header X-Forwarded-Proto $scheme;
#        proxy_pass http://localhost:6030;
#    }

# 3. registry CRUD route — add to /etc/nginx/sites-enabled/manage.beyondmebtw.com,
#    alongside the other API locations:
#    location /deployregistry { include snippets/bmb-proxy.conf; proxy_pass http://localhost:7000; }

sudo nginx -t && sudo systemctl reload nginx
```

Verify nothing regressed: main site, manage, blog, minis, photos all load.
Reserved subdomains keep their explicit blocks — exact `server_name` beats regex,
so the wildcard cannot swallow them.

## Step 6 — GitHub webhooks (one per project repo, all identical)

Repo → Settings → Webhooks → Add:

- **URL:** `https://beyondmebtw.com/multig`
- **Content type:** `application/json` (required — signature is over the raw JSON body)
- **Secret:** the `multigitkey` value
- **Events:** just the push event

GitHub has no account-level webhooks for personal accounts, so this is per-repo —
but it's the same URL + secret every time, nothing to think about.

## Step 7 — End-to-end test (one project first)

1. Webhook page → Recent Deliveries → the automatic `ping` should show **200 pong**.
2. Push a trivial commit to the repo's `main`.
3. `tail /gitlogs/multigitman.log` → `deploy started` … `deploy ok`.
4. `https://<name>.beyondmebtw.com` serves the new content (wildcard cert, `/projects/<name>` root).

Failure modes: 401 = secret mismatch; 404 = no checkout at `/projects/<name>`
(clone it, or the repo name ≠ folder — add a registry row); "branch ignored" =
push wasn't to the tracked branch.

## Step 8 — Migrate the three existing project subdomains

Their old explicit nginx blocks point at `/bmbsifi/Beyondmebtw/projects/<name>`
and win over the wildcard (exact match beats regex). After the new checkout works:

```bash
sudo mkdir -p /root/nginx-retired
# NOTE: the sites-available entries are symlinks INTO sites-enabled here, so
# moving the sites-enabled file retires both.
sudo mv /etc/nginx/sites-enabled/mynyl.beyondmebtw.com          /root/nginx-retired/
sudo mv /etc/nginx/sites-enabled/f1hapticandroid.beyondmebtw.com /root/nginx-retired/
sudo mv /etc/nginx/sites-enabled/uceedanswer.beyondmebtw.com     /root/nginx-retired/
sudo rm /etc/nginx/sites-available/{mynyl,f1hapticandroid,uceedanswer}.beyondmebtw.com  # dead symlinks
sudo nginx -t && sudo systemctl reload nginx
```

Each subdomain now routes through the wildcard block. Once confident, delete the
per-subdomain certs so their renewals don't start failing (no server block = HTTP-01
renewal breaks):

```bash
sudo certbot delete --cert-name mynyl.beyondmebtw.com
sudo certbot delete --cert-name f1hapticandroid.beyondmebtw.com
sudo certbot delete --cert-name uceedanswer.beyondmebtw.com
```

Rollback at any point: move the retired file back, reload nginx.

## Step 9 — Main repo cleanup (only after Step 8 verified)

The gallery (`projects/index.html`, `projects.js`, `project-data.json`, CSS) **stays
tracked** — `projects.beyondmebtw.com` and `beyondmebtw.com/projects/` keep serving it
from the main repo. Only the migrated project folders leave:

```bash
# in the Beyondmebtw repo
printf 'projects/mynyl/\nprojects/f1hapticandroid/\nprojects/uceedanswer/\n' >> .gitignore
git rm -r --cached projects/mynyl projects/f1hapticandroid projects/uceedanswer
git commit -m "projects now deploy independently via multigitman"
```

(`git rm --cached` leaves the working copies on disk; the live serving copies are in
`/projects` anyway.) Legacy folders without their own repos (V1, grocery, minescan,
pairgame, beyondpages, rtdms) stay in the main repo — no subdomains, no change.

Then update `CLAUDE.md` project structure + flip the design doc status line.

## Adding a project from now on

1. Make the repo.
2. Add the webhook: `https://beyondmebtw.com/multig` + the shared secret.
3. `git clone git@github.com:pranav1211/<repo>.git /projects/<name>` once.
4. Done — live at `https://<name>.beyondmebtw.com`. Registry row (manage page →
   Deploys) only if repo name ≠ folder, non-main branch, or to disable.
