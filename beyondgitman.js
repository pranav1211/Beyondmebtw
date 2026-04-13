const express = require('express');
const { execFile } = require('child_process');
const crypto = require('crypto');

const scriptPath = '/shellfiles/beyond.sh';
const app = express();

// Validate critical environment variable at startup
if (!process.env.beyondmegitkey) {
  console.error('CRITICAL: beyondmegitkey environment variable is not set. Webhook signature verification will reject all requests.');
}

// Middleware to capture raw body for webhook signature verification
app.use('/bmbg', express.raw({ type: 'application/json' }));

// Function to verify GitHub webhook signature
function verifyGitHubSignature(payload, signature) {
  const secret = process.env.beyondmegitkey;
  if (!secret) {
    console.error('GitHub webhook secret not found in environment variables — rejecting request');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const actualSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(actualSignature, 'hex')
  );
}

// Helper to run the deploy script safely using execFile instead of exec
function runDeployScript(callback) {
  execFile('sh', [scriptPath], { timeout: 30000 }, callback);
}

// Handle GET requests (when visiting in browser)
app.get('/bmbg', (req, res) => {
  runDeployScript((error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      return res.status(500).send(`
        <html>
        <body>
          <h1>Error executing script</h1>
          <p>An error occurred while running the deploy script.</p>
          <a href="javascript:history.back()">Go Back</a>
        </body>
        </html>
      `);
    }

    console.log(`Script output: ${stdout}`);
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }

    res.status(200).send(`
      <html>
      <body>
        <h1>Script executed successfully!</h1>
        <p>Timestamp: ${new Date()}</p>
        <pre>${stdout}</pre>
        <a href="javascript:history.back()">Go Back</a>
      </body>
      </html>
    `);
  });
});

// Handle POST requests with GitHub webhook signature verification
app.post('/bmbg', (req, res) => {
  const signature = req.get('X-Hub-Signature-256');

  if (!signature) {
    console.error('No signature provided');
    return res.status(401).json({ message: 'Unauthorized: No signature provided' });
  }

  if (!verifyGitHubSignature(req.body, signature)) {
    console.error('Invalid signature');
    return res.status(401).json({ message: 'Unauthorized: Invalid signature' });
  }

  console.log('GitHub webhook signature verified successfully');

  runDeployScript((error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      return res.status(500).json({
        message: 'Error executing script',
        error: error.message
      });
    }

    console.log(`Script output: ${stdout}`);
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }

    res.status(200).json({
      message: 'Script executed successfully',
      timestamp: new Date()
    });
  });
});

app.listen(6009, () => {
  console.log('Server is running on port 6009');
});
