const http = require("http");
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");
const nodePath = require("path");

let thepasskey;
try {
  thepasskey = process.env.managekey || fs.readFileSync("/etc/environment", "utf8")
    .split("\n")
    .find((line) => line.startsWith("managekey="))
    ?.split("=")[1]?.trim();

  if (!thepasskey) {
    console.error("Warning: managekey not found in environment or file");
    thepasskey = "default-secure-key";
  }
} catch (error) {
  console.error("Error reading password:", error);
  thepasskey = "default-secure-key";
}

// ─── Category Config ──────────────────────────────────────────────────────────
// Loaded from blog/categories.json at startup. Public manifest — clients fetch it too.
let CATEGORY_CONFIG = {};

const PROJECTS_JSON_PATH = "/bmbsifi/Beyondmebtw/projects/project-data.json";
const BLOG_BASE_PATH = "/bmbsifi/Beyondmebtw/blog";
const CATEGORIES_CONFIG_PATH = nodePath.join(BLOG_BASE_PATH, "categories.json");
const CATEGORIES_CONFIG_LOCAL = nodePath.join(__dirname, "..", "blog", "categories.json");
const PHOTOS_JSON_PATH = "/bmbsifi/Beyondmebtw/photos/photos.json";
const PHOTOS_JSON_LOCAL = nodePath.join(__dirname, "..", "photos", "photos.json");
const DEPLOY_REGISTRY_PATH = "/projects/.registry.json";
const DEPLOY_REGISTRY_LOCAL = nodePath.join(__dirname, "..", "docs", "registry.local.json");

function resolveCategoriesPath() {
  if (fs.existsSync(CATEGORIES_CONFIG_PATH)) return CATEGORIES_CONFIG_PATH;
  if (fs.existsSync(CATEGORIES_CONFIG_LOCAL)) return CATEGORIES_CONFIG_LOCAL;
  return CATEGORIES_CONFIG_PATH;
}

function loadCategoriesConfig() {
  try {
    const path = resolveCategoriesPath();
    if (fs.existsSync(path)) {
      const raw = fs.readFileSync(path, "utf8");
      const parsed = safeJSONParse(raw, null);
      if (parsed !== null && typeof parsed === 'object') {
        CATEGORY_CONFIG = parsed;
        console.log("Categories manifest loaded from", path);
      } else {
        console.error("categories.json contains invalid data; starting with empty manifest");
      }
    } else {
      console.warn("categories.json not found at", path, "— starting with empty manifest");
    }
  } catch (e) {
    console.error("Error loading categories manifest:", e);
  }
}

function saveCategoriesConfig() {
  try {
    const path = fs.existsSync(BLOG_BASE_PATH) ? CATEGORIES_CONFIG_PATH : CATEGORIES_CONFIG_LOCAL;
    fs.writeFileSync(path, JSON.stringify(CATEGORY_CONFIG, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving categories manifest:", e);
  }
}

// ─── In-memory state ──────────────────────────────────────────────────────────
let jsdata = {
  mainPost: {},
  featured: Array(4).fill(null).map(() => ({})),
  featuredProjects: [1, 2, 3, 4],
  featuredMinis: Array(3).fill(null).map(() => ({})),
  categories: {}
};

let blogData = {};

const blogUrls = {};

function rebuildBlogUrls() {
  Object.keys(CATEGORY_CONFIG).forEach(key => {
    blogUrls[key] = `https://beyondmebtw.com/blog/${key}.json`;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Safe JSON parse wrapper that returns a default value on failure
function safeJSONParse(str, defaultValue = null) {
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (e) {
    console.error("JSON parse error:", e.message);
    return defaultValue;
  }
}

function getJSONBody(request, callback) {
  let body = "";
  request.on("data", chunk => { body += chunk.toString(); });
  request.on("end", () => {
    const parsed = safeJSONParse(body);
    if (parsed === null) {
      callback(new Error("Invalid JSON in request body"), null);
    } else {
      callback(null, parsed);
    }
  });
  request.on("error", e => callback(e, null));
}

function sendJSON(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function sendError(response, msg, status = 400) {
  response.statusCode = status;
  response.end(msg);
}

function normalizeProjectImages(images) {
  if (typeof images === 'string') {
    return images
      .split(',')
      .map(url => url.trim())
      .filter(Boolean)
      .map(url => ({ url, description: '' }));
  }

  if (!Array.isArray(images)) return [];

  return images.map(image => {
    if (typeof image === 'string') {
      const url = image.trim();
      return url ? { url, description: '' } : null;
    }

    if (image && typeof image === 'object') {
      const url = String(image.url || image.src || '').trim();
      if (!url) return null;
      return {
        url,
        description: String(image.description || '').trim()
      };
    }

    return null;
  }).filter(Boolean);
}

function validateKey(key, response) {
  if (!key) { sendError(response, "Missing key", 400); return false; }
  if (key !== thepasskey) { sendError(response, "Unauthorized - Invalid key", 403); return false; }
  return true;
}

// ─── Data loading ─────────────────────────────────────────────────────────────
function loadExistingData() {
  const jsonPath = nodePath.join(__dirname, "latest.json");
  try {
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf8");
      const existing = safeJSONParse(raw, null);
      if (existing === null || typeof existing !== 'object') {
        console.error("latest.json contains invalid data, skipping load");
        return;
      }
      jsdata.mainPost = existing.mainPost || {};
      jsdata.featured = existing.featured || Array(4).fill(null).map(() => ({}));
      jsdata.featuredProjects = existing.featuredProjects || [1, 2, 3, 4];
      jsdata.featuredMinis = Array.isArray(existing.featuredMinis)
        ? existing.featuredMinis.slice(0, 3).concat(Array(Math.max(0, 3 - existing.featuredMinis.length)).fill({}))
        : Array(3).fill(null).map(() => ({}));
      jsdata.categories = existing.categories || {};
      console.log("Existing local data loaded");
    }
  } catch (e) {
    console.error("Error loading existing data:", e);
  }
}

function loadJSON(callback) {
  loadExistingData();
  const request = https.get("https://beyondmebtw.com/manage/latest.json", res => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => {
      const parsed = safeJSONParse(data, null);
      if (parsed !== null && typeof parsed === 'object') {
        jsdata.mainPost = { ...jsdata.mainPost, ...parsed.mainPost } || jsdata.mainPost;
        if (Array.isArray(parsed.featured)) {
          for (let i = 0; i < Math.min(parsed.featured.length, 4); i++) {
            jsdata.featured[i] = { ...jsdata.featured[i], ...parsed.featured[i] };
          }
        }
        if (parsed.categories) {
          jsdata.categories = { ...jsdata.categories, ...parsed.categories };
        }
        if (parsed.featuredProjects) {
          jsdata.featuredProjects = parsed.featuredProjects;
        }
        if (Array.isArray(parsed.featuredMinis)) {
          const incoming = parsed.featuredMinis.slice(0, 3);
          jsdata.featuredMinis = incoming.concat(Array(Math.max(0, 3 - incoming.length)).fill({}));
        }
      } else {
        console.error("Remote latest.json returned invalid data, skipping merge");
      }
      callback();
    });
  });
  request.on("error", e => { console.error("Fetch error:", e); callback(); });
  request.setTimeout(10000, () => { request.destroy(); callback(); });
}

function loadBlogJSON(category, callback) {
  const url = blogUrls[category];
  if (!url) return callback(new Error("Invalid category"));

  const request = https.get(url, res => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => {
      const parsed = safeJSONParse(data, null);
      if (parsed !== null && typeof parsed === 'object') {
        blogData[category] = {
          subcategories: parsed.subcategories || [],
          posts: parsed.posts || []
        };
        console.log(`Blog data loaded for ${category}`);
      } else {
        console.error(`Parse error for ${category}: invalid JSON data`);
        blogData[category] = { subcategories: [], posts: [] };
      }
      callback();
    });
  });
  request.on("error", e => {
    console.error(`Fetch error for ${category}:`, e);
    blogData[category] = { subcategories: [], posts: [] };
    callback();
  });
  request.setTimeout(10000, () => { request.destroy(); blogData[category] = { subcategories: [], posts: [] }; callback(); });
}

// ─── Write helpers ────────────────────────────────────────────────────────────
function writeJSONFile(callback) {
  const jsonPath = nodePath.join(__dirname, "latest.json");
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(jsdata, null, 2), "utf8");
    console.log("latest.json written");
    callback(null);
  } catch (e) {
    console.error("Error writing latest.json:", e);
    callback(e);
  }
}

function writeBlogJSONFile(category, callback) {
  const jsonPath = nodePath.join(BLOG_BASE_PATH, `${category}.json`);
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(blogData[category], null, 2), "utf8");
    console.log(`${category}.json written`);
    callback(null);
  } catch (e) {
    console.error(`Error writing ${category}.json:`, e);
    callback(e);
  }
}

function writeProjectsJSON(projects, callback) {
  try {
    fs.writeFileSync(PROJECTS_JSON_PATH, JSON.stringify(projects, null, 2), "utf8");
    console.log("project-data.json written");
    callback(null);
  } catch (e) {
    console.error("Error writing project-data.json:", e);
    callback(e);
  }
}

function readProjectsJSON() {
  try {
    if (fs.existsSync(PROJECTS_JSON_PATH)) {
      const raw = fs.readFileSync(PROJECTS_JSON_PATH, "utf8");
      const parsed = safeJSONParse(raw, null);
      if (Array.isArray(parsed)) return parsed;
      console.error("project-data.json does not contain a valid array, trying fallback");
    }
    // Fallback to local dev path
    const localPath = nodePath.join(__dirname, "../projects/project-data.json");
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, "utf8");
      const parsed = safeJSONParse(raw, null);
      if (Array.isArray(parsed)) return parsed;
      console.error("Local project-data.json does not contain a valid array");
    }
    return [];
  } catch (e) {
    console.error("Error reading project-data.json:", e);
    return [];
  }
}

function writeProjectsJSONSafe(projects, callback) {
  // Try server path first, fallback to local dev path
  const serverPath = PROJECTS_JSON_PATH;
  const localPath = nodePath.join(__dirname, "../projects/project-data.json");

  try {
    if (fs.existsSync(nodePath.dirname(serverPath))) {
      fs.writeFileSync(serverPath, JSON.stringify(projects, null, 2), "utf8");
    } else {
      fs.writeFileSync(localPath, JSON.stringify(projects, null, 2), "utf8");
    }
    console.log("project-data.json written");
    callback(null);
  } catch (e) {
    // Try local path as fallback
    try {
      fs.writeFileSync(localPath, JSON.stringify(projects, null, 2), "utf8");
      console.log("project-data.json written (local fallback)");
      callback(null);
    } catch (e2) {
      console.error("Error writing project-data.json:", e2);
      callback(e2);
    }
  }
}

// ─── Deploy registry helpers ──────────────────────────────────────────────────
// Thin override table for multigitman.js: repo name -> { folder, branch, enabled }.
// No row = convention (folder = repo, branch = main, enabled). See
// docs/projects-multiwebhook-design.md.

const DEPLOY_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const DEPLOY_BRANCH_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function resolveDeployRegistryPath() {
  if (fs.existsSync(nodePath.dirname(DEPLOY_REGISTRY_PATH))) return DEPLOY_REGISTRY_PATH;
  return DEPLOY_REGISTRY_LOCAL;
}

function readDeployRegistry() {
  try {
    const path = resolveDeployRegistryPath();
    if (fs.existsSync(path)) {
      const parsed = safeJSONParse(fs.readFileSync(path, "utf8"), null);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      console.error("Deploy registry contains invalid data — treating as empty");
    }
    return {};
  } catch (e) {
    console.error("Error reading deploy registry:", e);
    return {};
  }
}

function writeDeployRegistry(registry, callback) {
  try {
    fs.writeFileSync(resolveDeployRegistryPath(), JSON.stringify(registry, null, 2), "utf8");
    console.log("Deploy registry written");
    callback(null);
  } catch (e) {
    console.error("Error writing deploy registry:", e);
    callback(e);
  }
}

function handleDeployRegistrySet(body, response) {
  const repo = String(body.repo || '').trim();
  if (!DEPLOY_NAME_RE.test(repo)) return sendError(response, "Invalid repo name");

  const row = {};
  if (body.folder !== undefined && String(body.folder).trim() !== '') {
    const folder = String(body.folder).trim();
    if (!DEPLOY_NAME_RE.test(folder)) return sendError(response, "Invalid folder name");
    if (folder !== repo) row.folder = folder;
  }
  if (body.branch !== undefined && String(body.branch).trim() !== '') {
    const branch = String(body.branch).trim();
    if (!DEPLOY_BRANCH_RE.test(branch)) return sendError(response, "Invalid branch name");
    if (branch !== 'main') row.branch = branch;
  }
  if (body.enabled === false) row.enabled = false;

  const registry = readDeployRegistry();
  registry[repo] = row;
  writeDeployRegistry(registry, err => {
    if (err) return sendError(response, "Error writing deploy registry", 500);
    sendJSON(response, { success: true, message: `Registry row saved for ${repo}`, registry });
  });
}

function handleDeployRegistryDelete(body, response) {
  const repo = String(body.repo || '').trim();
  const registry = readDeployRegistry();
  if (!(repo in registry)) return sendError(response, "Repo not in registry");
  delete registry[repo];
  writeDeployRegistry(registry, err => {
    if (err) return sendError(response, "Error writing deploy registry", 500);
    sendJSON(response, { success: true, message: `Registry row removed for ${repo}`, registry });
  });
}

// ─── Photos helpers ───────────────────────────────────────────────────────────
function resolvePhotosPath(forWrite) {
  // For reads: prefer server path, fall back to local.
  // For writes: write wherever the parent directory exists.
  if (forWrite) {
    if (fs.existsSync(nodePath.dirname(PHOTOS_JSON_PATH))) return PHOTOS_JSON_PATH;
    return PHOTOS_JSON_LOCAL;
  }
  if (fs.existsSync(PHOTOS_JSON_PATH)) return PHOTOS_JSON_PATH;
  return PHOTOS_JSON_LOCAL;
}

function clampSpan(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.max(1, Math.min(4, v));
}

function readPhotosJSON() {
  try {
    const path = resolvePhotosPath(false);
    if (fs.existsSync(path)) {
      const raw = fs.readFileSync(path, "utf8");
      const parsed = safeJSONParse(raw, null);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.series)) {
        return parsed;
      }
    }
    return { series: [] };
  } catch (e) {
    console.error("Error reading photos.json:", e);
    return { series: [] };
  }
}

function writePhotosJSON(data, callback) {
  try {
    const path = resolvePhotosPath(true);
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("photos.json written to", path);
    callback(null);
  } catch (e) {
    // Fallback to local dev path if the primary path failed.
    try {
      fs.writeFileSync(PHOTOS_JSON_LOCAL, JSON.stringify(data, null, 2), "utf8");
      console.log("photos.json written (local fallback)");
      callback(null);
    } catch (e2) {
      console.error("Error writing photos.json:", e2);
      callback(e2);
    }
  }
}

function sanitizePhotosId(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 64);
}

function normalizePhotosImage(image, fallbackId) {
  if (!image || typeof image !== 'object') return null;
  const url = String(image.url || '').trim();
  if (!url) return null;
  const id = sanitizePhotosId(image.id) || sanitizePhotosId(fallbackId) || `img_${Date.now()}`;
  const rawO = String(image.orientation || '').toLowerCase().trim();
  const orientation = (rawO === 'portrait' || rawO === 'square') ? rawO : 'landscape';
  return {
    id,
    url,
    description: String(image.description || '').trim(),
    alt: String(image.alt || '').trim(),
    orientation
  };
}

function normalizePhotosSeries(series) {
  if (!series || typeof series !== 'object') return null;
  const id = sanitizePhotosId(series.id);
  const title = String(series.title || '').trim();
  if (!id || !title) return null;

  const grid = (series.grid && typeof series.grid === 'object') ? series.grid : {};
  const images = Array.isArray(series.images)
    ? series.images
        .map((img, i) => normalizePhotosImage(img, `${id}_${i + 1}`))
        .filter(Boolean)
    : [];

  return {
    id,
    title,
    description: String(series.description || '').trim(),
    thumbnail: String(series.thumbnail || '').trim(),
    rawLink: String(series.rawLink || '').trim(),
    rawLinkLabel: String(series.rawLinkLabel || '').trim(),
    grid: {
      colSpan: clampSpan(grid.colSpan),
      rowSpan: clampSpan(grid.rowSpan)
    },
    order: Number.isFinite(parseInt(series.order, 10)) ? parseInt(series.order, 10) : 999,
    images
  };
}

function findSeriesIndex(data, seriesId) {
  return data.series.findIndex(s => s.id === seriesId);
}

// ─── Photos endpoint handlers ─────────────────────────────────────────────────
function handlePhotosCreateSeries(body, response) {
  const data = readPhotosJSON();
  const normalized = normalizePhotosSeries(body);
  if (!normalized) return sendError(response, "Missing id or title");
  if (findSeriesIndex(data, normalized.id) !== -1) {
    return sendError(response, "Series id already exists");
  }
  // Assign an order at the end if not provided.
  if (body.order === undefined || body.order === null || body.order === '') {
    const maxOrder = data.series.reduce((m, s) => Math.max(m, s.order || 0), 0);
    normalized.order = maxOrder + 1;
  }
  data.series.push(normalized);
  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Series created", series: normalized });
    });
  });
}

function handlePhotosUpdateSeries(body, response) {
  const data = readPhotosJSON();
  const seriesId = sanitizePhotosId(body.seriesId || body.id);
  if (!seriesId) return sendError(response, "Missing seriesId");
  const idx = findSeriesIndex(data, seriesId);
  if (idx === -1) return sendError(response, "Series not found");

  const current = data.series[idx];
  const merged = { ...current, ...body, id: current.id, images: current.images };
  const normalized = normalizePhotosSeries(merged);
  if (!normalized) return sendError(response, "Invalid series payload");
  // Preserve existing image list (separate endpoints manage images).
  normalized.images = current.images || [];

  data.series[idx] = normalized;
  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Series updated", series: normalized });
    });
  });
}

function handlePhotosDeleteSeries(body, response) {
  const data = readPhotosJSON();
  const seriesId = sanitizePhotosId(body.seriesId || body.id);
  if (!seriesId) return sendError(response, "Missing seriesId");
  const before = data.series.length;
  data.series = data.series.filter(s => s.id !== seriesId);
  if (data.series.length === before) return sendError(response, "Series not found");

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Series deleted" });
    });
  });
}

function handlePhotosUpdateLayout(body, response) {
  const data = readPhotosJSON();
  const layout = Array.isArray(body.layout) ? body.layout : null;
  if (!layout) return sendError(response, "Missing layout array");

  layout.forEach((item, position) => {
    if (!item || typeof item !== 'object') return;
    const seriesId = sanitizePhotosId(item.seriesId);
    const sIdx = findSeriesIndex(data, seriesId);
    if (sIdx === -1) return;
    const series = data.series[sIdx];
    if (!series.grid) series.grid = { colSpan: 1, rowSpan: 1 };
    if (item.colSpan !== undefined) series.grid.colSpan = clampSpan(item.colSpan);
    if (item.rowSpan !== undefined) series.grid.rowSpan = clampSpan(item.rowSpan);
    // Always assign order from position so the array order matches the saved order.
    series.order = position + 1;
  });
  data.series.sort((a, b) => (a.order || 999) - (b.order || 999));

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Layout saved", series: data.series });
    });
  });
}

function handlePhotosReorder(body, response) {
  const data = readPhotosJSON();
  const order = Array.isArray(body.order) ? body.order : null;
  if (!order) return sendError(response, "Missing order array");

  const indexById = new Map();
  data.series.forEach((s, i) => indexById.set(s.id, i));

  order.forEach((seriesId, position) => {
    const idx = indexById.get(seriesId);
    if (idx !== undefined) {
      data.series[idx].order = position + 1;
    }
  });
  data.series.sort((a, b) => (a.order || 999) - (b.order || 999));

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Series order updated", series: data.series });
    });
  });
}

function handlePhotosAddImage(body, response) {
  const data = readPhotosJSON();
  const seriesId = sanitizePhotosId(body.seriesId);
  if (!seriesId) return sendError(response, "Missing seriesId");
  const idx = findSeriesIndex(data, seriesId);
  if (idx === -1) return sendError(response, "Series not found");

  const fallbackId = `${seriesId}_${(data.series[idx].images || []).length + 1}`;
  const normalized = normalizePhotosImage(body.image || body, fallbackId);
  if (!normalized) return sendError(response, "Missing image url");

  if (!Array.isArray(data.series[idx].images)) data.series[idx].images = [];
  // Ensure unique image id within series
  if (data.series[idx].images.some(img => img.id === normalized.id)) {
    normalized.id = `${normalized.id}_${Date.now()}`;
  }
  data.series[idx].images.push(normalized);

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Image added", image: normalized });
    });
  });
}

function handlePhotosUpdateImage(body, response) {
  const data = readPhotosJSON();
  const seriesId = sanitizePhotosId(body.seriesId);
  const imageId = sanitizePhotosId(body.imageId || (body.image && body.image.id));
  if (!seriesId || !imageId) return sendError(response, "Missing seriesId or imageId");
  const sIdx = findSeriesIndex(data, seriesId);
  if (sIdx === -1) return sendError(response, "Series not found");

  const images = data.series[sIdx].images || [];
  const iIdx = images.findIndex(img => img.id === imageId);
  if (iIdx === -1) return sendError(response, "Image not found");

  const merged = { ...images[iIdx], ...(body.image || body), id: imageId };
  const normalized = normalizePhotosImage(merged, imageId);
  if (!normalized) return sendError(response, "Invalid image payload");

  images[iIdx] = normalized;
  data.series[sIdx].images = images;

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Image updated", image: normalized });
    });
  });
}

function handlePhotosDeleteImage(body, response) {
  const data = readPhotosJSON();
  const seriesId = sanitizePhotosId(body.seriesId);
  const imageId = sanitizePhotosId(body.imageId);
  if (!seriesId || !imageId) return sendError(response, "Missing seriesId or imageId");
  const sIdx = findSeriesIndex(data, seriesId);
  if (sIdx === -1) return sendError(response, "Series not found");

  const images = data.series[sIdx].images || [];
  const before = images.length;
  data.series[sIdx].images = images.filter(img => img.id !== imageId);
  if (data.series[sIdx].images.length === before) return sendError(response, "Image not found");

  writePhotosJSON(data, err => {
    if (err) return sendError(response, "Error writing photos.json", 500);
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: "Image deleted" });
    });
  });
}

function executeScript(callback) {
  const scriptPath = '/shellfiles/jsonupdatebmb.sh';
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    return callback(new Error(`Script not found: ${scriptPath}`));
  }
  exec(`sh ${scriptPath}`, { timeout: 15000 }, (error, stdout, stderr) => {
    if (error) { console.error(`Script error: ${error}`); return callback(error); }
    console.log(`Script output: ${stdout}`);
    if (stderr) console.error(`Script stderr: ${stderr}`);
    callback(null);
  });
}

function runScriptIgnoreError(cb) {
  executeScript(err => {
    if (err) console.error("Script failed (non-fatal):", err.message);
    cb();
  });
}

// ─── Business logic ───────────────────────────────────────────────────────────
function updateLatestPost(name, date, excerpt, thumbnail, link, formId) {
  const updateFields = (target, updates) => {
    for (const [k, v] of Object.entries(updates)) {
      if (v !== null && v !== undefined && v !== "") target[k] = v;
    }
  };

  const handlers = {
    latest: () => updateFields(jsdata.mainPost, { title: name, date, excerpt, thumbnail, link }),
    featured1: () => updateFields(jsdata.featured[0], { title: name, date, excerpt, thumbnail, link }),
    featured2: () => updateFields(jsdata.featured[1], { title: name, date, excerpt, thumbnail, link }),
    featured3: () => updateFields(jsdata.featured[2], { title: name, date, excerpt, thumbnail, link }),
    featured4: () => updateFields(jsdata.featured[3], { title: name, date, excerpt, thumbnail, link }),
    featuredProjects: () => {}, // handled separately
    featuredMinis: () => {}     // handled separately
  };

  if (handlers[formId]) {
    handlers[formId]();
    console.log(`Updated ${formId}`);
  } else {
    throw new Error(`Invalid formId: ${formId}`);
  }
}

function addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory) {
  if (!blogData[category]) throw new Error(`Invalid blog category: ${category}`);

  const postUID = uid || `${category}_${Date.now()}`;
  const postData = {
    uid: postUID,
    title: title || "Untitled Post",
    date: date || new Date().toISOString().split('T')[0],
    excerpt: excerpt || "",
    thumbnail: thumbnail || "",
    link: link || "",
    subcategory: subcategory || ""
  };
  if (secondaryCategory) postData.secondaryCategory = secondaryCategory;
  if (secondarySubcategory) postData.secondarySubcategory = secondarySubcategory;

  blogData[category].posts.push(postData);
  console.log(`Added new post to ${category}:`, postUID);
}

function updateBlogPost(category, uid, updates) {
  if (!blogData[category]) throw new Error(`Invalid category: ${category}`);
  const idx = blogData[category].posts.findIndex(p => p.uid === uid);
  if (idx === -1) throw new Error(`Post not found: ${uid}`);

  const allowed = ['title', 'date', 'excerpt', 'thumbnail', 'link', 'subcategory', 'secondaryCategory', 'secondarySubcategory'];
  allowed.forEach(key => {
    if (updates[key] !== undefined && updates[key] !== null) {
      blogData[category].posts[idx][key] = updates[key];
    }
  });
  console.log(`Updated post ${uid} in ${category}`);
}

function deleteBlogPost(category, uid) {
  if (!blogData[category]) throw new Error(`Invalid category: ${category}`);
  const before = blogData[category].posts.length;
  blogData[category].posts = blogData[category].posts.filter(p => p.uid !== uid);
  if (blogData[category].posts.length === before) throw new Error(`Post not found: ${uid}`);
  console.log(`Deleted post ${uid} from ${category}`);
}

function writeAllBlogFiles(keys, callback) {
  if (!keys || keys.length === 0) return callback(null);
  let idx = 0;
  let firstErr = null;
  const next = () => {
    if (idx >= keys.length) return callback(firstErr);
    writeBlogJSONFile(keys[idx++], err => {
      if (err && !firstErr) firstErr = err;
      next();
    });
  };
  next();
}

function clearSecondaryRefsToCategory(deletedKey) {
  const affected = new Set();
  Object.keys(blogData).forEach(cat => {
    if (cat === deletedKey) return;
    const posts = (blogData[cat] && blogData[cat].posts) || [];
    posts.forEach(post => {
      if (post.secondaryCategory === deletedKey) {
        delete post.secondaryCategory;
        delete post.secondarySubcategory;
        affected.add(cat);
      }
    });
  });
  return Array.from(affected);
}

function renameSubcategoryAcrossPosts(categoryKey, from, to) {
  const affected = new Set();
  Object.keys(blogData).forEach(cat => {
    const posts = (blogData[cat] && blogData[cat].posts) || [];
    posts.forEach(post => {
      if (cat === categoryKey && post.subcategory === from) {
        post.subcategory = to;
        affected.add(cat);
      }
      if (post.secondaryCategory === categoryKey && post.secondarySubcategory === from) {
        post.secondarySubcategory = to;
        affected.add(cat);
      }
    });
  });
  return Array.from(affected);
}

function sanitizeCategoryKey(raw) {
  return String(raw || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

// ─── Category endpoint handlers ───────────────────────────────────────────────
function handleAddCategory(body, response) {
  const name = String(body.name || '').trim();
  const key = sanitizeCategoryKey(body.categoryKey);
  const icon = String(body.icon || '').trim();
  const subs = Array.isArray(body.subcategories)
    ? body.subcategories.filter(s => typeof s === 'string' && s.trim()).map(s => s.trim())
    : [];

  if (!key || !name) return sendError(response, "Missing categoryKey or name");
  if (CATEGORY_CONFIG[key]) return sendError(response, "Category already exists");

  CATEGORY_CONFIG[key] = { name, icon, subcategories: subs };
  blogData[key] = { subcategories: subs, posts: [] };
  blogUrls[key] = `https://beyondmebtw.com/blog/${key}.json`;

  const filePath = nodePath.join(BLOG_BASE_PATH, `${key}.json`);
  try {
    const dir = nodePath.dirname(filePath);
    const writePath = fs.existsSync(dir) ? filePath : nodePath.join(__dirname, "..", "blog", `${key}.json`);
    fs.writeFileSync(writePath, JSON.stringify({ subcategories: subs, posts: [] }, null, 2), "utf8");
  } catch (e) {
    console.error("Could not create category file:", e.message);
  }

  saveCategoriesConfig();
  runScriptIgnoreError(() => {
    sendJSON(response, { success: true, categoryKey: key, message: `Category '${name}' created` });
  });
}

function handleUpdateCategory(body, response) {
  const key = body.categoryKey;
  if (!key) return sendError(response, "Missing categoryKey");
  if (!CATEGORY_CONFIG[key]) return sendError(response, "Category not found");

  if (body.name !== undefined) CATEGORY_CONFIG[key].name = String(body.name).trim();
  if (body.icon !== undefined) CATEGORY_CONFIG[key].icon = String(body.icon).trim();

  saveCategoriesConfig();
  sendJSON(response, { success: true, message: "Category updated" });
}

function handleDeleteCategory(body, response) {
  const key = body.categoryKey;
  if (!key) return sendError(response, "Missing categoryKey");
  if (!CATEGORY_CONFIG[key]) return sendError(response, "Category not found");

  const affectedCats = clearSecondaryRefsToCategory(key);

  writeAllBlogFiles(affectedCats, writeErr => {
    if (writeErr) return sendError(response, "Error updating referencing posts", 500);

    const filePath = nodePath.join(BLOG_BASE_PATH, `${key}.json`);
    const localPath = nodePath.join(__dirname, "..", "blog", `${key}.json`);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.error("Could not delete category file:", e.message); }
    try { if (fs.existsSync(localPath)) fs.unlinkSync(localPath); } catch (e) { /* non-fatal */ }

    delete CATEGORY_CONFIG[key];
    delete blogData[key];
    delete blogUrls[key];
    saveCategoriesConfig();

    if (jsdata.categories && jsdata.categories[key]) {
      delete jsdata.categories[key];
      writeJSONFile(() => {
        runScriptIgnoreError(() => {
          sendJSON(response, { success: true, message: `Category '${key}' deleted` });
        });
      });
    } else {
      runScriptIgnoreError(() => {
        sendJSON(response, { success: true, message: `Category '${key}' deleted` });
      });
    }
  });
}

function handleAddSubcategory(body, response) {
  const key = body.categoryKey;
  const name = String(body.subcategoryName || '').trim();
  if (!key || !name) return sendError(response, "Missing categoryKey or subcategoryName");
  if (!CATEGORY_CONFIG[key]) return sendError(response, "Category not found");
  if (CATEGORY_CONFIG[key].subcategories.includes(name)) {
    return sendError(response, "Subcategory already exists");
  }

  CATEGORY_CONFIG[key].subcategories.push(name);
  if (!blogData[key]) blogData[key] = { subcategories: [], posts: [] };
  if (!Array.isArray(blogData[key].subcategories)) blogData[key].subcategories = [];
  if (!blogData[key].subcategories.includes(name)) blogData[key].subcategories.push(name);

  writeBlogJSONFile(key, err => {
    if (err) return sendError(response, "Error writing blog file", 500);
    saveCategoriesConfig();
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: `Subcategory '${name}' added to '${key}'` });
    });
  });
}

function handleRenameSubcategory(body, response) {
  const key = body.categoryKey;
  const from = String(body.from || '').trim();
  const to = String(body.to || '').trim();
  if (!key || !from || !to) return sendError(response, "Missing categoryKey, from, or to");
  if (!CATEGORY_CONFIG[key]) return sendError(response, "Category not found");

  const subs = CATEGORY_CONFIG[key].subcategories;
  const idx = subs.indexOf(from);
  if (idx === -1) return sendError(response, "Subcategory not found");
  if (from !== to && subs.includes(to)) return sendError(response, "Target subcategory already exists");

  subs[idx] = to;
  if (blogData[key] && Array.isArray(blogData[key].subcategories)) {
    const i2 = blogData[key].subcategories.indexOf(from);
    if (i2 !== -1) blogData[key].subcategories[i2] = to;
  }

  const affected = new Set(renameSubcategoryAcrossPosts(key, from, to));
  affected.add(key);

  writeAllBlogFiles(Array.from(affected), err => {
    if (err) return sendError(response, "Error writing blog file", 500);
    saveCategoriesConfig();
    runScriptIgnoreError(() => {
      sendJSON(response, { success: true, message: `Renamed '${from}' to '${to}'` });
    });
  });
}

function handleRemoveSubcategory(body, response) {
  const key = body.categoryKey;
  const name = String(body.subcategoryName || '').trim();
  if (!key || !name) return sendError(response, "Missing categoryKey or subcategoryName");
  if (!CATEGORY_CONFIG[key]) return sendError(response, "Category not found");

  const subs = CATEGORY_CONFIG[key].subcategories;
  const idx = subs.indexOf(name);
  if (idx === -1) return sendError(response, "Subcategory not found");
  subs.splice(idx, 1);

  if (blogData[key] && Array.isArray(blogData[key].subcategories)) {
    const i2 = blogData[key].subcategories.indexOf(name);
    if (i2 !== -1) blogData[key].subcategories.splice(i2, 1);
    writeBlogJSONFile(key, err => {
      if (err) return sendError(response, "Error writing blog file", 500);
      saveCategoriesConfig();
      runScriptIgnoreError(() => {
        sendJSON(response, { success: true, message: `Subcategory '${name}' removed from '${key}'` });
      });
    });
  } else {
    saveCategoriesConfig();
    sendJSON(response, { success: true, message: `Subcategory '${name}' removed from '${key}'` });
  }
}

function updateLatestJSONCategories(category, uid, title, thumbnail, subcategory) {
  const categoryKey = category.toLowerCase();
  const subcategoryMap = {
    '2025 season': '2025 season', 'general': 'general',
    'movies': 'movies', 'tv shows': 'tv', 'tv': 'tv'
  };
  const normalizedSubcategory = subcategory ? (subcategoryMap[subcategory.toLowerCase()] || subcategory.toLowerCase()) : null;

  if (!jsdata.categories) jsdata.categories = {};
  if (!jsdata.categories[categoryKey]) jsdata.categories[categoryKey] = { subcategories: {} };

  const latestPostData = { uid, title, thumbnail };

  const hasSubcategories = CATEGORY_CONFIG[categoryKey] && CATEGORY_CONFIG[categoryKey].subcategories.length > 0;

  if (normalizedSubcategory && hasSubcategories) {
    if (!jsdata.categories[categoryKey].subcategories) jsdata.categories[categoryKey].subcategories = {};
    if (!jsdata.categories[categoryKey].subcategories[normalizedSubcategory]) {
      jsdata.categories[categoryKey].subcategories[normalizedSubcategory] = { mainPost: {} };
    }
    jsdata.categories[categoryKey].subcategories[normalizedSubcategory].mainPost = latestPostData;
  } else {
    jsdata.categories[categoryKey].mainPost = latestPostData;
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  try {

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (pathname === "/loginauth" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        if (!body.key) return sendError(response, "Missing key");
        if (body.key !== thepasskey) return sendError(response, "Invalid key", 403);
        sendJSON(response, { success: true, message: "Authentication successful" });
      });
    }

    // ── Category manifest endpoint ────────────────────────────────────────────
    else if (pathname === "/category") {
      // Reload from disk on every request so external edits to categories.json
      // (manual edits, git pulls) aren't clobbered by stale in-memory state.
      loadCategoriesConfig();

      if (request.method === "GET") {
        const data = {};
        Object.keys(CATEGORY_CONFIG).forEach(k => {
          data[k] = {
            name: CATEGORY_CONFIG[k].name,
            icon: CATEGORY_CONFIG[k].icon || '',
            subcategories: CATEGORY_CONFIG[k].subcategories || []
          };
        });
        return sendJSON(response, data);
      }

      if (request.method === "POST") {
        return getJSONBody(request, (err, body) => {
          if (err) return sendError(response, "Bad JSON");
          if (!validateKey(body.key, response)) return;

          switch (body.action) {
            case 'addCategory':      return handleAddCategory(body, response);
            case 'updateCategory':   return handleUpdateCategory(body, response);
            case 'deleteCategory':   return handleDeleteCategory(body, response);
            case 'addSubcategory':   return handleAddSubcategory(body, response);
            case 'renameSubcategory':return handleRenameSubcategory(body, response);
            case 'removeSubcategory':return handleRemoveSubcategory(body, response);
            default: return sendError(response, `Unknown action: ${body.action}`);
          }
        });
      }

      response.statusCode = 405;
      return response.end("Method Not Allowed");
    }

    // ── Latest data POST ──────────────────────────────────────────────────────
    else if (pathname === "/latestdata" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { name, date, excerpt, thumbnail, link, formid, projectIds, minis, key } = body;
        if (!validateKey(key, response)) return;
        if (!formid) return sendError(response, "Missing formid");

        loadJSON(() => {
          try {
            if (formid === 'featuredProjects') {
              if (!Array.isArray(projectIds) || projectIds.length !== 4) {
                return sendError(response, "projectIds must be an array of 4 IDs");
              }
              jsdata.featuredProjects = projectIds.map(id => parseInt(id, 10));
            } else if (formid === 'featuredMinis') {
              if (!Array.isArray(minis) || minis.length !== 3) {
                return sendError(response, "minis must be an array of 3 entries");
              }
              jsdata.featuredMinis = minis.map(m => {
                if (!m || typeof m !== 'object') return {};
                return {
                  id: String(m.id || '').trim(),
                  title: String(m.title || '').trim(),
                  date: String(m.date || '').trim(),
                  featuredExcerpt: String(m.featuredExcerpt || '').trim()
                };
              });
            } else {
              updateLatestPost(name, date, excerpt, thumbnail, link, formid);
            }

            writeJSONFile(writeErr => {
              if (writeErr) return sendError(response, "Error writing data", 500);
              runScriptIgnoreError(() => {
                sendJSON(response, { success: true, message: `${formid} updated` });
              });
            });
          } catch (e) {
            sendError(response, `Error: ${e.message}`);
          }
        });
      });
    }

    // ── Blog data POST (create or addSubcategory) ────────────────────────────
    else if (pathname === "/blogdata" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { action, category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory, key } = body;
        if (!validateKey(key, response)) return;

        // ── Project actions (no category needed) ──────────────────────────────
        if (action === "projectCreate") {
          if (!body.title) return sendError(response, "Missing title");
          const projects = readProjectsJSON();
          const maxId = projects.reduce((max, p) => Math.max(max, p.id || 0), 0);
          const newProject = { id: maxId + 1 };
          const fields = ['title','category','shortDescription','fullDescription','logo','link','githubLink','tags','images','coverImage'];
          fields.forEach(f => { if (body[f] !== undefined) newProject[f] = body[f]; });
          if (typeof newProject.tags === 'string') newProject.tags = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
          if (body.images !== undefined) newProject.images = normalizeProjectImages(body.images);
          if (typeof newProject.coverImage === 'string') newProject.coverImage = newProject.coverImage.trim();
          projects.push(newProject);
          writeProjectsJSONSafe(projects, err2 => {
            if (err2) return sendError(response, "Error writing projects file", 500);
            runScriptIgnoreError(() => {
              sendJSON(response, { success: true, message: "Project created", project: newProject });
            });
          });
          return;
        }

        if (action === "projectUpdate") {
          const projId = parseInt(body.id, 10);
          if (!projId) return sendError(response, "Missing id");
          const projects = readProjectsJSON();
          const idx = projects.findIndex(p => p.id === projId);
          if (idx === -1) return sendError(response, "Project not found");
          const fields = ['title','category','shortDescription','fullDescription','logo','link','githubLink','tags','images','coverImage'];
          fields.forEach(f => { if (body[f] !== undefined) projects[idx][f] = body[f]; });
          if (typeof projects[idx].tags === 'string') projects[idx].tags = projects[idx].tags.split(',').map(t => t.trim()).filter(Boolean);
          if (body.images !== undefined) projects[idx].images = normalizeProjectImages(body.images);
          if (typeof projects[idx].coverImage === 'string') projects[idx].coverImage = projects[idx].coverImage.trim();
          writeProjectsJSONSafe(projects, err2 => {
            if (err2) return sendError(response, "Error writing projects file", 500);
            runScriptIgnoreError(() => {
              sendJSON(response, { success: true, message: "Project updated", project: projects[idx] });
            });
          });
          return;
        }

        if (action === "projectDelete") {
          const projId = parseInt(body.id, 10);
          if (!projId) return sendError(response, "Missing id");
          const projects = readProjectsJSON();
          const before = projects.length;
          const filtered = projects.filter(p => p.id !== projId);
          if (filtered.length === before) return sendError(response, "Project not found");
          writeProjectsJSONSafe(filtered, err2 => {
            if (err2) return sendError(response, "Error writing projects file", 500);
            runScriptIgnoreError(() => {
              sendJSON(response, { success: true, message: "Project deleted" });
            });
          });
          return;
        }

        if (!category) return sendError(response, "Missing category");
        if (!title || !date || !excerpt || !thumbnail || !link) return sendError(response, "Missing required fields");

        if (!blogData[category]) blogData[category] = { subcategories: [], posts: [] };

        loadBlogJSON(category, () => {
          loadJSON(() => {
            try {
              addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory);
              updateLatestJSONCategories(category, blogData[category].posts[blogData[category].posts.length - 1].uid, title, thumbnail, subcategory);

              writeBlogJSONFile(category, blogErr => {
                if (blogErr) return sendError(response, "Error writing blog file", 500);
                writeJSONFile(latestErr => {
                  if (latestErr) return sendError(response, "Error writing latest.json", 500);
                  runScriptIgnoreError(() => {
                    sendJSON(response, { success: true, message: "Blog post created" });
                  });
                });
              });
            } catch (e) {
              sendError(response, `Error: ${e.message}`);
            }
          });
        });
      });
    }

    // ── Blog data PUT (update) ────────────────────────────────────────────────
    else if (pathname === "/blogdata" && request.method === "PUT") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { category, uid, key, ...updates } = body;
        if (!validateKey(key, response)) return;
        if (!category || !uid) return sendError(response, "Missing category or uid");

        if (!blogData[category]) return sendError(response, "Category not loaded. Try again.");

        try {
          updateBlogPost(category, uid, updates);
          writeBlogJSONFile(category, err2 => {
            if (err2) return sendError(response, "Error writing blog file", 500);
            runScriptIgnoreError(() => {
              sendJSON(response, { success: true, message: "Blog post updated" });
            });
          });
        } catch (e) {
          sendError(response, `Error: ${e.message}`);
        }
      });
    }

    // ── Blog data DELETE ──────────────────────────────────────────────────────
    else if (pathname === "/blogdata" && request.method === "DELETE") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { category, uid, key } = body;
        if (!validateKey(key, response)) return;
        if (!category || !uid) return sendError(response, "Missing category or uid");

        if (!blogData[category]) return sendError(response, "Category not loaded. Try again.");

        try {
          deleteBlogPost(category, uid);
          writeBlogJSONFile(category, err2 => {
            if (err2) return sendError(response, "Error writing blog file", 500);
            runScriptIgnoreError(() => {
              sendJSON(response, { success: true, message: "Blog post deleted" });
            });
          });
        } catch (e) {
          sendError(response, `Error: ${e.message}`);
        }
      });
    }

    // ── Blog posts GET (all posts) ────────────────────────────────────────────
    else if (pathname === "/blogposts" && request.method === "GET") {
      return sendJSON(response, blogData);
    }

    // ── Projects GET ──────────────────────────────────────────────────────────
    else if (pathname === "/projectsdata" && request.method === "GET") {
      const projects = readProjectsJSON();
      return sendJSON(response, projects);
    }

    // ── Minis metadata proxy GET (avoids CORS in the manage UI) ────────────────
    else if (pathname === "/minismetadata" && request.method === "GET") {
      const minisReq = https.get("https://minis.beyondmebtw.com/content/metadata.json", res => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => {
          const parsed = safeJSONParse(data, null);
          if (parsed === null) return sendError(response, "Failed to parse minis metadata", 502);
          sendJSON(response, parsed);
        });
      });
      minisReq.on("error", e => sendError(response, `Minis fetch error: ${e.message}`, 502));
      minisReq.setTimeout(10000, () => { minisReq.destroy(); sendError(response, "Minis fetch timeout", 504); });
      return;
    }

    // ── Projects POST (create) ────────────────────────────────────────────────
    else if (pathname === "/projectsdata" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { key, ...projectData } = body;
        if (!validateKey(key, response)) return;
        if (!projectData.title) return sendError(response, "Missing title");

        const projects = readProjectsJSON();
        const maxId = projects.reduce((max, p) => Math.max(max, p.id || 0), 0);
        const newProject = { id: maxId + 1, ...projectData };
        if (typeof newProject.tags === 'string') newProject.tags = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
        if (projectData.images !== undefined) newProject.images = normalizeProjectImages(projectData.images);

        projects.push(newProject);
        writeProjectsJSONSafe(projects, err2 => {
          if (err2) return sendError(response, "Error writing projects file", 500);
          runScriptIgnoreError(() => {
            sendJSON(response, { success: true, message: "Project created", project: newProject });
          });
        });
      });
    }

    // ── Projects PUT (update) ─────────────────────────────────────────────────
    else if (pathname === "/projectsdata" && request.method === "PUT") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { key, id, ...updates } = body;
        if (!validateKey(key, response)) return;
        if (!id) return sendError(response, "Missing id");

        const projects = readProjectsJSON();
        const idx = projects.findIndex(p => p.id === parseInt(id, 10));
        if (idx === -1) return sendError(response, "Project not found");

        if (typeof updates.tags === 'string') updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
        if (updates.images !== undefined) updates.images = normalizeProjectImages(updates.images);

        projects[idx] = { ...projects[idx], ...updates };
        writeProjectsJSONSafe(projects, err2 => {
          if (err2) return sendError(response, "Error writing projects file", 500);
          runScriptIgnoreError(() => {
            sendJSON(response, { success: true, message: "Project updated", project: projects[idx] });
          });
        });
      });
    }

    // ── Projects DELETE ───────────────────────────────────────────────────────
    else if (pathname === "/projectsdata" && request.method === "DELETE") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        const { key, id } = body;
        if (!validateKey(key, response)) return;
        if (!id) return sendError(response, "Missing id");

        const projects = readProjectsJSON();
        const before = projects.length;
        const filtered = projects.filter(p => p.id !== parseInt(id, 10));
        if (filtered.length === before) return sendError(response, "Project not found");

        writeProjectsJSONSafe(filtered, err2 => {
          if (err2) return sendError(response, "Error writing projects file", 500);
          runScriptIgnoreError(() => {
            sendJSON(response, { success: true, message: "Project deleted" });
          });
        });
      });
    }

    // ── Photos data GET ───────────────────────────────────────────────────────
    else if (pathname === "/photosdata" && request.method === "GET") {
      return sendJSON(response, readPhotosJSON());
    }

    // ── Photos data POST (action-dispatched) ─────────────────────────────────
    else if (pathname === "/photosdata" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        if (!validateKey(body.key, response)) return;

        switch (body.action) {
          case 'createSeries': return handlePhotosCreateSeries(body, response);
          case 'updateSeries': return handlePhotosUpdateSeries(body, response);
          case 'deleteSeries': return handlePhotosDeleteSeries(body, response);
          case 'reorderSeries': return handlePhotosReorder(body, response);
          case 'updateLayout': return handlePhotosUpdateLayout(body, response);
          case 'addImage':     return handlePhotosAddImage(body, response);
          case 'updateImage':  return handlePhotosUpdateImage(body, response);
          case 'deleteImage':  return handlePhotosDeleteImage(body, response);
          default: return sendError(response, `Unknown action: ${body.action}`);
        }
      });
    }

    // ── Deploy registry POST (action-dispatched; key-gated even for list since
    //    the registry can reveal private repo names) ───────────────────────────
    else if (pathname === "/deployregistry" && request.method === "POST") {
      return getJSONBody(request, (err, body) => {
        if (err) return sendError(response, "Bad JSON");
        if (!validateKey(body.key, response)) return;

        switch (body.action) {
          case 'list':   return sendJSON(response, { registry: readDeployRegistry() });
          case 'set':    return handleDeployRegistrySet(body, response);
          case 'delete': return handleDeployRegistryDelete(body, response);
          default: return sendError(response, `Unknown action: ${body.action}`);
        }
      });
    }

    else {
      response.statusCode = 404;
      response.end("Not Found");
    }

  } catch (error) {
    console.error("Unhandled error:", error);
    response.statusCode = 500;
    response.end("Internal Server Error");
  }
});

server.on('error', error => { console.error('Server error:', error); });

process.on('SIGTERM', () => {
  server.close(() => { console.log('Server closed'); process.exit(0); });
});

process.on('SIGINT', () => {
  server.close(() => { console.log('Server closed'); process.exit(0); });
});

const PORT = process.env.PORT || 7000;

function loadAllBlogData(callback) {
  const categories = Object.keys(CATEGORY_CONFIG);
  let completed = 0;

  if (categories.length === 0) return callback && callback();

  categories.forEach(category => {
    loadBlogJSON(category, () => {
      completed++;
      if (completed === categories.length) {
        console.log('All blog data loaded');
        if (callback) callback();
      }
    });
  });
}

// Startup sequence
loadCategoriesConfig();
rebuildBlogUrls();
loadExistingData();

loadAllBlogData(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
