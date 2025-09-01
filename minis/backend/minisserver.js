const express = require('express');
const fs = require('fs').promises;
const fss = require('fs'); // For synchronous operations
const path = require('path');
const { exec } = require('child_process');

class MarkdownProcessor {
    static parse(markdown) {
        let html = markdown;

        // Code blocks first (to avoid interference with other patterns)
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');

        // Headers (process from most specific to least specific)
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold and italic (process in specific order to avoid conflicts)
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\_\_\_(.*?)\_\_\_/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\_(.*?)\_/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');

        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Process lists (unordered first, then ordered)
        html = this.processUnorderedLists(html);
        html = this.processOrderedLists(html);

        // Blockquotes
        html = this.processBlockquotes(html);

        // Line breaks and paragraphs
        html = this.processParagraphs(html);

        return html;
    }

    static processUnorderedLists(html) {
        // Split by lines and process
        const lines = html.split('\n');
        const result = [];
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isListItem = /^[\s]*[\*\-\+] (.+)/.test(line);

            if (isListItem) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                const content = line.replace(/^[\s]*[\*\-\+] (.+)/, '$1');
                result.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                result.push(line);
            }
        }

        if (inList) {
            result.push('</ul>');
        }

        return result.join('\n');
    }

    static processOrderedLists(html) {
        const lines = html.split('\n');
        const result = [];
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isListItem = /^[\s]*\d+\. (.+)/.test(line);

            if (isListItem) {
                if (!inList) {
                    result.push('<ol>');
                    inList = true;
                }
                const content = line.replace(/^[\s]*\d+\. (.+)/, '$1');
                result.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    result.push('</ol>');
                    inList = false;
                }
                result.push(line);
            }
        }

        if (inList) {
            result.push('</ol>');
        }

        return result.join('\n');
    }

    static processBlockquotes(html) {
        const lines = html.split('\n');
        const result = [];
        let inBlockquote = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isBlockquote = /^> (.+)/.test(line);

            if (isBlockquote) {
                if (!inBlockquote) {
                    result.push('<blockquote>');
                    inBlockquote = true;
                }
                const content = line.replace(/^> (.+)/, '$1');
                result.push(content);
            } else {
                if (inBlockquote) {
                    result.push('</blockquote>');
                    inBlockquote = false;
                }
                result.push(line);
            }
        }

        if (inBlockquote) {
            result.push('</blockquote>');
        }

        return result.join('\n');
    }

    static processParagraphs(html) {
        // Split by double line breaks to identify paragraphs
        const sections = html.split('\n\n');
        const processedSections = [];

        for (let section of sections) {
            section = section.trim();
            if (!section) continue;

            // Check if this section is already wrapped in HTML tags
            const isAlreadyWrapped = /^<(h[1-6]|ul|ol|blockquote|pre|hr|div)[\s>]/.test(section) || 
                                   /^<\/(h[1-6]|ul|ol|blockquote|pre|hr|div)>$/.test(section) ||
                                   section === '<hr>';

            if (isAlreadyWrapped) {
                processedSections.push(section);
            } else {
                // Convert single line breaks to <br> within paragraphs
                const withBreaks = section.replace(/\n/g, '<br>');
                processedSections.push(`<p>${withBreaks}</p>`);
            }
        }

        return processedSections.join('\n\n');
    }
}

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

    generateId() {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `mini${day}${month}${year}${hours}${minutes}`;
    }

    formatDate() {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatTime() {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
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

        const id = this.generateId();
        const date = this.formatDate();
        const time = this.formatTime();

        // Process markdown to HTML on the server
        const styledHtml = MarkdownProcessor.parse(content);

        // Create folder structure and HTML file
        await this.createHtmlFile(date, title, styledHtml, { id, title, date, time, tags });

        // Create metadata object
        const metadata = {
            id,
            title,
            date,
            time,
            tags,
            content: styledHtml,
            rawMarkdown: content
        };

        try {
            console.log(`Creating mini with ID: ${id}`);

            // Load existing metadata, add new entry, and save
            const existingMetadata = await this.loadMetadata();
            existingMetadata.push(metadata);
            await this.saveMetadata(existingMetadata);

            console.log(`Successfully created mini: ${id}`);

            // Execute the script after successful creation
            return new Promise((resolve, reject) => {
                this.executeScript((scriptError) => {
                    if (scriptError) {
                        console.error('Script execution failed, but mini was created:', scriptError);
                        resolve({
                            success: true,
                            id,
                            metadata,
                            scriptExecuted: false,
                            scriptError: scriptError.message
                        });
                    } else {
                        console.log('Script executed successfully');
                        resolve({
                            success: true,
                            id,
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

    async createHtmlFile(date, title, htmlContent, postData) {
        // Create date folder name in format like "jan-01-2025"
        const dateObj = new Date(date);
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames[dateObj.getMonth()];
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = dateObj.getFullYear();
        const dateFolderName = `${month}-${day}-${year}`;

        // Sanitize title for folder name
        const sanitizedTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();

        // Create folder structure
        const dateFolderPath = path.join(this.contentDir, dateFolderName);
        const titleFolderPath = path.join(dateFolderPath, sanitizedTitle);
        const htmlFilePath = path.join(titleFolderPath, 'index.html');

        try {
            // Create directories
            await fs.mkdir(titleFolderPath, { recursive: true });

            // Add some basic styling to the HTML content
            const styledContent = `
                <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
                    <style>
                        h1, h2, h3, h4, h5, h6 {
                            color: #1f2937;
                            margin-top: 1.5em;
                            margin-bottom: 0.5em;
                        }
                        h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5em; }
                        h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
                        code {
                            background-color: #f3f4f6;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                            font-size: 0.9em;
                        }
                        pre {
                            background-color: #1f2937;
                            color: #f9fafb;
                            padding: 16px;
                            border-radius: 8px;
                            overflow-x: auto;
                            margin: 1em 0;
                        }
                        pre code {
                            background: none;
                            padding: 0;
                            color: inherit;
                        }
                        blockquote {
                            border-left: 4px solid #e5e7eb;
                            padding-left: 16px;
                            margin: 1em 0;
                            color: #6b7280;
                            font-style: italic;
                        }
                        ul, ol {
                            padding-left: 20px;
                            margin: 1em 0;
                        }
                        li {
                            margin: 0.5em 0;
                        }
                        hr {
                            border: none;
                            border-top: 2px solid #e5e7eb;
                            margin: 2em 0;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 8px;
                            margin: 1em 0;
                        }
                        a {
                            color: #3b82f6;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        del {
                            color: #6b7280;
                        }
                        p {
                            margin: 1em 0;
                        }
                    </style>
                    ${htmlContent}
                </div>`;

            // Create HTML file content
            const htmlFileContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(postData.title)} | Minis</title>
    <meta name="description" content="Mini post: ${this.escapeHtml(postData.title)}">
    <meta name="author" content="Beyond Me Btw">
    <meta property="og:title" content="${this.escapeHtml(postData.title)}">
    <meta property="og:type" content="article">
    <meta name="article:published_time" content="${postData.date}T${postData.time}:00+05:30">
</head>
<body>
    ${styledContent}
</body>
</html>`;

            // Write HTML file
            await fs.writeFile(htmlFilePath, htmlFileContent, 'utf8');

            console.log(`HTML file created: ${htmlFilePath}`);

        } catch (error) {
            console.error(`Error creating HTML file: ${error.message}`);
            throw new Error(`Failed to create HTML file: ${error.message}`);
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    setupRoutes() {
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'minis.html'));
        });

        this.app.post('/add', async (req, res) => {
            // Ensure we always return JSON
            res.setHeader('Content-Type', 'application/json');

            try {
                console.log('Received POST /add request');
                console.log('Request body keys:', Object.keys(req.body));
                console.log('Content length:', req.body.content ? req.body.content.length : 'N/A');

                const result = await this.createMini(req.body);

                res.status(201).json({
                    message: 'Mini created successfully',
                    ...result
                });
            } catch (error) {
                console.error('Error creating mini:', error);

                // Always return JSON error response
                res.status(400).json({
                    error: error.message || 'Failed to create mini',
                    success: false
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