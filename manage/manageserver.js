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
let jsdata;
try {
  jsdata = JSON.parse(fs.readFileSync('latest.json', 'utf8'));
  console.log('JSON data loaded successfully');
} catch (err) {
  console.error('Error loading JSON file:', err);
  // Create a default structure if file doesn't exist
  jsdata = { name: "", date: "", excerpt: "", thumbnail: "" };
  // Write the default structure to file
  fs.writeFileSync('latest.json', JSON.stringify(jsdata), 'utf8');
  console.log('Created new JSON file with default structure');
}

function updateData(name, date, excerpt, thumbnail) {
  jsdata.title = name;
  jsdata.date = date;
  jsdata.excerpt = excerpt;
  jsdata.thumbnail = thumbnail;

  fs.writeFile('latest.json', JSON.stringify(jsdata), 'utf8', (err) => {
    if (err) {
      console.error('Error writing to JSON file:', err);
      return;
    }
    console.log("Data updated successfully");
  });
}

http.createServer((request, response) => {
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

  if (path === '/latestdata') {
    const parameters = url.searchParams;

    const name = parameters.get('name');
    const date = parameters.get('date');
    const excerpt = parameters.get('excerpt');
    const thumbnail = parameters.get('thumbnail');
    const key = parameters.get('key');

    console.log('Received update request with key:', key);
    
    if (key === thepasskey) {
      updateData(name, date, excerpt, thumbnail);
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.end("<html><body><h1>Data updated successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>");
    } else {
      console.log('Authorization failed. Provided key:', key, 'Expected key:', thepasskey);
      response.statusCode = 403;
      response.end("Unauthorized access - Invalid key");
    }
  } else if (path === '/') {
    // Serve a simple status page
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end("<html><body><h1>Server is running</h1><p>The data update service is active.</p></body></html>");
  } else {
    response.statusCode = 404;
    response.end("Not Found");
  }
}).listen(7000);

console.log('Server running at http://localhost:7000/');