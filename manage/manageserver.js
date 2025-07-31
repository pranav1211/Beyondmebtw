const http = require("http");
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

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

// Main section data structure
let jsdata = {
  mainPost: {},
  featured: Array(4).fill(null).map(() => ({})),
  projects: Array(4).fill(null).map(() => ({}))
};

// Blog section data structure
let blogData = {
  f1arti: { subcategories: [], posts: [] },
  movietv: { subcategories: [], posts: [] },
  experience: { subcategories: [], posts: [] },
  techart: { subcategories: [], posts: [] }
};

const blogUrls = {
  f1arti: "https://beyondmebtw.com/blog/f1arti.json",
  movietv: "https://beyondmebtw.com/blog/movietv.json",
  experience: "https://beyondmebtw.com/blog/exerience.json",
  techart: "https://beyondmebtw.com/blog/techart.json"
};

function loadJSON(callback) {
  const request = https.get("https://beyondmebtw.com/manage/latest.json", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const parsedData = JSON.parse(data);

        // Validate and merge data
        jsdata.mainPost = parsedData.mainPost || {};

        // Handle featured array
        if (Array.isArray(parsedData.featured)) {
          jsdata.featured = parsedData.featured.slice(0, 4); // Take first 4
          while (jsdata.featured.length < 4) {
            jsdata.featured.push({}); // Pad with empty objects
          }
        } else {
          jsdata.featured = Array(4).fill(null).map(() => ({}));
        }

        // Handle projects array
        if (Array.isArray(parsedData.projects)) {
          jsdata.projects = parsedData.projects.slice(0, 4); // Take first 4
          while (jsdata.projects.length < 4) {
            jsdata.projects.push({}); // Pad with empty objects
          }
        } else {
          jsdata.projects = Array(4).fill(null).map(() => ({}));
        }

        console.log("JSON data loaded successfully from URL.");
      } catch (err) {
        console.error("Error parsing JSON from URL:", err);
      }
      callback();
    });
  });

  request.on("error", (err) => {
    console.error("Error fetching JSON from URL:", err);
    callback();
  });

  // Add timeout to prevent hanging
  request.setTimeout(10000, () => {
    console.error("Request timeout");
    request.destroy();
    callback();
  });
}

function loadBlogJSON(category, callback) {
  const url = blogUrls[category];
  if (!url) {
    console.error("Invalid blog category:", category);
    return callback(new Error("Invalid category"));
  }

  const request = https.get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const parsedData = JSON.parse(data);
        blogData[category] = {
          subcategories: parsedData.subcategories || [],
          posts: parsedData.posts || []
        };
        console.log(`Blog JSON data loaded successfully for ${category}.`);
      } catch (err) {
        console.error(`Error parsing blog JSON for ${category}:`, err);
        // Initialize empty structure if parsing fails
        blogData[category] = {
          subcategories: [],
          posts: []
        };
      }
      callback();
    });
  });

  request.on("error", (err) => {
    console.error(`Error fetching blog JSON for ${category}:`, err);
    // Initialize empty structure if request fails
    blogData[category] = {
      subcategories: [],
      posts: []
    };
    callback();
  });

  request.setTimeout(10000, () => {
    console.error(`Request timeout for ${category}`);
    request.destroy();
    blogData[category] = {
      subcategories: [],
      posts: []
    };
    callback();
  });
}

function updateData(name, date, excerpt, thumbnail, link, formId) {
  const updateFields = (target, updates) => {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null && value !== undefined && value !== "") {
        target[key] = value;
      }
    }
  };

  const updates = {
    // Main post and featured posts
    latest: () => {
      updateFields(jsdata.mainPost, { title: name, date, excerpt, thumbnail, link });
    },
    featured1: () => {
      updateFields(jsdata.featured[0], { title: name, date, excerpt, thumbnail, link });
    },
    featured2: () => {
      updateFields(jsdata.featured[1], { title: name, date, excerpt, thumbnail, link });
    },
    featured3: () => {
      updateFields(jsdata.featured[2], { title: name, date, excerpt, thumbnail, link });
    },
    featured4: () => {
      updateFields(jsdata.featured[3], { title: name, date, excerpt, thumbnail, link });
    },

    // Project posts
    project1: () => {
      updateFields(jsdata.projects[0], { title: name, excerpt, link });
    },
    project2: () => {
      updateFields(jsdata.projects[1], { title: name, excerpt, link });
    },
    project3: () => {
      updateFields(jsdata.projects[2], { title: name, excerpt, link });
    },
    project4: () => {
      updateFields(jsdata.projects[3], { title: name, excerpt, link });
    }
  };

  if (updates[formId]) {
    updates[formId]();
    console.log(`Updated ${formId} with data:`, { name, date, excerpt, thumbnail, link });
  } else {
    console.error("Invalid formId:", formId);
    throw new Error(`Invalid formId: ${formId}`);
  }
}

// Simplified function to only add new blog posts
function addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory) {
  if (!blogData[category]) {
    throw new Error(`Invalid blog category: ${category}`);
  }

  console.log(`Adding new blog post to ${category}:`, {
    uid, title
  });

  // Generate UID if not provided
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

  // Add optional fields if provided
  if (secondaryCategory) postData.secondaryCategory = secondaryCategory;
  if (secondarySubcategory) postData.secondarySubcategory = secondarySubcategory;

  // Always add as new post - no checking for duplicates
  blogData[category].posts.push(postData);
  console.log(`Successfully added new post to ${category}:`, postData);
}

function writeJSONFile(callback) {
  const jsonPath = path.join(__dirname, "latest.json");

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(jsdata, null, 2), "utf8");
    console.log("Data written to latest.json successfully");
    callback(null);
  } catch (error) {
    console.error("Error writing JSON file:", error);
    callback(error);
  }
}

function writeBlogJSONFile(category, callback) {
  const jsonPath = path.join(__dirname, `${category}.json`);

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(blogData[category], null, 2), "utf8");
    console.log(`Blog data written to ${category}.json successfully`);
    callback(null);
  } catch (error) {
    console.error(`Error writing blog JSON file for ${category}:`, error);
    callback(error);
  }
}

function executeScript(callback) {
  const scriptPath = '/shellfiles/jsonupdatebmb.sh';

  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    return callback(new Error(`Script not found: ${scriptPath}`));
  }

  exec(`sh ${scriptPath}`, { timeout: 15000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      return callback(error);
    }

    console.log(`Script output: ${stdout}`);
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }

    callback(null);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;

  // Set CORS headers
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    // Handle login authentication
    if (path === "/loginauth") {
      const parameters = url.searchParams;
      const key = parameters.get("key");

      if (!key) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ success: false, message: "Missing key parameter" }));
        return;
      }

      if (key === thepasskey) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ success: true, message: "Authentication successful" }));
      } else {
        response.statusCode = 403;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ success: false, message: "Authentication failed - Invalid key" }));
      }
    } 
    // Handle main section updates
    else if (path === "/latestdata") {
      const parameters = url.searchParams;
      const name = parameters.get("name");
      const date = parameters.get("date");
      const excerpt = parameters.get("excerpt");
      const thumbnail = parameters.get("thumbnail");
      const link = parameters.get("link");
      const formid = parameters.get("formid");
      const key = parameters.get("key");

      // Validate required parameters
      if (!key) {
        response.statusCode = 400;
        response.end("Missing key parameter");
        return;
      }

      if (!formid) {
        response.statusCode = 400;
        response.end("Missing formid parameter");
        return;
      }

      if (key !== thepasskey) {
        response.statusCode = 403;
        response.end("Unauthorized access - Invalid key");
        return;
      }

      // Load JSON and update data
      loadJSON(() => {
        try {
          updateData(name, date, excerpt, thumbnail, link, formid);

          writeJSONFile((writeError) => {
            if (writeError) {
              response.statusCode = 500;
              response.end("Error writing data to file");
              return;
            }

            executeScript((scriptError) => {
              if (scriptError) {
                console.error("Script execution failed, but data was saved");
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(
                  `<html><body><h1>Data updated successfully.</h1><p>Note: Script execution failed but data was saved.</p><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
                );
                return;
              }

              response.writeHead(200, { "Content-Type": "text/html" });
              response.end(
                `<html><body><h1>Data updated successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
              );
            });
          });
        } catch (updateError) {
          console.error("Error updating data:", updateError);
          response.statusCode = 400;
          response.end(`Error updating data: ${updateError.message}`);
        }
      });
    }
    // Handle blog post additions only
    else if (path === "/blogdata") {
      const parameters = url.searchParams;
      const category = parameters.get("category");
      const uid = parameters.get("uid");
      const title = parameters.get("title");
      const date = parameters.get("date");
      const excerpt = parameters.get("excerpt");
      const thumbnail = parameters.get("thumbnail");
      const link = parameters.get("link");
      const subcategory = parameters.get("subcategory");
      const secondaryCategory = parameters.get("secondaryCategory");
      const secondarySubcategory = parameters.get("secondarySubcategory");
      const isNewPost = parameters.get("isNewPost");
      const key = parameters.get("key");

      console.log("Blog data request received:", {
        category, uid, title, isNewPost, 
        allParams: Object.fromEntries(parameters.entries())
      });

      if (!key || key !== thepasskey) {
        response.statusCode = 403;
        response.end("Unauthorized access - Invalid key");
        return;
      }

      if (!category) {
        response.statusCode = 400;
        response.end("Missing category parameter");
        return;
      }

      if (!title || !date || !excerpt || !thumbnail || !link) {
        response.statusCode = 400;
        response.end("Missing required fields: title, date, excerpt, thumbnail, and link are required");
        return;
      }

      loadBlogJSON(category, () => {
        try {
          // Always add as new post (simplified logic)
          addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory);

          writeBlogJSONFile(category, (writeError) => {
            if (writeError) {
              response.statusCode = 500;
              response.end("Error writing blog data to file");
              return;
            }

            // Run the shell script after writing blog data
            executeScript((scriptError) => {
              if (scriptError) {
                console.error("Script execution failed, but blog data was saved");
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(
                  `<html><body><h1>New blog post added successfully.</h1><p>Note: Script execution failed but data was saved.</p><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
                );
                return;
              }

              response.writeHead(200, { "Content-Type": "text/html" });
              response.end(
                `<html><body><h1>New blog post added successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
              );
            });
          });
        } catch (updateError) {
          console.error("Error adding blog data:", updateError);
          response.statusCode = 400;
          response.end(`Error adding blog data: ${updateError.message}`);
        }
      });
    }
    else if (path === "/health") {
      // Health check endpoint
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "OK", timestamp: new Date().toISOString() }));
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

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});