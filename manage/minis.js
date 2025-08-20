class MinisApp {
    constructor() {
        this.form = document.getElementById('contentForm');
        this.textarea = document.getElementById('content');
        this.dropOverlay = document.getElementById('dropOverlay');
        this.submitBtn = document.getElementById('submitBtn');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.initializeEventListeners();
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MinisApp();
});