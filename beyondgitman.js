// const express = require('express');
// const crypto = require('crypto');
// const { exec } = require('child_process');
// const path = require('path');
// require('dotenv').config();
 
// const scriptPath = '/shellfiles/beyond.sh';
// const GITHUB_SECRET = process.env.beyondmegitkey;

// const app = express();

// app.use(express.json()); 

// app.use((req, res, next) => {
//     const signature = req.headers['x-hub-signature-256'];
//     const payload = JSON.stringify(req.body);

//     if (!signature) {
//         return res.status(401).json({ message: 'Signature required' });
//     }

//     const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
//     const digest = `sha256=${hmac.update(payload).digest('hex')}`;

//     if (signature !== digest) {
//         return res.status(401).json({ message: 'Invalid signature' });
//     }

//     next();
// });

// app.post('/beyondg', (req, res) => {
//     exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing script: ${error}`);
//             return res.status(500).json({ message: 'Error executing script', error: error.message });
//         }

//         console.log(`Script output: ${stdout}`);
//         if (stderr) {
//             console.error(`Script stderr: ${stderr}`);
//         }

//         res.status(200).json({ message: 'Script executed successfully', timestamp: new Date() });
//     });
// });

// app.listen(6005, () => {
//     console.log('Server is running on port 6005');
// });

// Install express and node-fetch before running
// npm install express node-fetch

const express = require('express');
const app = express();

// Define the /mylibg route that will handle the fetch request
app.get('/bmbg', (req, res) => {
  // Send a JSON response
  res.status(200).json({ message: 'Hello, world!', timestamp: new Date() });
});

// Start the server on port 3000
app.listen(6007, () => {
  console.log('Server is running on port 6007');
});
