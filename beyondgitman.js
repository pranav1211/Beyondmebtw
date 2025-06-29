const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const scriptPath = '/shellfiles/beyond.sh';

const app = express();

// Handle GET requests (when visiting in browser)
app.get('/bmbg', (req, res) => {
    console.log('=== BMBG Request Started ===');
    console.log('Script path:', scriptPath);
    
    // Check if script exists and is executable
    try {
        const stats = fs.statSync(scriptPath);
        console.log('Script exists:', stats.isFile());
        console.log('Script permissions:', stats.mode.toString(8));
    } catch (error) {
        console.error('Script file error:', error.message);
        return res.status(500).send(`
            <html><body>
                <h1>Script file not found</h1>
                <p>Error: ${error.message}</p>
                <p>Script path: ${scriptPath}</p>
            </body></html>
        `);
    }
    
    // Execute with more detailed options
    exec(`bash ${scriptPath}`, {
        cwd: '/shellfiles',  // Set working directory
        env: process.env,    // Pass environment variables
        timeout: 30000       // 30 second timeout
    }, (error, stdout, stderr) => {
        console.log('=== Script Execution Complete ===');
        console.log('Error:', error);
        console.log('Stdout:', stdout);
        console.log('Stderr:', stderr);
        console.log('=== End Debug Info ===');
        
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).send(`
                <html><body>
                    <h1>Error executing script</h1>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Exit code:</strong> ${error.code}</p>
                    <p><strong>Signal:</strong> ${error.signal}</p>
                    <p><strong>Stderr:</strong> <pre>${stderr}</pre></p>
                    <a href="javascript:history.back()">Go Back</a>
                </body></html>
            `);
        }

        res.status(200).send(`
            <html><body>
                <h1>Script executed successfully!</h1>
                <p><strong>Timestamp:</strong> ${new Date()}</p>
                <p><strong>Stdout:</strong></p>
                <pre>${stdout || 'No output'}</pre>
                ${stderr ? `<p><strong>Stderr:</strong></p><pre>${stderr}</pre>` : ''}
                <a href="javascript:history.back()">Go Back</a>
            </body></html>
        `);
    });
});

// Keep POST route for API calls if needed
app.post('/bmbg', (req, res) => {
    exec(`bash ${scriptPath}`, {
        cwd: '/shellfiles',
        env: process.env,
        timeout: 30000
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).json({ 
                message: 'Error executing script', 
                error: error.message,
                stderr: stderr
            });
        }

        console.log(`Script output: ${stdout}`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }

        res.status(200).json({ 
            message: 'Script executed successfully', 
            timestamp: new Date(),
            stdout: stdout,
            stderr: stderr
        });
    });
});

app.listen(6009, () => {
    console.log('Server is running on port 6009');
});