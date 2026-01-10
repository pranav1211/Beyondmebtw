#!/usr/bin/env node
/**
 * Local development server for object detection demo
 * Mimics nginx configuration for beyondmebtw.com
 *
 * Usage:
 *     node server.js
 *
 * Then open http://localhost:8000 in your browser.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.onnx': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end('<h1>404 Not Found</h1><p>File: ' + filePath + '</p>', 'utf-8');
            } else {
                res.writeHead(500, {
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            const headers = {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin'
            };

            // Add cache control for ONNX models (they're large)
            if (extname === '.onnx') {
                headers['Cache-Control'] = 'public, max-age=31536000, immutable';
                console.log(`  ↳ Serving model file: ${path.basename(filePath)} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
            }

            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Object Detection Dev Server');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Local:   http://localhost:${PORT}/`);
    console.log(`  Direct:  http://localhost:${PORT}/index.html`);
    console.log('───────────────────────────────────────────────────────');
    console.log('  Press Ctrl+C to stop');
    console.log('═══════════════════════════════════════════════════════\n');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Try using a different port or stop the other server.\n`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
