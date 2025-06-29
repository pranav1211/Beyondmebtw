const express = require('express');
const { exec } = require('child_process');

const scriptPath = '/shellfiles/beyond.sh';

const app = express();

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
