/**
 * Reader - Manages the reading interface and text display
 */

class Reader {
    constructor(pdfHandler) {
        this.pdfHandler = pdfHandler;
        
        // DOM Elements
        this.pageText = document.getElementById('pageText');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.bookTitle = document.getElementById('bookTitle');
        this.readingContainer = document.getElementById('readingContainer');
    }

    /**
     * Initialize reader with PDF
     * @param {string} fileName - Name of the PDF file
     */
    async initialize(fileName) {
        this.updateBookTitle(fileName);
        await this.displayCurrentPage();
        this.updateNavigation();
    }

    /**
     * Display the current page text
     */
    async displayCurrentPage() {
        try {
            const text = await this.pdfHandler.extractPageText(
                this.pdfHandler.currentPage
            );
            
            this.renderText(text);
            this.updatePageInfo();
            this.scrollToTop();
        } catch (error) {
            console.error('Error displaying page:', error);
            this.renderError('Failed to load page content');
        }
    }

    /**
     * Render text content with basic formatting
     * @param {string} text - Text to render
     */
    renderText(text) {
        if (!text || text.trim() === '') {
            this.renderEmpty();
            return;
        }

        // Split into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        
        // Build HTML
        let html = '';
        paragraphs.forEach(para => {
            para = para.trim();
            if (para) {
                // Simple heuristic for headings (all caps, short)
                if (para === para.toUpperCase() && para.length < 100 && para.split(' ').length < 10) {
                    html += `<h2>${this.escapeHtml(para)}</h2>`;
                } else {
                    html += `<p>${this.escapeHtml(para)}</p>`;
                }
            }
        });

        this.pageText.innerHTML = html;
        this.pageText.classList.remove('empty');
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        this.pageText.innerHTML = '<p class="empty">This page appears to be empty</p>';
        this.pageText.classList.add('empty');
    }

    /**
     * Render error message
     * @param {string} message - Error message
     */
    renderError(message) {
        this.pageText.innerHTML = `<p class="empty">${this.escapeHtml(message)}</p>`;
        this.pageText.classList.add('empty');
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update page information display
     */
    updatePageInfo() {
        const info = this.pdfHandler.getCurrentPageInfo();
        this.currentPageSpan.textContent = info.currentPage;
        this.totalPagesSpan.textContent = info.totalPages;
    }

    /**
     * Update navigation button states
     */
    updateNavigation() {
        const info = this.pdfHandler.getCurrentPageInfo();
        this.prevBtn.disabled = !info.hasPrevious;
        this.nextBtn.disabled = !info.hasNext;
    }

    /**
     * Navigate to next page
     */
    async nextPage() {
        const result = await this.pdfHandler.nextPage();
        if (result) {
            this.renderText(result.text);
            this.updatePageInfo();
            this.updateNavigation();
            this.scrollToTop();
        }
    }

    /**
     * Navigate to previous page
     */
    async previousPage() {
        const result = await this.pdfHandler.previousPage();
        if (result) {
            this.renderText(result.text);
            this.updatePageInfo();
            this.updateNavigation();
            this.scrollToTop();
        }
    }

    /**
     * Go to specific page
     * @param {number} pageNumber - Target page number
     */
    async goToPage(pageNumber) {
        const result = await this.pdfHandler.goToPage(pageNumber);
        if (result) {
            this.renderText(result.text);
            this.updatePageInfo();
            this.updateNavigation();
            this.scrollToTop();
        }
    }

    /**
     * Update book title
     * @param {string} fileName - File name
     */
    updateBookTitle(fileName) {
        // Remove .pdf extension and clean up
        const title = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        this.bookTitle.textContent = title;
    }

    /**
     * Scroll reading container to top
     */
    scrollToTop() {
        this.readingContainer.scrollTop = 0;
    }

    /**
     * Clear reader state
     */
    clear() {
        this.pageText.innerHTML = '';
        this.currentPageSpan.textContent = '1';
        this.totalPagesSpan.textContent = '1';
        this.bookTitle.textContent = 'Document';
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
    }
}
