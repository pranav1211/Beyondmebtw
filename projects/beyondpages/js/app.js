/**
 * Main Application - Coordinates PDF upload and reader initialization
 */

class KindlePDFReader {
    constructor() {
        this.pdfHandler = new PDFHandler();
        this.reader = null;
        
        // Initialize DOM elements and event listeners
        this.initializeDOMElements();
        
        if (this.areElementsReady()) {
            this.initializeEventListeners();
        } else {
            console.error('Critical DOM elements not found');
        }
    }

    /**
     * Initialize DOM element references
     */
    initializeDOMElements() {
        this.uploadSection = document.getElementById('upload-section');
        this.readerSection = document.getElementById('reader-section');
        this.pdfUpload = document.getElementById('pdf-upload');
        this.backButton = document.getElementById('back-button');
        this.uploadBox = document.querySelector('.upload-box');
    }

    /**
     * Check if critical elements are available
     * @returns {boolean} True if all elements exist
     */
    areElementsReady() {
        return !!(
            this.uploadSection && 
            this.readerSection && 
            this.pdfUpload && 
            this.backButton && 
            this.uploadBox
        );
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // File upload
        this.pdfUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Back button
        this.backButton.addEventListener('click', () => this.returnToUpload());
        
        // Drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        this.uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '#667eea';
            this.uploadBox.style.backgroundColor = '#f0f4ff';
        });
        
        this.uploadBox.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '';
            this.uploadBox.style.backgroundColor = '';
        });
        
        this.uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBox.style.borderColor = '';
            this.uploadBox.style.backgroundColor = '';
            
            const files = e.dataTransfer?.files;
            if (files?.length > 0 && files[0].type === 'application/pdf') {
                this.handleFileUpload({ target: { files } });
            } else {
                alert('Please drop a valid PDF file');
            }
        });
    }

    /**
     * Handle PDF file upload
     * @param {Event} event - File input change event
     * @returns {Promise<void>}
     */
    async handleFileUpload(event) {
        const file = event.target?.files?.[0];
        
        if (!file) {
            return;
        }
        
        if (file.type !== 'application/pdf') {
            alert('Please select a valid PDF file');
            return;
        }
        
        try {
            // Show loading message
            this.showLoading('Loading PDF...');
            
            // Load PDF
            await this.pdfHandler.loadPDF(file);
            
            // Initialize reader
            this.reader = new Reader(this.pdfHandler);
            await this.reader.initialize();
            
            // Switch to reader view
            this.showReader();
            
        } catch (error) {
            console.error('Error handling file upload:', error);
            alert(`Failed to load PDF: ${error.message || 'Unknown error'}`);
            this.hideLoading();
        }
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message) {
        if (!this.uploadBox) return;
        
        this.uploadBox.innerHTML = `
            <h1>📚 Kindle PDF Reader</h1>
            <p>${this.escapeHtml(message)}</p>
            <div class="loading">Please wait...</div>
        `;
    }

    /**
     * Hide loading state and restore upload UI
     */
    hideLoading() {
        if (!this.uploadBox) return;
        
        this.uploadBox.innerHTML = `
            <h1>📚 Kindle PDF Reader</h1>
            <p>Upload a PDF to start reading</p>
            <input type="file" id="pdf-upload" accept=".pdf" />
            <label for="pdf-upload" class="upload-button">Choose PDF File</label>
            <p class="upload-hint">or drag and drop here</p>
        `;
        
        // Re-initialize DOM elements and event listeners
        this.initializeDOMElements();
        
        if (this.areElementsReady()) {
            this.initializeEventListeners();
        }
    }

    /**
     * Show reader interface
     */
    showReader() {
        if (!this.uploadSection || !this.readerSection) return;
        
        this.uploadSection.style.display = 'none';
        this.readerSection.style.display = 'flex';
    }

    /**
     * Return to upload screen
     */
    returnToUpload() {
        const confirmLeave = confirm('Are you sure you want to close this book? Your progress will be lost.');
        
        if (!confirmLeave) {
            return;
        }

        // Reset reader and PDF handler
        this.reader?.reset();
        this.pdfHandler.reset();
        
        // Switch to upload view
        if (this.readerSection && this.uploadSection) {
            this.readerSection.style.display = 'none';
            this.uploadSection.style.display = 'flex';
        }
        
        // Reset file input
        this.hideLoading();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kindleApp = new KindlePDFReader();
    console.log('Kindle PDF Reader initialized');
});
