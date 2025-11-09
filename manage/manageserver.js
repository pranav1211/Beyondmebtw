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

// Main section data structure (removed projects)
let jsdata = {
  mainPost: {},
  featured: Array(4).fill(null).map(() => ({})),
  categories: {} // Add categories to the initial structure
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
  experience: "https://beyondmebtw.com/blog/experience.json",
  techart: "https://beyondmebtw.com/blog/techart.json"
};

// Helper function to parse JSON from request body
function getJSONBody(request, callback) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk.toString();
  });

  request.on("end", () => {
    try {
      const jsonData = JSON.parse(body);
      callback(null, jsonData);
    } catch (error) {
      callback(error, null);
    }
  });

  request.on("error", (error) => {
    callback(error, null);
  });
}

// Function to load existing local data first
function loadExistingData() {
  const jsonPath = path.join(__dirname, "latest.json");

  try {
    if (fs.existsSync(jsonPath)) {
      const existingData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

      // Preserve existing data structure, especially categories (removed projects)
      jsdata.mainPost = existingData.mainPost || {};
      jsdata.featured = existingData.featured || Array(4).fill(null).map(() => ({}));
      jsdata.categories = existingData.categories || {}; // Preserve categories

      console.log("Existing local data loaded successfully");
    }
  } catch (error) {
    console.error("Error loading existing data:", error);
    // Keep default structure if loading fails
  }
}

function loadJSON(callback) {
  // First load existing local data to preserve categories
  loadExistingData();

  const request = https.get("https://beyondmebtw.com/manage/latest.json", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const parsedData = JSON.parse(data);

        // Validate and merge data - preserve existing data structure INCLUDING categories (removed projects)
        jsdata.mainPost = { ...jsdata.mainPost, ...parsedData.mainPost } || jsdata.mainPost;

        // Handle featured array - preserve existing entries
        if (Array.isArray(parsedData.featured)) {
          for (let i = 0; i < Math.min(parsedData.featured.length, 4); i++) {
            jsdata.featured[i] = { ...jsdata.featured[i], ...parsedData.featured[i] };
          }
        }

        // IMPORTANT: Preserve categories from existing data - don't overwrite from remote
        // Only merge if remote data has categories and we want to update them
        if (parsedData.categories) {
          jsdata.categories = { ...jsdata.categories, ...parsedData.categories };
        }
        // If parsedData doesn't have categories, jsdata.categories remains unchanged

        console.log("JSON data loaded successfully from URL and merged with existing data.");
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
    // Main post and featured posts only (removed projects)
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
    // Ensure we're writing the complete jsdata object including categories (removed projects)
    fs.writeFileSync(jsonPath, JSON.stringify(jsdata, null, 2), "utf8");
    console.log("Data written to latest.json successfully (including categories)");
    callback(null);
  } catch (error) {
    console.error("Error writing JSON file:", error);
    callback(error);
  }
}

function writeBlogJSONFile(category, callback) {
  const jsonPath = path.join("/bmbsifi/Beyondmebtw/blog", `${category}.json`);

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

function updateLatestJSONCategories(category, uid, title, thumbnail, subcategory) {
  console.log(`Updating latest.json categories for ${category}:`, { uid, title, thumbnail, subcategory });

  // Keep category names exactly as they are sent from the form (lowercase)
  const categoryKey = category.toLowerCase();

  // Normalize subcategory to match existing JSON structure
  const normalizeSubcategory = (subcat) => {
    if (!subcat) return null;
    const lower = subcat.toLowerCase();

    // Special handling for known subcategories to match existing structure
    switch (lower) {
      case '2025 season':
        return '2025 season'; // Keep exactly as is in existing JSON
      case 'general':
        return 'general'; // Keep as lowercase
      case 'movies':
        return 'movies';
      case 'tv':
        return 'tv';
      // Add other known subcategories here as needed
      default:
        return lower; // Keep as lowercase for consistency
    }
  };

  const normalizedSubcategory = normalizeSubcategory(subcategory);

  console.log(`Using category key: ${categoryKey}, subcategory: ${normalizedSubcategory}`);

  // Initialize categories structure if it doesn't exist
  if (!jsdata.categories) {
    jsdata.categories = {};
  }

  // Initialize the category if it doesn't exist
  if (!jsdata.categories[categoryKey]) {
    jsdata.categories[categoryKey] = {
      subcategories: {}
    };
  }

  // Create the post data for latest.json
  const latestPostData = {
    uid: uid,
    title: title,
    thumbnail: thumbnail
  };

  // Handle categories with subcategories (f1arti and movietv)
  if (normalizedSubcategory && (categoryKey === 'f1arti' || categoryKey === 'movietv')) {
    // Initialize subcategories structure if it doesn't exist
    if (!jsdata.categories[categoryKey].subcategories) {
      jsdata.categories[categoryKey].subcategories = {};
    }

    // Initialize the specific subcategory if it doesn't exist
    if (!jsdata.categories[categoryKey].subcategories[normalizedSubcategory]) {
      jsdata.categories[categoryKey].subcategories[normalizedSubcategory] = {
        mainPost: {}
      };
    }

    // REPLACE (not merge) the subcategory's mainPost
    jsdata.categories[categoryKey].subcategories[normalizedSubcategory].mainPost = latestPostData;

    console.log(`Replaced subcategory ${normalizedSubcategory} in ${categoryKey}:`, latestPostData);
  } else {
    // Handle categories without subcategories (experience, techart)
    // REPLACE (not merge) the main category's mainPost
    jsdata.categories[categoryKey].mainPost = latestPostData;

    console.log(`Replaced main category ${categoryKey}:`, latestPostData);
  }

  console.log(`Updated categories structure:`, JSON.stringify(jsdata.categories, null, 2));
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
      if (request.method === "POST") {
        return getJSONBody(request, (err, body) => {
          if (err) {
            console.error("JSON parsing error:", err);
            response.statusCode = 400;
            return response.end("Bad JSON");
          }

          const key = body.key;
          if (!key) {
            response.statusCode = 400;
            return response.end("Missing key");
          }
          if (key !== thepasskey) {
            response.statusCode = 403;
            return response.end("Invalid key");
          }

          response.writeHead(200, { "Content-Type": "application/json" });
          return response.end(JSON.stringify({ success: true, message: "Authentication successful" }));
        });
      }
    }
    // Handle main section updates
    else if (path === "/latestdata") {
      if (request.method === "POST") {
        return getJSONBody(request, (err, body) => {
          if (err) {
            console.error("JSON parsing error:", err);
            response.statusCode = 400;
            return response.end("Bad JSON");
          }

          const { name, date, excerpt, thumbnail, link, formid, key } = body;

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
        });
      } else {
        response.statusCode = 405;
        response.end("Method Not Allowed - Use POST");
      }
    }
    // Handle blog post additions only
    else if (path === "/blogdata") {
      if (request.method === "POST") {
        return getJSONBody(request, (err, body) => {
          if (err) {
            console.error("JSON parsing error:", err);
            response.statusCode = 400;
            return response.end("Bad JSON");
          }

          const {
            category,
            uid,
            title,
            date,
            excerpt,
            thumbnail,
            link,
            subcategory,
            secondaryCategory,
            secondarySubcategory,
            isNewPost,
            key
          } = body;

          console.log("Blog data request received:", {
            category, uid, title, isNewPost,
            allParams: body
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

          // Load both blog JSON and main JSON data
          loadBlogJSON(category, () => {
            loadJSON(() => {
              try {
                // Add the new blog post to category-specific data
                addNewBlogPost(category, uid, title, date, excerpt, thumbnail, link, subcategory, secondaryCategory, secondarySubcategory);

                // Update latest.json categories section
                updateLatestJSONCategories(category, uid, title, thumbnail, subcategory);

                // Write both the blog JSON file and the main latest.json file
                writeBlogJSONFile(category, (blogWriteError) => {
                  if (blogWriteError) {
                    response.statusCode = 500;
                    response.end("Error writing blog data to file");
                    return;
                  }

                  // Write the updated latest.json file
                  writeJSONFile((latestWriteError) => {
                    if (latestWriteError) {
                      response.statusCode = 500;
                      response.end("Error writing latest.json data to file");
                      return;
                    }

                    // Run the shell script after writing both files
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
                        `<html><body><h1>New blog post added successfully.</h1><p>Both category JSON and latest.json updated.</p><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
                      );
                    });
                  });
                });
              } catch (updateError) {
                console.error("Error adding blog data:", updateError);
                response.statusCode = 400;
                response.end(`Error adding blog data: ${updateError.message}`);
              }
            });
          });
        });
      } else {
        response.statusCode = 405;
        response.end("Method Not Allowed - Use POST");
      }
    }
    // Handle categories data endpoint
    else if (path === "/categories") {
      if (request.method === "GET") {
        try {
          // Collect all unique subcategories from each blog category
          const categoriesData = {
            f1arti: {
              subcategories: blogData.f1arti.subcategories || []
            },
            movietv: {
              subcategories: blogData.movietv.subcategories || []
            },
            experience: {
              subcategories: blogData.experience.subcategories || []
            },
            techart: {
              subcategories: blogData.techart.subcategories || []
            }
          };

          // Also collect secondary categories from all posts
          const secondaryCategoriesSet = new Set();
          const secondarySubcategoriesMap = new Map(); // Map of category to subcategories

          Object.values(blogData).forEach(categoryData => {
            if (categoryData.posts) {
              categoryData.posts.forEach(post => {
                if (post.secondaryCategory) {
                  secondaryCategoriesSet.add(post.secondaryCategory);

                  if (post.secondarySubcategory) {
                    if (!secondarySubcategoriesMap.has(post.secondaryCategory)) {
                      secondarySubcategoriesMap.set(post.secondaryCategory, new Set());
                    }
                    secondarySubcategoriesMap.get(post.secondaryCategory).add(post.secondarySubcategory);
                  }
                }
              });
            }
          });

          // Convert sets to arrays for JSON response
          categoriesData.secondaryCategories = Array.from(secondaryCategoriesSet);
          categoriesData.secondarySubcategories = {};
          secondarySubcategoriesMap.forEach((subcats, category) => {
            categoriesData.secondarySubcategories[category] = Array.from(subcats);
          });

          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(categoriesData));
        } catch (error) {
          console.error("Error fetching categories:", error);
          response.statusCode = 500;
          response.end("Error fetching categories");
        }
      } else {
        response.statusCode = 405;
        response.end("Method Not Allowed - Use GET");
      }
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

// Load blog data on server start
function loadAllBlogData(callback) {
  const categories = ['f1arti', 'movietv', 'experience', 'techart'];
  let completed = 0;

  categories.forEach(category => {
    loadBlogJSON(category, () => {
      completed++;
      if (completed === categories.length) {
        console.log('All blog data loaded successfully');
        if (callback) callback();
      }
    });
  });
}

// Start server after loading blog data
loadAllBlogData(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});