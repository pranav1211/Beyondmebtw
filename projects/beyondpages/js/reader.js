/**
 * Reader - Manages the reading interface and page navigation
 */

class Reader {
    constructor(pdfHandler) {
        this.pdfHandler = pdfHandler;
        this.currentPage = 1;
        
        // DOM elements - get references
        this.pageContent = document.getElementById('page-content');
        this.currentPageSpan = document.getElementById('current-page');
        this.totalPagesSpan = document.getElementById('total-pages');
        this.progressFill = document.getElementById('progress-fill');
        this.prevButton = document.getElementById('prev-page');
        this.nextButton = document.getElementById('next-page');
        this.bookTitle = document.getElementById('book-title');
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Verify elements exist
        if (!this.prevButton || !this.nextButton) {
            console.error('Navigation buttons not found');
            return;
        }

        // Navigation buttons
        this.prevButton.addEventListener('click', () => this.goToPreviousPage());
        this.nextButton.addEventListener('click', () => this.goToNextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle keys when reader is visible
            const readerSection = document.getElementById('reader-section');
            if (readerSection?.style.display === 'flex') {
                if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                    e.preventDefault();
                    this.goToPreviousPage();
                } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                    e.preventDefault();
                    this.goToNextPage();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    this.loadPage(1);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    this.loadPage(this.pdfHandler.getTotalPages());
                }
            }
        });
    }

    /**
     * Initialize reader with PDF
     * @returns {Promise<void>}
     */
    async initialize() {
        const totalPages = this.pdfHandler.getTotalPages();
        const fileName = this.pdfHandler.getFileName();
        
        // Update UI
        if (this.bookTitle) {
            this.bookTitle.textContent = fileName;
        }
        
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = totalPages.toString();
        }
        
        // Load first page
        await this.loadPage(1);
        
        // Preload next pages
        await this.pdfHandler.preloadPages(1);
    }

    /**
     * Load and display a specific page
     * @param {number} pageNumber - Page number to load
     * @returns {Promise<void>}
     */
    async loadPage(pageNumber) {
        // Validate page number
        const totalPages = this.pdfHandler.getTotalPages();
        if (pageNumber < 1 || pageNumber > totalPages) {
            return;
        }

        // Show loading state
        if (this.pageContent) {
            this.pageContent.innerHTML = '<div class="loading">Loading page...</div>';
        }
        
        try {
            // Extract and display page text
            const pageText = await this.pdfHandler.extractPageText(pageNumber);
            this.displayPageText(pageText);
            
            // Update current page
            this.currentPage = pageNumber;
            this.updateUI();
            
            // Preload adjacent pages in background
            this.pdfHandler.preloadPages(pageNumber).catch(err => {
                console.warn('Preload failed:', err);
            });
            
            // Scroll to top
            const readingArea = document.querySelector('.reading-area');
            if (readingArea) {
                readingArea.scrollTop = 0;
            }
        } catch (error) {
            console.error('Error loading page:', error);
            if (this.pageContent) {
                this.pageContent.innerHTML = '<div class="loading">Error loading page. Please try again.</div>';
            }
        }
    }

    /**
     * Display page text with proper formatting
     * @param {string} text - Text content to display
     */
    displayPageText(text) {
        if (!this.pageContent) return;

        // Split text into paragraphs
        const paragraphs = text
            .split('\n\n')
            .filter(p => p.trim().length > 0);
        
        // Create paragraph elements
        const html = paragraphs.length > 0
            ? paragraphs.map(para => {
                const cleaned = para.trim().replace(/\n/g, ' ');
                return `<p>${this.escapeHtml(cleaned)}</p>`;
            }).join('')
            : '<p>No text content found on this page.</p>';
        
        this.pageContent.innerHTML = html;
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

    /**
     * Go to previous page
     * @returns {Promise<void>}
     */
    async goToPreviousPage() {
        if (this.currentPage > 1) {
            await this.loadPage(this.currentPage - 1);
        }
    }

    /**
     * Go to next page
     * @returns {Promise<void>}
     */
    async goToNextPage() {
        if (this.currentPage < this.pdfHandler.getTotalPages()) {
            await this.loadPage(this.currentPage + 1);
        }
    }

    /**
     * Update UI elements (page numbers, progress, buttons)
     */
    updateUI() {
        const totalPages = this.pdfHandler.getTotalPages();
        
        // Update page numbers
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = this.currentPage.toString();
        }
        
        // Update progress bar
        if (this.progressFill) {
            const progress = (this.currentPage / totalPages) * 100;
            this.progressFill.style.width = `${progress}%`;
        }
        
        // Update button states
        if (this.prevButton) {
            this.prevButton.disabled = this.currentPage === 1;
        }
        
        if (this.nextButton) {
            this.nextButton.disabled = this.currentPage === totalPages;
        }
    }

    /**
     * Reset reader state
     */
    reset() {
        this.currentPage = 1;
        
        if (this.pageContent) {
            this.pageContent.innerHTML = '<div class="loading">Loading page...</div>';
        }
        
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = '1';
        }
        
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = '1';
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
        }
    }
}

// Make available globally
window.Reader = Reader;
