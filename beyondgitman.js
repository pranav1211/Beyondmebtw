const express = require('express');
const { exec } = require('child_process');

const scriptPath = '/shellfiles/beyond.sh';

const app = express();

// Handle GET requests (when visiting in browser)
app.get('/bmbg', (req, res) => {
    exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).send(`
                <html>
                    <body>
                        <h1>Error executing script</h1>
                        <p>${error.message}</p>
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

// Keep POST route for API calls if needed
app.post('/bmbg', (req, res) => {
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

app.listen(6009, () => {
    console.log('Server is running on port 6009');
});