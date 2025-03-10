const http = require('http');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');
const crypto = require('crypto');

// Environment variable handling
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
  // Create a default structure
  blogData = {
    mainPost: {
      title: "Beyond Me Btw : A New Chapter",
      date: "March 3, 2025",
      excerpt: "Two years ago, I launched my blog, Beyond Me Btw, with the goal of exploring new experiences and ...",
      thumbnail: "bmbv2.jpg",
      link: "https://beyondmebtw.com/posts/new-chapter"
    },
    featured: [
      {
        title: "Finding Balance in a Digital World",
        date: "February 20, 2025",
        excerpt: "As our lives become increasingly intertwined with technology, finding balance between online and offline experiences becomes essential...",
        thumbnail: "digitalbalance.jpg",
        link: "https://beyondmebtw.com/posts/digital-balance"
      },
      {
        title: "The Art of Slow Living",
        date: "January 15, 2025",
        excerpt: "In today's fast-paced world, embracing slow living can be revolutionary. This post explores practical ways to...",
        thumbnail: "slowliving.jpg",
        link: "https://beyondmebtw.com/posts/slow-living"
      },
      {
        title: "Mindfulness Through Photography",
        date: "December 28, 2024",
        excerpt: "Photography isn't just about capturing moments – it's about being present in them. Here's how I use my camera to practice mindfulness...",
        thumbnail: "mindfulphoto.jpg",
        link: "https://beyondmebtw.com/posts/mindful-photography"
      }
    ]
  };
  
  // Write the default structure to file
  fs.writeFileSync('latest.json', JSON.stringify(blogData, null, 2), 'utf8');
  console.log('Created new JSON file with default structure');
}

// Token management
const tokens = new Map();

// Helper function to generate a token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to verify token
const verifyToken = (token) => {
  return tokens.has(token);
};

// Helper function to save data
const saveData = (data) => {
  try {
    fs.writeFileSync('latest.json', JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// Helper function to serve static files
const serveStaticFile = (res, filePath, contentType) => {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
};

// Create server
http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Check authentication for protected routes
  if (['/getdata', '/updatedata'].includes(pathname)) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!verifyToken(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }
  }
  
  // Route handling
  if (pathname === '/') {
    serveStaticFile(res, 'index.html', 'text/html');
  } 
  // Serve static files
  else if (['/styles.css', '/index.js'].includes(pathname)) {
    const filePath = `.${pathname}`;
    const contentType = pathname.endsWith('.css') ? 'text/css' : 'application/javascript';
    serveStaticFile(res, filePath, contentType);
  }
  // Authentication endpoint
  else if (pathname === '/auth' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);
        
        if (password === thepasskey) {
          const token = generateToken();
          tokens.set(token, Date.now()); // Store token with timestamp
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid password' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request' }));
      }
    });
  }
  // Get data endpoint
  else if (pathname === '/getdata') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(blogData));
  }
  // Update data endpoint
  else if (pathname === '/updatedata' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const newData = JSON.parse(body);
        
        // Basic validation
        if (!newData.mainPost || !Array.isArray(newData.featured)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid data format' }));
          return;
        }
        
        // Save data
        if (saveData(newData)) {
          blogData = newData;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to save data' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request' }));
      }
    });
  }
  // Support for old API endpoint (for backward compatibility)
  else if (pathname === '/latestdata') {
    const parameters = url.searchParams;
    
    const name = parameters.get('name');
    const date = parameters.get('date');
    const excerpt = parameters.get('excerpt');
    const thumbnail = parameters.get('thumbnail');
    const key = parameters.get('key');
    const link = parameters.get('link') || `https://beyondmebtw.com/posts/${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (key === thepasskey) {
      // Update main post
      blogData.mainPost = {
        title: name,
        date: date,
        excerpt: excerpt,
        thumbnail: thumbnail,
        link: link
      };
      
      // Save data
      if (saveData(blogData)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end("<html><body><h1>Data updated successfully.</h1><p>Redirecting back...</p><script>setTimeout(function(){ window.location.href = '/'; }, 3000);</script></body></html>");
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end("Error saving data");
      }
    } else {
      res.writeHead(403, { 'Content-Type': 'text