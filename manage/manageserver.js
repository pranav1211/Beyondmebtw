const http = require("http");
const https = require("https");
const fs = require("fs");
const { exec } = require("child_process");

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

let jsdata = { 
  mainPost: {}, 
  featured: Array(4).fill({}),
  projects: Array(4).fill({})  // Initialize projects array
}; 

function loadJSON(callback) {
  https.get("https://beyondmebtw.com/manage/latest.json", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        jsdata = JSON.parse(data);
        
        // Ensure projects array exists and has 4 elements
        if (!jsdata.projects) {
          jsdata.projects = Array(4).fill({});
        } else if (jsdata.projects.length < 4) {
          // Pad with empty objects if fewer than 4 projects
          jsdata.projects = [...jsdata.projects, ...Array(4 - jsdata.projects.length).fill({})];
        }
        
        console.log("JSON data loaded successfully from URL.");
      } catch (err) {
        console.error("Error parsing JSON from URL:", err);
      }
      callback();
    });
  }).on("error", (err) => {
    console.error("Error fetching JSON from URL:", err);
    callback();
  });
}

function updateData(name, date, excerpt, thumbnail, link, formId) {
  const updateFields = (target, updates) => {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null && value !== undefined) {
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
    
    // Project posts - note they use 'title' instead of 'name' in the JSON
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
  } else {
    console.error("Invalid formId:", formId);
  }
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  // Handle login authentication
  if (path === "/loginauth") {
    const parameters = url.searchParams;
    const key = parameters.get("key");
    
    if (key === thepasskey) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ success: true, message: "Authentication successful" }));
    } else {
      response.statusCode = 403;
      response.end(JSON.stringify({ success: false, message: "Authentication failed - Invalid key" }));
    }
  } else if (path === "/latestdata") {
    const parameters = url.searchParams;
    const name = parameters.get("name");
    const date = parameters.get("date");
    const excerpt = parameters.get("excerpt");
    const thumbnail = parameters.get("thumbnail");
    const link = parameters.get("link");
    const formid = parameters.get("formid");
    const key = parameters.get("key");
 
    if (key === thepasskey) {
      loadJSON(() => {
        updateData(name, date, excerpt, thumbnail, link, formid);
        fs.writeFileSync("latest.json", JSON.stringify(jsdata, null, 2), "utf8");
        console.log("Data written to latest.json:", jsdata);

        const scriptPath = '/shellfiles/jsonupdatebmb.sh';
        exec(`sh ${scriptPath}`, { timeout: 5000 }, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing script: ${error}`);
            response.statusCode = 500;
            response.end("Changes made");
            return;
          }

          console.log(`Script output: ${stdout}`);
          if (stderr) {
            console.error(`Script stderr: ${stderr}`);
          }

          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(
            `<html><body><h1>Data updated successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
          );
        });
      });
    } else {
      response.statusCode = 403;
      response.end("Unauthorized access - Invalid key");
    }
  } else if (path === "/") {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      fs.readFileSync("index.html", "utf8")
    );
  } else if (path === "/styles.css") {
    response.writeHead(200, { "Content-Type": "text/css" });
    response.end(
      fs.readFileSync("styles.css", "utf8")
    );
  } else if (path === "/index.js") {
    response.writeHead(200, { "Content-Type": "application/javascript" });
    response.end(
      fs.readFileSync("index.js", "utf8")
    );
  } else {
    response.statusCode = 404;
    response.end("Not Found");
  }
}).listen(7000);

console.log("Server running at http://206.189.130.179:7000/");