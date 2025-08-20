const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class MinisServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 7004;
        // Point to the domain directory for content storage
        this.contentDir = path.join('/path/to/minis.beyondmebtw.com');
        this.metadataFile = path.join(this.contentDir, 'metadata.json');

        this.setupMiddleware();
        this.ensureDirectories();
        this.setupRoutes();
    }

    async ensureDirectories() {
        try {
            await fs.access(this.contentDir);
        } catch {
            await fs.mkdir(this.contentDir, { recursive: true });
        }

        // Ensure metadata.json exists
        try {
            await fs.access(this.metadataFile);
        } catch {
            await fs.writeFile(this.metadataFile, JSON.stringify([], null, 2), 'utf8');
        }
    }

    setupMiddleware() {
        // Parse JSON bodies
        this.app.use(express.json({ limit: '10mb' }));

        // Parse URL-encoded bodies
        this.app.use(express.urlencoded({ extended: true }));

        // Add basic logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });

        // Trust proxy (important for nginx)
        this.app.set('trust proxy', 1);
    }

    generateFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `mini${year}${month}${date}${hours}${minutes}.md`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDateTime() {
        const now = new Date();
        // Format as ISO 8601 with timezone offset
        return now.toISOString().slice(0, 16) + now.toTimeString().slice(9, 15);
    }

    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading metadata:', error);
            return [];
        }
    }

    async saveMetadata(metadata) {
        try {
            await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2), 'utf8');
        } catch (error) {
            throw new Error(`Failed to save metadata: ${error.message}`);
        }
    }

    async createMini(data) {
        const { title, content, tags = [] } = data;

        if (!title || !content) {
            throw new Error('Title and content are required');
        }

        const filename = this.generateFilename();
        const id = this.generateId();
        const datetime = this.formatDateTime();

        // Create metadata object (without content)
        const metadata = {
            id,
            title,
            datetime,
            tags,
            filename
        };

        // Create markdown content with metadata header
        const markdownContent = `---
id: ${id}
title: ${title}
datetime: ${datetime}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
---

# ${title}

${content}`;

        const mdPath = path.join(this.contentDir, filename);

        try {
            // Write markdown file
            await fs.writeFile(mdPath, markdownContent, 'utf8');

            // Load existing metadata, add new entry, and save
            const existingMetadata = await this.loadMetadata();
            existingMetadata.push(metadata);
            await this.saveMetadata(existingMetadata);

            return {
                success: true,
                id,
                filename,
                metadata
            };
        } catch (error) {
            throw new Error(`Failed to create mini: ${error.message}`);
        }
    }

    setupRoutes() {
        // Serve static files (CSS, JS, images)
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Main page - serve the HTML file
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'minis.html'));
        });

        // POST /add - Create new mini
        this.app.post('/add', async (req, res) => {
            try {
                const result = await this.createMini(req.body);

                res.status(201).json({
                    message: 'Mini created successfully',
                    ...result
                });
            } catch (error) {
                console.error('Error creating mini:', error);
                res.status(400).json({
                    error: error.message
                });
            }
        });



        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'minis-backend',
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // API status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                service: 'Minis Backend',
                version: '1.0.0',
                status: 'running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // 404 handler for unknown routes
        this.app.use('*', (req, res) => {
            if (req.path.startsWith('/api') || req.accepts('json')) {
                res.status(404).json({
                    error: 'Endpoint not found',
                    path: req.path,
                    method: req.method
                });
            } else {
                // For non-API requests, redirect to main page
                res.redirect('/');
            }
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);

            const isDevelopment = process.env.NODE_ENV === 'development';

            res.status(500).json({
                error: 'Internal server error',
                message: isDevelopment ? error.message : 'Something went wrong',
                ...(isDevelopment && { stack: error.stack })
            });
        });
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`Minis server running on port ${this.port}`);
            console.log(`Server accessible at:`);
            console.log(`  - Local: http://localhost:${this.port}`);
            console.log(`  - Network: http://0.0.0.0:${this.port}`);
            console.log(`Content directory: ${this.contentDir}`);
            console.log(`Metadata file: ${this.metadataFile}`);

            // Log environment info
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Node version: ${process.version}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            process.exit(0);
        });
    }
}

// Start the server
const server = new MinisServer();
server.start();