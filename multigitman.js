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
const GIT_TIMEOUT_MS = 60000;

// Folder must be a single plain path segment; leading dot is rejected so the
// registry file itself (and any dotfile) can never be a deploy target.
const FOLDER_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const BRANCH_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

if (!process.env.multigitkey) {
  console.error('CRITICAL: multigitkey environment variable is not set. Webhook signature verification will reject all requests.');
}

// Per-folder in-flight lock: two fast pushes must not run overlapping resets.
const deploying = new Set();
// Last deploy result per folder, for the GET status page.
const lastDeploys = {};

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

// repo name -> { folder, branch, enabled }, falling back to convention.
function resolveEntry(repoName) {
  const row = loadRegistry()[repoName];
  return {
    folder: (row && row.folder) || repoName,
    branch: (row && row.branch) || 'main',
    enabled: !row || row.enabled !== false,
    explicit: !!row
  };
}

function git(cwd, args, callback) {
  execFile('git', args, { cwd, timeout: GIT_TIMEOUT_MS }, callback);
}

function deploy(folder, branch, callback) {
  const dir = path.join(PROJECTS_ROOT, folder);
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

// Status page: registry view + last deploy per folder. No mutation, no secrets.
app.get('/multig', (req, res) => {
  res.json({
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

  const { folder, branch, enabled, explicit } = resolveEntry(repoName);

  if (!enabled) {
    log(`${repoName}: disabled in registry — ignored`);
    return res.status(200).json({ message: 'Repo disabled in registry — ignored' });
  }
  if (!FOLDER_RE.test(folder) || !BRANCH_RE.test(branch)) {
    log(`${repoName}: invalid folder "${folder}" or branch "${branch}" — rejected`);
    return res.status(400).json({ message: 'Invalid folder or branch in registry' });
  }
  if (payload.ref !== `refs/heads/${branch}`) {
    log(`${repoName}: push to ${payload.ref}, deploys track ${branch} — ignored`);
    return res.status(200).json({ message: `Push to ${payload.ref} ignored (tracking ${branch})` });
  }

  const dir = path.join(PROJECTS_ROOT, folder);
  if (!fs.existsSync(path.join(dir, '.git'))) {
    log(`${repoName}: no git checkout at ${dir}${explicit ? '' : ' (no registry row either)'} — 404`);
    return res.status(404).json({ message: `Unknown project: no checkout at ${dir}. Clone it first or add a registry row.` });
  }

  if (deploying.has(folder)) {
    log(`${repoName} -> ${folder}: deploy already in flight — skipped`);
    return res.status(200).json({ message: 'Deploy already in flight for this folder — skipped' });
  }

  deploying.add(folder);
  log(`${repoName} -> ${folder} (${branch}): deploy started`);

  deploy(folder, branch, (error, output) => {
    deploying.delete(folder);
    lastDeploys[folder] = {
      repo: repoName,
      branch,
      at: new Date().toISOString(),
      ok: !error,
      output: output.slice(-2000)
    };

    if (error) {
      log(`${repoName} -> ${folder}: deploy FAILED: ${error.message}\n${output}`);
      return res.status(500).json({ message: 'Deploy failed', error: error.message, output });
    }
    log(`${repoName} -> ${folder}: deploy ok\n${output}`);
    res.status(200).json({ message: 'Deployed', folder, branch, output });
  });
});

app.listen(PORT, () => {
  console.log(`multigitman listening on ${PORT}; root=${PROJECTS_ROOT}, registry=${REGISTRY_PATH}`);
});
