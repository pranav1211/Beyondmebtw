const http = require("http");
const https = require("https");
const fs = require("fs");

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

let jsdata = { mainPost: {}, featured: Array(4).fill({}) }; // Retain values if loadJSON fails
function loadJSON(callback) {
  https.get("https://beyondmebtw.com/manage/latest.json", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        jsdata = JSON.parse(data);
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

  if (path === "/latestdata") {
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

        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(
          `<html><body><h1>Data updated successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>`
        );
      });
    } else {
      response.statusCode = 403;
      response.end("Unauthorized access - Invalid key");
    }
  } else if (path === "/") {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      "<html><body><h1>Server is running</h1><p>The data update service is active.</p></body></html>"
    );
  } else {
    response.statusCode = 404;
    response.end("Not Found");
  }
}).listen(7000);

console.log("Server running at http://localhost:7000/");
