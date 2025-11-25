const express = require('express');
const fs = require('fs').promises;
const fss = require('fs'); // For synchronous operations
const path = require('path');
const { exec } = require('child_process');

// Simple markdown to HTML parser
class MarkdownParser {
    static parse(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Horizontal rules - add this before other formatting
        html = html.replace(/^---+$/gm, '<hr>');

        // Bold and italic with nesting support
        html = this.parseNestedFormatting(html);

        // Code blocks and inline code
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Line breaks and paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br>/g, '<p>');
        html = html.replace(/<br><\/p>/g, '</p>');

        // Lists - Fixed regex patterns
        // Process unordered lists
        const lines = html.split('<br>');
        let inUl = false;
        let inOl = false;
        const processedLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for unordered list item
            if (line.match(/^\* (.+)/)) {
                if (!inUl) {
                    if (inOl) {
                        processedLines.push('</ol>');
                        inOl = false;
                    }
                    processedLines.push('<ul>');
                    inUl = true;
                }
                processedLines.push(line.replace(/^\* (.+)/, '<li>$1</li>'));
            }
            // Check for ordered list item
            else if (line.match(/^\d+\. (.+)/)) {
                if (!inOl) {
                    if (inUl) {
                        processedLines.push('</ul>');
                        inUl = false;
                    }
                    processedLines.push('<ol>');
                    inOl = true;
                }
                processedLines.push(line.replace(/^\d+\. (.+)/, '<li>$1</li>'));
            }
            // Regular line
            else {
                if (inUl) {
                    processedLines.push('</ul>');
                    inUl = false;
                }
                if (inOl) {
                    processedLines.push('</ol>');
                    inOl = false;
                }
                processedLines.push(line);
            }
        }

        // Close any remaining lists
        if (inUl) processedLines.push('</ul>');
        if (inOl) processedLines.push('</ol>');

        html = processedLines.join('<br>');

        // Blockquotes
        html = html.replace(/^> (.+)/gm, '<blockquote>$1</blockquote>');

        return html;
    }

    // Add this new method to handle nested formatting
    static parseNestedFormatting(text) {
        // Split text into segments, preserving code blocks and inline code
        const segments = [];
        let current = '';
        let inCodeBlock = false;
        let inInlineCode = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const next3 = text.slice(i, i + 3);

            if (next3 === '```' && !inInlineCode) {
                if (current) segments.push({ text: current, isCode: inCodeBlock });
                current = '';
                inCodeBlock = !inCodeBlock;
                segments.push({ text: next3, isCode: true });
                i += 2; // Skip next 2 characters
            } else if (char === '`' && !inCodeBlock) {
                if (current) segments.push({ text: current, isCode: inInlineCode });
                current = '';
                inInlineCode = !inInlineCode;
                segments.push({ text: char, isCode: true });
            } else {
                current += char;
            }
        }

        if (current) segments.push({ text: current, isCode: inCodeBlock || inInlineCode });

        // Process non-code segments for formatting
        return segments.map(segment => {
            if (segment.isCode) {
                return segment.text;
            }
            return this.processFormattingInSegment(segment.text);
        }).join('');
    }

    // Process bold/italic formatting in a text segment
    static processFormattingInSegment(text) {
        // Use a stack-based approach to handle nesting
        let result = '';
        let i = 0;

        while (i < text.length) {
            if (text[i] === '*') {
                // Count consecutive asterisks
                let asteriskCount = 0;
                let j = i;
                while (j < text.length && text[j] === '*') {
                    asteriskCount++;
                    j++;
                }

                // Find the matching closing asterisks
                const matchResult = this.findMatchingAsterisks(text, i, asteriskCount);

                if (matchResult) {
                    const { endIndex, matchingCount } = matchResult;
                    const content = text.slice(i + asteriskCount, endIndex);

                    if (matchingCount === 3) {
                        // Bold + Italic
                        result += `<strong><em>${this.processFormattingInSegment(content)}</em></strong>`;
                    } else if (matchingCount === 2) {
                        // Bold
                        result += `<strong>${this.processFormattingInSegment(content)}</strong>`;
                    } else if (matchingCount === 1) {
                        // Italic
                        result += `<em>${this.processFormattingInSegment(content)}</em>`;
                    }

                    i = endIndex + matchingCount;
                } else {
                    // No matching asterisks found, treat as literal
                    result += text[i];
                    i++;
                }
            } else {
                result += text[i];
                i++;
            }
        }

        return result;
    }

    // Helper method to find matching asterisks
    static findMatchingAsterisks(text, startIndex, count) {
        let i = startIndex + count;

        while (i < text.length) {
            if (text[i] === '*') {
                let asteriskCount = 0;
                let j = i;
                while (j < text.length && text[j] === '*') {
                    asteriskCount++;
                    j++;
                }

                // Check if this matches our opening count
                if (asteriskCount >= count) {
                    return {
                        endIndex: i,
                        matchingCount: count
                    };
                }

                i = j;
            } else {
                i++;
            }
        }

        return null;
    }

    static addDefaultStyling(html) {
        const styledHtml = `
        <div class="markdown-content" style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
        ">
            <style>
                .markdown-content h1 { font-size: 2em; margin: 0.67em 0; font-weight: bold; }
                .markdown-content h2 { font-size: 1.5em; margin: 0.75em 0; font-weight: bold; }
                .markdown-content h3 { font-size: 1.17em; margin: 0.83em 0; font-weight: bold; }
                .markdown-content p { margin: 1em 0; }
                .markdown-content ul, .markdown-content ol { margin: 1em 0; padding-left: 2em; }
                .markdown-content li { margin: 0.5em 0; }
                .markdown-content blockquote { 
                    margin: 1em 0; 
                    padding: 0.5em 1em; 
                    border-left: 4px solid #ddd; 
                    background: #f9f9f9; 
                    font-style: italic; 
                }
                .markdown-content code { 
                    background: #f4f4f4; 
                    padding: 0.2em 0.4em; 
                    border-radius: 3px; 
                    font-family: 'SF Mono', Monaco, monospace; 
                }
                .markdown-content pre { 
                    background: #f4f4f4; 
                    padding: 1em; 
                    border-radius: 6px; 
                    overflow-x: auto; 
                }
                .markdown-content pre code { 
                    background: none; 
                    padding: 0; 
                }
                .markdown-content a { 
                    color: #0066cc; 
                    text-decoration: none; 
                }
                .markdown-content a:hover { 
                    text-decoration: underline; 
                }
                .markdown-content img { 
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 6px; 
                }
            </style>
            ${html}
        </div>`;

        return styledHtml;
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

        return `mini${day}${month}${year}`;
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
        try {
            console.log('Creating mini with data:', { title: data.title, hasContent: !!data.content, hasTags: !!data.tags });

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

            console.log(`Generated ID: ${id}, Date: ${date}, Time: ${time}`);

            // Convert markdown content to HTML (just the core content, no styling wrapper)
            const coreHtml = MarkdownParser.parse(content);

            // For the HTML file, we still want the full styled version
            const styledHtml = MarkdownParser.addDefaultStyling(coreHtml);

            console.log('Markdown parsed successfully');

            // Create folder structure and HTML file (with styled version)
            await this.createHtmlFile(date, title, styledHtml, { id, title, date, time, tags });

            console.log('HTML file created successfully');

            // Create metadata object (now with just core HTML content, no wrapper/styling)
            const metadata = {
                id,
                title,
                date,
                time,
                tags,
                content: coreHtml,        // Store only the core HTML without wrapper div and styling
                rawMarkdown: content      // Keep original markdown for editing if needed
            };

            // Load existing metadata, add new entry, and save
            const existingMetadata = await this.loadMetadata();
            existingMetadata.push(metadata);
            await this.saveMetadata(existingMetadata);

            console.log(`Successfully saved metadata for mini: ${id}`);

            // Execute the script after successful creation
            const scriptResult = await new Promise((resolve) => {
                this.executeScript((scriptError) => {
                    if (scriptError) {
                        console.error('Script execution failed, but mini was created:', scriptError);
                        resolve({
                            scriptExecuted: false,
                            scriptError: scriptError.message
                        });
                    } else {
                        console.log('Script executed successfully');
                        resolve({
                            scriptExecuted: true
                        });
                    }
                });
            });

            return {
                success: true,
                id,
                metadata,
                ...scriptResult
            };

        } catch (error) {
            console.error(`Failed to create mini: ${error.message}`);
            console.error('Full error:', error);
            throw error; // Re-throw to be caught by route handler
        }
    }

    async createHtmlFile(date, title, htmlContent, postData) {
        try {
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

            console.log(`Creating HTML file at: ${htmlFilePath}`);

            // Create directories
            await fs.mkdir(titleFolderPath, { recursive: true });

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
    ${htmlContent}
</body>
</html>`;

            // Write HTML file
            await fs.writeFile(htmlFilePath, htmlFileContent, 'utf8');

            console.log(`HTML file created successfully: ${htmlFilePath}`);

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
            try {
                console.log('Received POST /add request');
                console.log('Request body keys:', Object.keys(req.body));

                const result = await this.createMini(req.body);

                console.log('Mini creation result:', {
                    success: result.success,
                    id: result.id,
                    scriptExecuted: result.scriptExecuted
                });

                res.status(201).json({
                    message: 'Mini created successfully',
                    ...result
                });
            } catch (error) {
                console.error('Error in POST /add route:', error);
                res.status(400).json({
                    error: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        });

        // Health check route
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                contentDir: this.contentDir,
                metadataExists: fss.existsSync(this.metadataFile)
            });
        });

        // 404 handler for unknown routes
        this.app.use((req, res) => {
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