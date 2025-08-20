// minis.js with built-in authentication
document.addEventListener("DOMContentLoaded", () => {
    // Authentication check first
    if (!checkAuthentication()) {
        return; // Don't initialize the app if not authenticated
    }

    // Initialize the minis app
    new MinisApp();
});

// Authentication functions
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
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
        // Show loading message briefly before redirect
        const authLoading = document.getElementById("auth-loading");
        if (authLoading) {
            authLoading.style.display = "block";
        }
        
        // Hide content containers while redirecting
        const contentContainer = document.getElementById("content-container");
        if (contentContainer) {
            contentContainer.style.display = "none";
        }
        
        // Redirect after a brief delay
        setTimeout(() => {
            window.location.href = 'https://manage.beyondmebtw.com/index.html';
        }, 1000);
        return false;
    }
    
    return true;
}

class MinisApp {
    constructor() {
        this.form = document.getElementById('contentForm');
        this.textarea = document.getElementById('content');
        this.dropOverlay = document.getElementById('dropOverlay');
        this.submitBtn = document.getElementById('submitBtn');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.initializeEventListeners();
        this.createLogoutButton();
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
        // Clear cookies
        document.cookie = 'beyondme_auth=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.beyondmebtw.com';
        document.cookie = 'beyondme_auth_key=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.beyondmebtw.com';
        
        // Redirect to login page
        window.location.href = 'https://manage.beyondmebtw.com/index.html';
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const textareaContainer = this.textarea.parentElement;
        
        // Prevent default drag behaviors on the page
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });

        // Textarea drag events
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
        
        // Check if the dragged items contain files
        if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            this.textarea.parentElement.classList.add('drag-over');
            this.dropOverlay.classList.add('active');
        }
    }

    handleDragLeave(e) {
        this.preventDefaults(e);
        
        // Only hide overlay if we're leaving the textarea area completely
        if (!this.textarea.contains(e.relatedTarget) && 
            !this.dropOverlay.contains(e.relatedTarget)) {
            this.textarea.parentElement.classList.remove('drag-over');
            this.dropOverlay.classList.remove('active');
        }
    }

    async handleDrop(e) {
        this.preventDefaults(e);
        
        this.textarea.parentElement.classList.remove('drag-over');
        this.dropOverlay.classList.remove('active');

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
        } catch (error) {
            console.error('Error processing images:', error);
            this.showStatus('Error processing images. Please try again.', 'error');
        }
    }

    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const fileName = file.name;
                const altText = fileName.split('.')[0]; // Use filename without extension as alt text
                
                // Create a placeholder URL - in a real implementation, you'd upload this to your server
                const imageUrl = `uploads/${Date.now()}_${fileName}`;
                const markdownImage = `![${altText}](${imageUrl})`;
                
                // Insert the markdown image at cursor position or end of text
                const currentContent = this.textarea.value;
                const cursorPosition = this.textarea.selectionStart;
                
                const newContent = 
                    currentContent.slice(0, cursorPosition) + 
                    '\n' + markdownImage + '\n' + 
                    currentContent.slice(cursorPosition);
                
                this.textarea.value = newContent;
                
                // Move cursor after the inserted image
                const newCursorPosition = cursorPosition + markdownImage.length + 2;
                this.textarea.setSelectionRange(newCursorPosition, newCursorPosition);
                this.textarea.focus();
                
                resolve();
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            title: formData.get('title').trim(),
            tags: formData.get('tags').trim(),
            content: formData.get('content').trim()
        };

        // Validate required fields
        if (!data.title || !data.content) {
            this.showStatus('Title and content are required.', 'error');
            return;
        }

        // Process tags
        data.tags = data.tags 
            ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            : [];

        this.setLoading(true);
        this.showStatus('Creating your mini...', 'loading');

        try {
            const response = await fetch('https://minis.beyondmebtw.com/add', {
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

            this.showStatus(`Mini created successfully! Filename: ${result.filename}`, 'success');
            this.form.reset();
            
            // Optionally redirect or do something else
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
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => this.hideStatus(), 5000);
        }
    }

    hideStatus() {
        this.statusMessage.style.display = 'none';
    }
}