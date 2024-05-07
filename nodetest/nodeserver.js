const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = 6123;

app.get('/', (req, res) => {
    fetch('https://64.227.143.61:6123', {
        method: 'POST',
        body: JSON.stringify({ /* Your POST data */ }),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => {
        console.log('POST request sent');
        res.sendStatus(200);
    })
    .catch(error => {
        console.error('Error:', error);
        res.sendStatus(500);
    });
});

app.listen(port, () => {
    console.log(`Node.js server listening at http://localhost:${port}`);
});
