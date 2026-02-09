/**
 * Main Application - Coordinates PDF loading and reading interface
 */

class KindlePDFReader {
    constructor() {
        // Initialize modules
        this.pdfHandler = new PDFHandler();
        this.reader = new Reader(this.pdfHandler);
        
        // DOM Elements
        this.uploadScreen = document.getElementById('uploadScreen');
        this.readingScreen = document.getElementById('readingScreen');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.backBtn = document.getElementById('backBtn');
        
        // State
        this.currentFile = null;
        
        this.initializeEventListeners();
    }

    /**
     * Set up all event listeners
     */
    initializeEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.handleFileUpload(file);
            } else {
                this.showError('Please upload a valid PDF file');
            }
        });

        // Navigation events
        this.reader.prevBtn.addEventListener('click', () => {
            this.reader.previousPage();
        });

        this.reader.nextBtn.addEventListener('click', () => {
            this.reader.nextPage();
        });

        // Back button
        this.backBtn.addEventListener('click', () => {
            this.returnToUpload();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.readingScreen.classList.contains('active')) {
                this.handleKeyPress(e);
            }
        });
    }

    /**
     * Handle file upload
     * @param {File} file - PDF file
     */
    async handleFileUpload(file) {
        if (file.type !== 'application/pdf') {
            this.showError('Please select a PDF file');
            return;
        }

        this.currentFile = file;
        this.showLoading(true);

        try {
            // Load the PDF
            await this.pdfHandler.loadPDF(file);
            
            // Initialize reader
            await this.reader.initialize(file.name);
            
            // Switch to reading screen
            this.showReadingScreen();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError(error.message || 'Failed to load PDF');
            this.showLoading(false);
        }
    }

    /**
     * Show/hide loading overlay
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        alert(message); // Simple for now, can be improved in later phases
    }

    /**
     * Switch to reading screen
     */
    showReadingScreen() {
        this.uploadScreen.classList.remove('active');
        this.readingScreen.classList.add('active');
    }

    /**
     * Return to upload screen
     */
    returnToUpload() {
        if (confirm('Are you sure you want to close this document?')) {
            this.readingScreen.classList.remove('active');
            this.uploadScreen.classList.add('active');
            
            // Clear state
            this.pdfHandler.clear();
            this.reader.clear();
            this.fileInput.value = '';
            this.currentFile = null;
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                if (!this.reader.prevBtn.disabled) {
                    this.reader.previousPage();
                }
                break;
                
            case 'ArrowRight':
            case 'PageDown':
            case ' ': // Space bar
                e.preventDefault();
                if (!this.reader.nextBtn.disabled) {
                    this.reader.nextPage();
                }
                break;
                
            case 'Home':
                e.preventDefault();
                this.reader.goToPage(1);
                break;
                
            case 'End':
                e.preventDefault();
                this.reader.goToPage(this.pdfHandler.totalPages);
                break;
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new KindlePDFReader();
    console.log('Kindle PDF Reader initialized');
});
