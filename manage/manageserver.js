/*  ────────────────────────────────────────────────────────────────────
    manageserver.js  –  updated for POST + JSON body support
    ──────────────────────────────────────────────────────────────────── */

const http   = require("http");
const https  = require("https");
const fs     = require("fs");
const { exec } = require("child_process");
const path   = require("path");

/* ── read key from env or /etc/environment ────────────────────────── */
let thepasskey;
try {
  thepasskey =
    process.env.managekey ||
    fs.readFileSync("/etc/environment", "utf8")
      .split("\n")
      .find(line => line.startsWith("managekey="))
      ?.split("=")[1]
      ?.trim();

  if (!thepasskey) {
    console.error("Warning: managekey not found; using fallback key");
    thepasskey = "default-secure-key";
  }
} catch (err) {
  console.error("Error reading managekey:", err);
  thepasskey = "default-secure-key";
}

/* ── helper: parse JSON body ───────────────────────────────────────── */
function getJSONBody(req, cb) {
  let raw = "";
  req.on("data", chunk => (raw += chunk));
  req.on("end", () => {
    if (!raw) return cb(null, {});
    try       { cb(null, JSON.parse(raw)); }
    catch (e) { cb(new Error("Invalid JSON")); }
  });
}

/* ── data skeletons ────────────────────────────────────────────────── */
let jsdata = {
  mainPost : {},
  featured : Array(4).fill({}),
  projects : Array(4).fill({})
};

let blogData = {
  f1arti    : { subcategories: [], posts: [] },
  movietv   : { subcategories: [], posts: [] },
  experience: { subcategories: [], posts: [] },
  techart   : { subcategories: [], posts: [] }
};

const blogUrls = {
  f1arti    : "https://beyondmebtw.com/blog/f1arti.json",
  movietv   : "https://beyondmebtw.com/blog/movietv.json",
  experience: "https://beyondmebtw.com/blog/experience.json",
  techart   : "https://beyondmebtw.com/blog/techart.json"
};

/* ── utility functions (unchanged) ─────────────────────────────────── */
function loadJSON(cb) { /* … unchanged … */ }
function loadBlogJSON(cat, cb) { /* … unchanged … */ }
function updateData(name, date, excerpt, thumbnail, link, formId) { /* … unchanged … */ }
function addNewBlogPost(cat, uid, title, date, excerpt, thumbnail, link, subcat, secCat, secSub) { /* … unchanged … */ }
function writeJSONFile(cb) { /* … unchanged … */ }
function writeBlogJSONFile(cat, cb) { /* … unchanged … */ }
function executeScript(cb) { /* … unchanged … */ }

/* ──────────────────────────────────────────────────────────────────── */

const server = http.createServer((req, res) => {
  const url  = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  /* CORS headers */
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  /* ───── /loginauth ─────────────────────────────────────────────── */
  if (path === "/loginauth") {
    const handle = key => {
      if (!key)              return res.writeHead(400).end("Missing key");
      if (key !== thepasskey) return res.writeHead(403).end("Invalid key");

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, message: "Authentication successful" }));
    };

    if (req.method === "POST") {
      return getJSONBody(req, (err, body) => {
        if (err) return res.writeHead(400).end("Bad JSON");
        handle(body.key);
      });
    }

    /* legacy GET support */
    return handle(url.searchParams.get("key"));
  }

  /* ───── /latestdata ────────────────────────────────────────────── */
  else if (path === "/latestdata") {
    const processLatest = params => {
      const { name, date, excerpt, thumbnail, link, formid, key } = params;

      if (!key)      return res.writeHead(400).end("Missing key");
      if (!formid)   return res.writeHead(400).end("Missing formid");
      if (key !== thepasskey) return res.writeHead(403).end("Invalid key");

      loadJSON(() => {
        try {
          updateData(name, date, excerpt, thumbnail, link, formid);
          writeJSONFile(err => {
            if (err) return res.writeHead(500).end("Write error");
            executeScript(() => {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true }));
            });
          });
        } catch (e) {
          res.writeHead(400).end(`Error updating data: ${e.message}`);
        }
      });
    };

    if (req.method === "POST") {
      return getJSONBody(req, (err, body) => {
        if (err) return res.writeHead(400).end("Bad JSON");
        processLatest(body);
      });
    }

    /* legacy GET */
    processLatest(Object.fromEntries(url.searchParams.entries()));
  }

  /* ───── /blogdata ──────────────────────────────────────────────── */
  else if (path === "/blogdata") {
    const processBlog = p => {
      const {
        category, uid, title, date, excerpt, thumbnail, link,
        subcategory, secondaryCategory, secondarySubcategory,
        isNewPost, key
      } = p;

      if (!key || key !== thepasskey) return res.writeHead(403).end("Invalid key");
      if (!category)                 return res.writeHead(400).end("Missing category");
      if (!title || !date || !excerpt || !thumbnail || !link)
        return res.writeHead(400).end("Missing required blog fields");

      loadBlogJSON(category, () => {
        try {
          addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link,
                         subcategory, secondaryCategory, secondarySubcategory);

          writeBlogJSONFile(category, err => {
            if (err) return res.writeHead(500).end("Write error");
            executeScript(() => {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true }));
            });
          });
        } catch (e) {
          res.writeHead(400).end(`Error adding blog data: ${e.message}`);
        }
      });
    };

    if (req.method === "POST") {
      return getJSONBody(req, (err, body) => {
        if (err) return res.writeHead(400).end("Bad JSON");
        processBlog(body);
      });
    }

    /* legacy GET */
    processBlog(Object.fromEntries(url.searchParams.entries()));
  }

  /* ───── /health ────────────────────────────────────────────────── */
  else if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "OK", timestamp: new Date().toISOString() }));
  }

  /* ───── 404 ────────────────────────────────────────────────────── */
  res.writeHead(404).end("Not Found");
});

/* ── errors & graceful shutdown ──────────────────────────────────── */
server.on("error", err => console.error("Server error:", err));

["SIGTERM", "SIGINT"].forEach(sig => {
  process.on(sig, () => {
    console.log(`${sig} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  });
});

/* ── start server ────────────────────────────────────────────────── */
const PORT = process.env.PORT || 7000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
