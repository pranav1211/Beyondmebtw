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
    featuredProjects: () => {} // handled separately
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
        const { name, date, excerpt, thumbnail, link, formid, projectIds, key } = body;
        if (!validateKey(key, response)) return;
        if (!formid) return sendError(response, "Missing formid");

        loadJSON(() => {
          try {
            if (formid === 'featuredProjects') {
              if (!Array.isArray(projectIds) || projectIds.length !== 4) {
                return sendError(response, "projectIds must be an array of 4 IDs");
              }
              jsdata.featuredProjects = projectIds.map(id => parseInt(id, 10));
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
          const fields = ['title','category','shortDescription','fullDescription','logo','link','githubLink','tags','images'];
          fields.forEach(f => { if (body[f] !== undefined) newProject[f] = body[f]; });
          if (typeof newProject.tags === 'string') newProject.tags = newProject.tags.split(',').map(t => t.trim()).filter(Boolean);
          if (body.images !== undefined) newProject.images = normalizeProjectImages(body.images);
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
          const fields = ['title','category','shortDescription','fullDescription','logo','link','githubLink','tags','images'];
          fields.forEach(f => { if (body[f] !== undefined) projects[idx][f] = body[f]; });
          if (typeof projects[idx].tags === 'string') projects[idx].tags = projects[idx].tags.split(',').map(t => t.trim()).filter(Boolean);
          if (body.images !== undefined) projects[idx].images = normalizeProjectImages(body.images);
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
