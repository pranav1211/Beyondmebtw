// multigitman.js — multi-repo GitHub webhook deployer.
// One endpoint (/multig) shared by ALL project repos. The repo is identified
// from the webhook payload itself (repository.name), mapped to a folder under
// PROJECTS_ROOT, then synced with fetch + reset --hard + clean -fd.
//
// Registry (/projects/.registry.json) is a thin override table managed from
// the manage page. No row needed for the common case: folder = repo name,
// branch = main, enabled. A row only overrides folder/branch or disables.
//
// See docs/projects-multiwebhook-design.md and
// docs/projects-multiwebhook-implementation.md.

const express = require('express');
const { execFile } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 6030;
const PROJECTS_ROOT = process.env.MULTIGIT_ROOT || '/projects';
const REGISTRY_PATH = process.env.MULTIGIT_REGISTRY || path.join(PROJECTS_ROOT, '.registry.json');
const LOG_PATH = process.env.MULTIGIT_LOG || '/gitlogs/multigitman.log';
const STATE_PATH = process.env.MULTIGIT_STATE || '/gitlogs/multigitman-state.json';
const GIT_TIMEOUT_MS = 60000;

// Folder must be a single plain path segment; leading dot is rejected so the
// registry file itself (and any dotfile) can never be a deploy target.
const FOLDER_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const BRANCH_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
// Serve path: slash-separated segments, each starting alphanumeric — this
// makes ".." (and any dot-segment) unrepresentable, so it can't escape the checkout.
const SERVE_PATH_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

// With a serve path, the git checkout lives under .checkouts (dot-dir: nginx's
// wildcard can't reach it and listings skip it) and /projects/<folder> is a
// symlink into the checkout's subfolder. Without one, the checkout IS the folder.
const CHECKOUTS_DIR = '.checkouts';

function checkoutDir(folder, servePath) {
  return servePath
    ? path.join(PROJECTS_ROOT, CHECKOUTS_DIR, folder)
    : path.join(PROJECTS_ROOT, folder);
}

// Point /projects/<folder> at the checkout's serve subfolder. Retargets an
// existing link if the path changed; refuses to clobber a real directory.
function ensureServeLink(folder, servePath) {
  const link = path.join(PROJECTS_ROOT, folder);
  const target = path.join(CHECKOUTS_DIR, folder, servePath); // relative: survives root moves
  try {
    const st = fs.lstatSync(link);
    if (st.isSymbolicLink()) {
      if (fs.readlinkSync(link) === target) return null;
      fs.unlinkSync(link);
    } else {
      return `refusing to replace real directory ${link} with a symlink — remove it first`;
    }
  } catch {} // ENOENT: nothing there yet
  fs.symlinkSync(target, link);
  return null;
}

if (!process.env.multigitkey) {
  console.error('CRITICAL: multigitkey environment variable is not set. Webhook signature verification will reject all requests.');
}

// Per-folder in-flight lock: two fast pushes must not run overlapping resets.
const deploying = new Set();

// Last deploy result per folder, for the GET status page and the manage page's
// Live Projects list. Persisted to STATE_PATH so history survives restarts.
let lastDeploys = {};
try {
  const saved = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) lastDeploys = saved;
} catch {} // missing/corrupt state file just means empty history

function saveState() {
  fs.writeFile(STATE_PATH, JSON.stringify(lastDeploys, null, 2), () => {}); // best-effort
}

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  fs.appendFile(LOG_PATH, stamped + '\n', () => {}); // best-effort; pm2 logs are the fallback
}

function verifyGitHubSignature(payload, signature) {
  const secret = process.env.multigitkey;
  if (!secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const actual = signature.replace('sha256=', '');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(actual, 'hex');
  if (a.length !== b.length) return false; // timingSafeEqual throws on length mismatch
  return crypto.timingSafeEqual(a, b);
}

function loadRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    log(`Registry at ${REGISTRY_PATH} is not an object — treating as empty`);
  } catch (e) {
    if (e.code !== 'ENOENT') log(`Registry read error: ${e.message} — treating as empty`);
  }
  return {};
}

// repo name -> { folder, branch, enabled, path }, falling back to convention.
function resolveEntry(repoName) {
  const row = loadRegistry()[repoName];
  return {
    folder: (row && row.folder) || repoName,
    branch: (row && row.branch) || 'main',
    path: (row && row.path) || '',
    enabled: !row || row.enabled !== false,
    explicit: !!row
  };
}

function git(cwd, args, callback) {
  execFile('git', args, { cwd, timeout: GIT_TIMEOUT_MS }, callback);
}

function deploy(dir, branch, callback) {
  const output = [];
  const steps = [
    ['fetch', 'origin'],
    ['reset', '--hard', `origin/${branch}`],
    ['clean', '-fd']
  ];

  const run = i => {
    if (i >= steps.length) return callback(null, output.join('\n'));
    git(dir, steps[i], (error, stdout, stderr) => {
      if (stdout) output.push(stdout.trim());
      if (stderr) output.push(stderr.trim());
      if (error) return callback(error, output.join('\n'));
      run(i + 1);
    });
  };
  run(0);
}

const app = express();
app.use('/multig', express.raw({ type: 'application/json' }));

// What's actually on disk: every non-dot folder (or serve symlink) under
// PROJECTS_ROOT is a live (routable) project, whether or not it has a registry row.
function listProjects() {
  try {
    const registry = loadRegistry();
    const rowByFolder = {};
    for (const repo of Object.keys(registry)) {
      const row = registry[repo] || {};
      rowByFolder[row.folder || repo] = row;
    }
    return fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true })
      .filter(d => !d.name.startsWith('.') && (d.isDirectory() || d.isSymbolicLink()))
      .map(d => {
        const servePath = (rowByFolder[d.name] && rowByFolder[d.name].path) || '';
        return {
          folder: d.name,
          path: servePath,
          hasGit: fs.existsSync(path.join(checkoutDir(d.name, servePath), '.git')),
          hasIndex: fs.existsSync(path.join(PROJECTS_ROOT, d.name, 'index.html')) // follows the serve symlink
        };
      });
  } catch (e) {
    log(`listProjects error: ${e.message}`);
    return [];
  }
}

// Status page: folders on disk + registry view + last deploy per folder.
// No mutation, no secrets.
app.get('/multig', (req, res) => {
  res.json({
    projects: listProjects(),
    registry: loadRegistry(),
    lastDeploys,
    inFlight: [...deploying]
  });
});

app.post('/multig', (req, res) => {
  const signature = req.get('X-Hub-Signature-256');
  if (!signature) {
    log('Rejected: no signature');
    return res.status(401).json({ message: 'Unauthorized: No signature provided' });
  }
  if (!Buffer.isBuffer(req.body) || !verifyGitHubSignature(req.body, signature)) {
    log('Rejected: invalid signature');
    return res.status(401).json({ message: 'Unauthorized: Invalid signature' });
  }

  const event = req.get('X-GitHub-Event');
  if (event === 'ping') return res.status(200).json({ message: 'pong' });
  if (event !== 'push') return res.status(200).json({ message: `Event ${event} ignored` });

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Bad JSON payload' });
  }

  const repoName = payload.repository && payload.repository.name;
  if (!repoName) return res.status(400).json({ message: 'No repository.name in payload' });

  const { folder, branch, enabled, path: servePath, explicit } = resolveEntry(repoName);

  if (!enabled) {
    log(`${repoName}: disabled in registry — ignored`);
    return res.status(200).json({ message: 'Repo disabled in registry — ignored' });
  }
  if (!FOLDER_RE.test(folder) || !BRANCH_RE.test(branch) || (servePath && !SERVE_PATH_RE.test(servePath))) {
    log(`${repoName}: invalid folder "${folder}", branch "${branch}" or path "${servePath}" — rejected`);
    return res.status(400).json({ message: 'Invalid folder, branch or path in registry' });
  }
  if (payload.ref !== `refs/heads/${branch}`) {
    log(`${repoName}: push to ${payload.ref}, deploys track ${branch} — ignored`);
    return res.status(200).json({ message: `Push to ${payload.ref} ignored (tracking ${branch})` });
  }

  const dir = checkoutDir(folder, servePath);
  if (!fs.existsSync(path.join(dir, '.git'))) {
    log(`${repoName}: no git checkout at ${dir}${explicit ? '' : ' (no registry row either)'} — 404`);
    return res.status(404).json({ message: `Unknown project: no checkout at ${dir}. Clone it first or add a registry row.` });
  }

  if (deploying.has(folder)) {
    log(`${repoName} -> ${folder}: deploy already in flight — skipped`);
    return res.status(200).json({ message: 'Deploy already in flight for this folder — skipped' });
  }

  deploying.add(folder);
  log(`${repoName} -> ${folder} (${branch}${servePath ? `, serves ${servePath}/` : ''}): deploy started`);

  deploy(dir, branch, (error, output) => {
    deploying.delete(folder);

    // keep /projects/<folder> pointing at the serve subfolder (covers registry edits)
    let linkError = null;
    if (!error && servePath) {
      try {
        linkError = ensureServeLink(folder, servePath);
      } catch (e) {
        linkError = e.message;
      }
      if (linkError) log(`${repoName} -> ${folder}: serve link problem: ${linkError}`);
    }

    lastDeploys[folder] = {
      repo: repoName,
      branch,
      at: new Date().toISOString(),
      ok: !error && !linkError,
      output: (linkError ? `serve link: ${linkError}\n` : '') + output.slice(-2000)
    };
    saveState();

    if (error) {
      log(`${repoName} -> ${folder}: deploy FAILED: ${error.message}\n${output}`);
      return res.status(500).json({ message: 'Deploy failed', error: error.message, output });
    }
    if (linkError) {
      return res.status(500).json({ message: 'Deployed, but serve link failed', error: linkError, output });
    }
    log(`${repoName} -> ${folder}: deploy ok\n${output}`);
    res.status(200).json({ message: 'Deployed', folder, branch, output });
  });
});

app.listen(PORT, () => {
  console.log(`multigitman listening on ${PORT}; root=${PROJECTS_ROOT}, registry=${REGISTRY_PATH}`);
});
