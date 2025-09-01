// Authentication functions
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function isAuthenticated() {
    return getCookie('beyondme_auth') === "true";
}

function checkAuthentication() {
    const isLoggedIn = isAuthenticated();

    if (!isLoggedIn) {
        setTimeout(() => {
            window.location.href = 'https://manage.beyondmebtw.com/index.html';
        }, 1000);
        return false;
    }

    return true;
}

// Markdown parser for live preview (fallback if marked.js not loaded)
class MarkdownPreview {
    static parse(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks and inline code
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Line breaks and paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br>/g, '<p>');
        html = html.replace(/<br><\/p>/g, '</p>');

        // Lists
        html = html.replace(/^\* (.+)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/^\d+\. (.+)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

        // Blockquotes
        html = html.replace(/^> (.+)/gm, '<blockquote>$1</blockquote>');

        return html;
    }
}

class MinisApp {
    constructor() {
        this.form = document.getElementById('contentForm');
        this.textarea = document.getElementById('content');
        this.titleInput = document.getElementById('title');
        this.passwordInput = document.getElementById('password');
        this.previewContent = document.getElementById('previewContent');
        this.submitBtn = document.getElementById('submitBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.markedLoaded = false;

        this.initializeMarkdown();
        this.initializeEventListeners();
        this.createLogoutButton();
        this.fillPasswordFromCookie();
    }

    async initializeMarkdown() {
        try {
            await loadMarked();
            this.markedLoaded = true;
            console.log('Marked.js loaded successfully');
            // Update preview with proper markdown parsing
            this.updatePreview();
        } catch (error) {
            console.warn('Failed to load marked.js, using fallback parser:', error);
            this.markedLoaded = false;
        }
    }

    fillPasswordFromCookie() {
        const authKey = getCookie('beyondme_auth_key');
        if (authKey) {
            this.passwordInput.value = authKey;
        } else {
            this.showStatus('Authentication key not found. Please login again.', 'error');
        }
    }

    createLogoutButton() {
        if (!document.getElementById("logout-btn")) {
            const logoutBtn = document.createElement("button");
            logoutBtn.id = "logout-btn";
            logoutBtn.className = "logout-btn";
            logoutBtn.textContent = "Logout";
            logoutBtn.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        z-index: 1000;
                        transition: all 0.3s ease;
                    `;

            logoutBtn.addEventListener('mouseover', () => {
                logoutBtn.style.transform = 'translateY(-2px)';
                logoutBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            });

            logoutBtn.addEventListener('mouseout', () => {
                logoutBtn.style.transform = 'translateY(0)';
                logoutBtn.style.boxShadow = 'none';
            });

            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });

            document.body.appendChild(logoutBtn);
        }
    }

    logout() {
        document.cookie = 'beyondme_auth=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.beyondmebtw.com';
        document.cookie = 'beyondme_auth_key=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.beyondmebtw.com';
        window.location.href = 'https://manage.beyondmebtw.com/index.html';
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Live preview updates
        this.textarea.addEventListener('input', this.updatePreview.bind(this));
        this.titleInput.addEventListener('input', this.updatePreview.bind(this));

        // Initial preview update
        this.updatePreview();

        this.setupDragAndDrop();
    }

    updatePreview() {
        const title = this.titleInput.value.trim();
        const content = this.textarea.value.trim();

        if (!title && !content) {
            this.previewContent.innerHTML = `
                        <div class="preview-placeholder">
                            Type in the content area to see a live preview here...
                        </div>
                    `;
            return;
        }

        let previewHtml = '';

        if (title) {
            previewHtml += `<h1 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5em; margin-bottom: 1em;">${this.escapeHtml(title)}</h1>`;
        }

        if (content) {
            let markdownHtml;
            if (this.markedLoaded && window.marked) {
                // Use marked.js for better markdown parsing
                markdownHtml = window.marked.parse(content);
            } else {
                // Fallback to simple parser
                markdownHtml = MarkdownPreview.parse(content);
            }
            previewHtml += `<div class="markdown-preview">${markdownHtml}</div>`;
        }

        this.previewContent.innerHTML = previewHtml || `<div class="preview-placeholder">Start typing to see preview...</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.textarea.addEventListener(eventName, this.handleDragEnter.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.textarea.addEventListener(eventName, this.handleDragLeave.bind(this), false);
        });

        this.textarea.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDragEnter(e) {
        this.preventDefaults(e);
        if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            this.textarea.parentElement.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        this.preventDefaults(e);
        if (!this.textarea.contains(e.relatedTarget)) {
            this.textarea.parentElement.classList.remove('drag-over');
        }
    }

    async handleDrop(e) {
        this.preventDefaults(e);
        this.textarea.parentElement.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            this.showStatus('Please drop image files only.', 'error');
            return;
        }

        this.showStatus('Processing images...', 'loading');

        try {
            for (const file of imageFiles) {
                await this.processImageFile(file);
            }
            this.hideStatus();
            this.updatePreview(); // Update preview after adding images
        } catch (error) {
            console.error('Error processing images:', error);
            this.showStatus('Error processing images. Please try again.', 'error');
        }
    }

    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const fileName = file.name;
                const altText = fileName.split('.')[0];
                const imageUrl = `uploads/${Date.now()}_${fileName}`;
                const markdownImage = `![${altText}](${imageUrl})`;

                const currentContent = this.textarea.value;
                const cursorPosition = this.textarea.selectionStart;

                const newContent =
                    currentContent.slice(0, cursorPosition) +
                    '\n' + markdownImage + '\n' +
                    currentContent.slice(cursorPosition);

                this.textarea.value = newContent;

                const newCursorPosition = cursorPosition + markdownImage.length + 2;
                this.textarea.setSelectionRange(newCursorPosition, newCursorPosition);
                this.textarea.focus();

                resolve();
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async processMarkdownToHtml(markdown) {
        if (this.markedLoaded && window.marked) {
            // Use marked.js for better markdown parsing
            return window.marked.parse(markdown);
        } else {
            // Fallback to simple parser
            return MarkdownPreview.parse(markdown);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const rawData = {
            title: formData.get('title').trim(),
            tags: formData.get('tags').trim(),
            content: formData.get('content').trim(),
            password: formData.get('password').trim()
        };

        if (!rawData.title || !rawData.content) {
            this.showStatus('Title and content are required.', 'error');
            return;
        }

        if (!rawData.password) {
            this.showStatus('Authentication key is required.', 'error');
            return;
        }

        // Process tags
        const tags = rawData.tags
            ? rawData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            : [];

        this.setLoading(true);
        this.showStatus('Processing markdown and creating your mini...', 'loading');

        try {
            // Convert markdown to HTML on the client side
            const styledHtml = await this.processMarkdownToHtml(rawData.content);

            // Prepare data to send to server
            const data = {
                title: rawData.title,
                content: rawData.content, // Original markdown
                styledHtml: styledHtml,   // Processed HTML
                rawMarkdown: rawData.content, // Keep original markdown
                tags: tags,
                password: rawData.password
            };

            console.log('Sending data to server:', {
                title: data.title,
                contentLength: data.content.length,
                styledHtmlLength: data.styledHtml.length,
                tags: data.tags
            });

            const response = await fetch('/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create mini');
            }

            alert('New mini added successfully!');
            this.showStatus(`Mini created successfully! ID: ${result.id}`, 'success');
            this.form.reset();

            this.fillPasswordFromCookie();
            this.updatePreview(); // Reset preview

            console.log('Created mini:', result);

        } catch (error) {
            console.error('Error creating mini:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        this.submitBtn.disabled = isLoading;

        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoader = this.submitBtn.querySelector('.btn-loader');

        if (isLoading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => this.hideStatus(), 5000);
        }
    }

    hideStatus() {
        this.statusMessage.style.display = 'none';
    }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuthentication()) {
        return;
    }

    // Load marked.js before initializing the app
    try {
        await loadMarked();
        console.log('Marked.js loaded successfully');
    } catch (error) {
        console.warn('Failed to load marked.js, will use fallback parser:', error);
    }

    new MinisApp();
});