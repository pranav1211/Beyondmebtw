const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

const scriptPath = '/shellfiles/beyond.sh';

// Load the GitHub webhook secret from /etc/environment
let GITHUB_SECRET;
try {
    const envContent = fs.readFileSync('/etc/environment', 'utf8');
    GITHUB_SECRET = envContent
        .split('\n')
        .find(line => line.startsWith('beyondmegitkey='))
        ?.split('=')[1]
        ?.trim();

    if (!GITHUB_SECRET) {
        throw new Error('GitHub secret not found in /etc/environment');
    }
} catch (err) {
    console.error('Error loading GitHub secret:', err.message);
    process.exit(1);
}

const app = express();
app.use(express.json());

app.post('/bmbg', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);

    if (!signature) {
        return res.status(401).json({ message: 'Signature required' });
    }

    const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    if (signature !== digest) {
        return res.status(401).json({ message: 'Invalid signature' });
    }

    exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).json({ message: 'Error executing script', error: error.message });
        }

        console.log(`Script output: ${stdout}`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }

        res.status(200).json({ message: 'Script executed successfully', timestamp: new Date() });
    });
});

app.listen(6007, () => {
    console.log('Server is running on port 6007');
});
