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

let jsdata;
function loadJSON(callback) {
  https.get("https://beyondmebtw.com/manage/latest.json", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        jsdata = JSON.parse(data);
        console.log("JSON data loaded successfully from URL.");
        callback();
      } catch (err) {
        console.error("Error parsing JSON from URL:", err);
        jsdata = { mainPost: {}, featured: Array(4).fill({}) };
        callback();
      }
    });
  }).on("error", (err) => {
    console.error("Error fetching JSON from URL:", err);
    jsdata = { mainPost: {}, featured: Array(4).fill({}) };
    callback();
  });
}

function updateData(name, date, excerpt, thumbnail, link, formId) {
  const instanceMap = {
    latest: () => {
      jsdata.mainPost.title = name;
      jsdata.mainPost.date = date;
      jsdata.mainPost.excerpt = excerpt;
      jsdata.mainPost.thumbnail = thumbnail;
      jsdata.mainPost.link = link;
    },
    featured1: () => {
      jsdata.featured[0].title = name;
      jsdata.featured[0].date = date;
      jsdata.featured[0].excerpt = excerpt;
      jsdata.featured[0].thumbnail = thumbnail;
      jsdata.featured[0].link = link;
    },
    featured2: () => {
      jsdata.featured[1].title = name;
      jsdata.featured[1].date = date;
      jsdata.featured[1].excerpt = excerpt;
      jsdata.featured[1].thumbnail = thumbnail;
      jsdata.featured[1].link = link;
    },
    featured3: () => {
      jsdata.featured[2].title = name;
      jsdata.featured[2].date = date;
      jsdata.featured[2].excerpt = excerpt;
      jsdata.featured[2].thumbnail = thumbnail;
      jsdata.featured[2].link = link;
    },
    featured4: () => {
      jsdata.featured[3].title = name;
      jsdata.featured[3].date = date;
      jsdata.featured[3].excerpt = excerpt;
      jsdata.featured[3].thumbnail = thumbnail;
      jsdata.featured[3].link = link;
    },
  };

  if (instanceMap[formId]) {
    instanceMap[formId]();
  } else {
    console.error("Invalid formId:", formId);
    return;
  }

  fs.writeFileSync("latest.json", JSON.stringify(jsdata, null, 2), "utf8");
  console.log("Data written to latest.json:", jsdata);
}

http
  .createServer((request, response) => {
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
      response.end("<html><body><h1>Server is running</h1><p>The data update service is active.</p></body></html>");
    } else {
      response.statusCode = 404;
      response.end("Not Found");
    }
  })
  .listen(7000);

console.log("Server running at http://localhost:7000/");
