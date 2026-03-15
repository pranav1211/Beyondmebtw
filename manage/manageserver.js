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
// Default config; loaded from categories-config.json at startup if it exists
let CATEGORY_CONFIG = {
  f1arti: { name: 'F1 Articles', subcategories: ['2025 Season', 'General'] },
  movietv: { name: 'Movie/TV', subcategories: ['Movies', 'TV Shows'] },
  experience: { name: 'Experience', subcategories: [] },
  techart: { name: 'Tech Articles', subcategories: [] }
};

const CATEGORIES_CONFIG_PATH = nodePath.join(__dirname, "categories-config.json");
const PROJECTS_JSON_PATH = "/bmbsifi/Beyondmebtw/projects/project-data.json";
const BLOG_BASE_PATH = "/bmbsifi/Beyondmebtw/blog";

function loadCategoriesConfig() {
  try {
    if (fs.existsSync(CATEGORIES_CONFIG_PATH)) {
      CATEGORY_CONFIG = JSON.parse(fs.readFileSync(CATEGORIES_CONFIG_PATH, "utf8"));
      console.log("Categories config loaded from file");
    }
  } catch (e) {
    console.error("Error loading categories config:", e);
  }
}

function saveCategoriesConfig() {
  try {
    fs.writeFileSync(CATEGORIES_CONFIG_PATH, JSON.stringify(CATEGORY_CONFIG, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving categories config:", e);
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
function getJSONBody(request, callback) {
  let body = "";
  request.on("data", chunk => { body += chunk.toString(); });
  request.on("end", () => {
    try { callback(null, JSON.parse(body)); }
    catch (e) { callback(e, null); }
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
      const existing = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
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
      try {
        const parsed = JSON.parse(data);
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
      } catch (e) {
        console.error("Error parsing remote latest.json:", e);
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
      try {
        const parsed = JSON.parse(data);
        blogData[category] = {
          subcategories: parsed.subcategories || [],
          posts: parsed.posts || []
        };
        console.log(`Blog data loaded for ${category}`);
      } catch (e) {
        console.error(`Parse error for ${category}:`, e);
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
      return JSON.parse(fs.readFileSync(PROJECTS_JSON_PATH, "utf8"));
    }
    // Fallback to local dev path
    const localPath = nodePath.join(__dirname, "../projects/project-data.json");
    if (fs.existsSync(localPath)) {
      return JSON.parse(fs.readFileSync(localPath, "utf8"));
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

    // ── Categories GET/POST ───────────────────────────────────────────────────
    else if (pathname === "/categories") {
      if (request.method === "GET") {
        const data = {};
        Object.keys(CATEGORY_CONFIG).forEach(k => {
          data[k] = { name: CATEGORY_CONFIG[k].name, subcategories: CATEGORY_CONFIG[k].subcategories };
        });
        return sendJSON(response, data);
      }

      if (request.method === "POST") {
        return getJSONBody(request, (err, body) => {
          if (err) return sendError(response, "Bad JSON");
          if (!validateKey(body.key, response)) return;

          const { action, categoryKey, categoryName, subcategoryName } = body;

          if (action === "addCategory") {
            if (!categoryKey || !categoryName) return sendError(response, "Missing categoryKey or categoryName");
            const key = categoryKey.toLowerCase().replace(/\s+/g, '');
            if (CATEGORY_CONFIG[key]) return sendError(response, "Category already exists");

            CATEGORY_CONFIG[key] = { name: categoryName, subcategories: [] };
            blogData[key] = { subcategories: [], posts: [] };
            blogUrls[key] = `https://beyondmebtw.com/blog/${key}.json`;

            // Create new empty category JSON file
            const newFilePath = nodePath.join(BLOG_BASE_PATH, `${key}.json`);
            try {
              fs.writeFileSync(newFilePath, JSON.stringify({ subcategories: [], posts: [] }, null, 2), "utf8");
            } catch (e) {
              console.error("Could not create category file:", e.message);
            }

            saveCategoriesConfig();
            return sendJSON(response, { success: true, categoryKey: key, message: `Category '${categoryName}' created` });
          }

          if (action === "addSubcategory") {
            if (!categoryKey || !subcategoryName) return sendError(response, "Missing categoryKey or subcategoryName");
            if (!CATEGORY_CONFIG[categoryKey]) return sendError(response, "Category not found");
            if (CATEGORY_CONFIG[categoryKey].subcategories.includes(subcategoryName)) {
              return sendError(response, "Subcategory already exists");
            }

            CATEGORY_CONFIG[categoryKey].subcategories.push(subcategoryName);
            if (blogData[categoryKey] && !blogData[categoryKey].subcategories.includes(subcategoryName)) {
              blogData[categoryKey].subcategories.push(subcategoryName);
            }
            saveCategoriesConfig();
            return sendJSON(response, { success: true, message: `Subcategory '${subcategoryName}' added to '${categoryKey}'` });
          }

          return sendError(response, "Unknown action. Use addCategory or addSubcategory");
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
        const { action, category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory, key, subcategoryName } = body;
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
          if (typeof newProject.images === 'string') newProject.images = newProject.images.split(',').map(u => u.trim()).filter(Boolean);
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
          if (typeof projects[idx].images === 'string') projects[idx].images = projects[idx].images.split(',').map(u => u.trim()).filter(Boolean);
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

        // Handle addCategory action — creates a new blog JSON file
        if (action === "addCategory") {
          const { categoryName } = body;
          if (!categoryName) return sendError(response, "Missing categoryName");
          const key = category.toLowerCase().replace(/\s+/g, '');
          if (blogData[key]) return sendError(response, "Category already exists");
          blogData[key] = { subcategories: [], posts: [] };
          const newFilePath = nodePath.join(BLOG_BASE_PATH, `${key}.json`);
          try {
            fs.writeFileSync(newFilePath, JSON.stringify({ subcategories: [], posts: [] }, null, 2), "utf8");
          } catch (e) {
            console.error("Could not create category file:", e.message);
          }
          runScriptIgnoreError(() => {
            sendJSON(response, { success: true, categoryKey: key, message: `Category '${categoryName}' created` });
          });
          return;
        }

        // Handle addSubcategory action — writes directly to the blog JSON file
        if (action === "addSubcategory") {
          if (!subcategoryName) return sendError(response, "Missing subcategoryName");
          if (!blogData[category]) blogData[category] = { subcategories: [], posts: [] };
          loadBlogJSON(category, () => {
            if (!blogData[category].subcategories) blogData[category].subcategories = [];
            if (blogData[category].subcategories.includes(subcategoryName)) {
              return sendError(response, "Subcategory already exists");
            }
            blogData[category].subcategories.push(subcategoryName);
            writeBlogJSONFile(category, err2 => {
              if (err2) return sendError(response, "Error writing blog file", 500);
              runScriptIgnoreError(() => {
                sendJSON(response, { success: true, message: `Subcategory '${subcategoryName}' added to '${category}'` });
              });
            });
          });
          return;
        }

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
        if (typeof newProject.images === 'string') newProject.images = newProject.images.split(',').map(u => u.trim()).filter(Boolean);

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
        if (typeof updates.images === 'string') updates.images = updates.images.split(',').map(u => u.trim()).filter(Boolean);

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
