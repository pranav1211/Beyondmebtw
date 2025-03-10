const http = require('http');
const fs = require('fs');
const { URLSearchParams } = require('url');

// Fix environment variable reading
let thepasskey;
try {
  thepasskey = process.env.managekey || fs.readFileSync('/etc/environment', 'utf8')
    .split('\n')
    .find(line => line.startsWith('managekey='))
    ?.split('=')[1]?.trim();

  if (!thepasskey) {
    console.error('Warning: managekey not found in environment or file');
    thepasskey = 'default-secure-key'; // Use a default key or exit process
  }
} catch (error) {
  console.error('Error reading password:', error);
  thepasskey = 'default-secure-key'; // Fallback
}

// Load JSON data with error handling
let blogData;
try {
  blogData = JSON.parse(fs.readFileSync('latest.json', 'utf8'));
  console.log('JSON data loaded successfully');
} catch (err) {
  console.error('Error loading JSON file:', err);
  // Create a default structure if file doesn't exist
  blogData = {
    latestPost: {
      title: "",
      date: "",
      excerpt: "",
      thumbnail: "",
      link: ""
    },
    featuredPosts: [
      {
        title: "",
        date: "",
        excerpt: "",
        thumbnail: "",
        link: ""
      },
      {
        title: "",
        date: "",
        excerpt: "",
        thumbnail: "",
        link: ""
      },
      {
        title: "",
        date: "",
        excerpt: "",
        thumbnail: "",
        link: ""
      }
    ]
  };
  
  // Write the default structure to file
  fs.writeFileSync('latest.json', JSON.stringify(blogData, null, 2), 'utf8');
  console.log('Created new JSON file with default structure');
}

// Update the entire blog data
function updateBlogData(newData) {
  blogData = newData;

  fs.writeFile('latest.json', JSON.stringify(blogData, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing to JSON file:', err);
      return false;
    }
    console.log("Blog data updated successfully");
    return true;
  });
}

// Parse request body for POST requests
function parseBody(request) {
  return new Promise((resolve, reject) => {
    if (request.method !== 'POST') {
      return resolve({});
    }

    let body = '';
    request.on('data', chunk => {
      body += chunk.toString();
      
      // Limit size to prevent abuse
      if (body.length > 1e6) {
        request.connection.destroy();
        reject(new Error('Request body too large'));
      }
    });

    request.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const result = {};
        for (const [key, value] of params.entries()) {
          result[key] = value;
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const path = url.pathname;

  // Add CORS headers to allow cross-origin requests
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  // Verify password endpoint
  if (path === '/verify') {
    const parameters = url.searchParams;
    const key = parameters.get('key');

    console.log('Received verification request');

    if (key === thepasskey) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: true }));
    } else {
      console.log('Verification failed');
      response.writeHead(403, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ success: false, message: "Invalid authentication" }));
    }
  }
  // Get current data
  else if (path === '/data') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(blogData));
  }
  // Update data
  else if (path === '/update') {
    try {
      // For POST requests, parse the body
      let dataToUpdate, key;
      
      if (request.method === 'POST') {
        const body = await parseBody(request);
        dataToUpdate = JSON.parse(body.data || '{}');
        key = body.key;
      } else {
        // For GET requests, use query parameters
        const parameters = url.searchParams;
        key = parameters.get('key');
        
        // Legacy support
        if (parameters.get('name')) {
          // Convert old format to new format
          dataToUpdate = {
            latestPost: {
              title: parameters.get('name') || "",
              date: parameters.get('date') || "",
              excerpt: parameters.get('excerpt') || "",
              thumbnail: parameters.get('thumbnail') || "",
              link: parameters.get('link') || ""
            },
            featuredPosts: blogData.featuredPosts || []
          };
        } else {
          response.statusCode = 400;
          response.end(JSON.stringify({ 
            success: false, 
            message: "Invalid request format" 
          }));
          return;
        }
      }

      console.log('Received update request');

      if (key === thepasskey) {
        updateBlogData(dataToUpdate);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ 
          success: true, 
          message: "Data updated successfully" 
        }));
      } else {
        console.log('Update authorization failed');
        response.writeHead(403, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ 
          success: false, 
          message: "Unauthorized access - Invalid key" 
        }));
      }
    } catch (error) {
      console.error('Error processing update request:', error);
      response.statusCode = 400;
      response.end(JSON.stringify({ 
        success: false, 
        message: "Invalid request data" 
      }));
    }
  }
  // Serve static files
  else if (path === '/' || path === '/index.html') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        response.statusCode = 500;
        response.end("Error loading index.html");
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(data);
    });
  }
  else if (path === '/index.js') {
    fs.readFile('index.js', (err, data) => {
      if (err) {
        response.statusCode = 500;
        response.end("Error loading index.js");
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/javascript' });
      response.end(data);
    });
  }
  else if (path === '/styles.css') {
    fs.readFile('styles.css', (err, data) => {
      if (err) {
        response.statusCode = 500;
        response.end("Error loading styles.css");
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/css' });
      response.end(data);
    });
  }
  // Handle not found
  else {
    response.statusCode = 404;
    response.end("Not Found");
  }
}).listen(7000);

console.log('Server running at http://localhost:7000/');