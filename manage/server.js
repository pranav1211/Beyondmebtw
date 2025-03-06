const http = require('http');
const fs = require('fs');
const { URLSearchParams } = require('url');
const thepasskey = process.env.managekey || fs.readFileSync('/etc/environment', 'utf8').trim();

let jsdata;

fs.readFile('latest.json', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    jsdata = JSON.parse(data); // Assign data to jsdata
});

function updateData(name, date, excerpt, thumbnail) {
    jsdata.name = name;
    jsdata.date = date;
    jsdata.excerpt = excerpt;
    jsdata.thumbnail = thumbnail;

    fs.writeFile('latest.json', JSON.stringify(jsdata), 'utf8', (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Data updated successfully");
    });
}

http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/') {
        fs.readFile('index.html', 'utf8', (err, data) => {
            if (err) {
                response.statusCode = 500;
                response.end('Error loading HTML file');
                return;
            }
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(data);
        });
    } else if (request.method === 'GET' && request.url.startsWith('/latestdata')) {
        const querystring = request.url.split('?')[1];
        const parameters = new URLSearchParams(querystring);

        const name = parameters.get('name');
        const date = parameters.get('date');
        const excerpt = parameters.get('excerpt');
        const thumbnail = parameters.get('thumbnail');
        const key = parameters.get('key');

        if (key === thepasskey) {
            updateData(name, date, excerpt, thumbnail);
            response.end("Data updated successfully.");
        } else {
            response.statusCode = 403;
            response.end("Unauthorized access");
        }
    } else {
        response.statusCode = 404;
        response.end("Not Found");
    }
}).listen(7000);

console.log('Server running at http://localhost:7000/');
