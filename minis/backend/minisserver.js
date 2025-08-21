const express = require('express');
const fs = require('fs').promises;
const fss = require('fs'); // For synchronous operations
const path = require('path');
const { exec } = require('child_process');

class MinisServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 7004;

        // Use absolute path to ensure consistent directory location
        // Go up one level from backend folder, then into content folder
        this.contentDir = path.resolve(__dirname, '..', 'content');
        this.metadataFile = path.join(this.contentDir, 'metadata.json');

        this.setupMiddleware();
        this.ensureDirectories();
        this.setupRoutes();
    }

    async ensureDirectories() {
        try {
            // Create the full directory path if it doesn't exist
            await fs.mkdir(this.contentDir, { recursive: true });
            console.log(`Content directory ensured: ${this.contentDir}`);
        } catch (error) {
            console.error(`Error creating content directory: ${error.message}`);
            throw error;
        }

        // Ensure metadata.json exists
        try {
            await fs.access(this.metadataFile);
            console.log(`Metadata file exists: ${this.metadataFile}`);
        } catch {
            await fs.writeFile(this.metadataFile, JSON.stringify([], null, 2), 'utf8');
            console.log(`Created metadata file: ${this.metadataFile}`);
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
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
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

    formatDate() {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatTime() {
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
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

    getManageKey() {
        try {
            // First try environment variable
            let thepasskey = process.env.managekey;

            // If not found in environment, try reading from /etc/environment
            if (!thepasskey) {
                try {
                    const envContent = fss.readFileSync("/etc/environment", "utf8");
                    const managekeyLine = envContent
                        .split("\n")
                        .find((line) => line.startsWith("managekey="));

                    if (managekeyLine) {
                        thepasskey = managekeyLine.split("=")[1]?.trim();
                    }
                } catch (error) {
                    console.error('Error reading /etc/environment:', error.message);
                }
            }

            return thepasskey;
        } catch (error) {
            console.error('Error getting manage key:', error.message);
            return null;
        }
    }

    verifyPassword(providedPassword) {
        const manageKey = this.getManageKey();

        if (!manageKey) {
            console.error('Management key not found in environment or /etc/environment');
            return false;
        }

        return providedPassword === manageKey;
    }

    executeScript(callback) {
        const scriptPath = '/shellfiles/jsonupdatebmb.sh';

        // Check if script exists
        if (!fss.existsSync(scriptPath)) {
            console.error(`Script not found: ${scriptPath}`);
            return callback(new Error(`Script not found: ${scriptPath}`));
        }

        exec(`sh ${scriptPath}`, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error}`);
                return callback(error);
            }

            console.log(`Script output: ${stdout}`);
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }

            callback(null);
        });
    }

    async createMini(data) {
        const { title, content, tags = [], password } = data;

        if (!title || !content) {
            throw new Error('Title and content are required');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        // Verify password
        if (!this.verifyPassword(password)) {
            throw new Error('Invalid authentication key');
        }

        const filename = this.generateFilename();
        const id = this.generateId();
        const date = this.formatDate();
        const time = this.formatTime();

        // Create metadata object (without content)
        const metadata = {
            id,
            title,
            date,
            time,
            tags,
            filename
        };

        // Create markdown content with metadata header
        const markdownContent = `---
id: ${id}
title: ${title}
date: ${date}
time: ${time}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
---

# ${title}

${content}`;

        const mdPath = path.join(this.contentDir, filename);

        try {
            // Log where we're trying to write
            console.log(`Creating mini at: ${mdPath}`);

            // Write markdown file
            await fs.writeFile(mdPath, markdownContent, 'utf8');

            // Load existing metadata, add new entry, and save
            const existingMetadata = await this.loadMetadata();
            existingMetadata.push(metadata);
            await this.saveMetadata(existingMetadata);

            console.log(`Successfully created mini: ${filename}`);

            // Execute the script after successful creation
            return new Promise((resolve, reject) => {
                this.executeScript((scriptError) => {
                    if (scriptError) {
                        console.error('Script execution failed, but mini was created:', scriptError);
                        // Don't reject here - the mini was created successfully
                        // Just log the error and continue
                        resolve({
                            success: true,
                            id,
                            filename,
                            metadata,
                            scriptExecuted: false,
                            scriptError: scriptError.message
                        });
                    } else {
                        console.log('Script executed successfully');
                        resolve({
                            success: true,
                            id,
                            filename,
                            metadata,
                            scriptExecuted: true
                        });
                    }
                });
            });

        } catch (error) {
            console.error(`Failed to create mini: ${error.message}`);
            throw new Error(`Failed to create mini: ${error.message}`);
        }
    }

    setupRoutes() {
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'minis.html'));
        });

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

            // Check if management key is available
            const manageKey = this.getManageKey();
            if (manageKey) {
                console.log('Management key found and ready for authentication');
            } else {
                console.warn('WARNING: Management key not found - authentication will fail');
            }
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