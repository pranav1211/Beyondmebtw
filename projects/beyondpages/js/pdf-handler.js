// PDF Handler - Handles PDF loading and text extraction using PDF.js

class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.totalPages = 0;
        this.pages = []; // Store extracted text for each page
        this.fileName = '';
        
        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    /**
     * Load PDF from file
     * @param {File} file - PDF file object
     * @returns {Promise}
     */
    async loadPDF(file) {
        this.fileName = file.name.replace('.pdf', '');
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            
            console.log(`PDF loaded: ${this.totalPages} pages`);
            return this.totalPages;
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw new Error('Failed to load PDF file');
        }
    }

    /**
     * Extract text from a specific page
     * @param {number} pageNumber - Page number (1-indexed)
     * @returns {Promise<string>}
     */
    async extractPageText(pageNumber) {
        // Return cached page if already extracted
        if (this.pages[pageNumber]) {
            return this.pages[pageNumber];
        }

        try {
            const page = await this.pdfDoc.getPage(pageNumber);
            const textContent = await page.getTextContent();
            
            // Extract text items and join them
            let pageText = '';
            let lastY = null;
            
            textContent.items.forEach((item, index) => {
                const currentY = item.transform[5];
                
                // Add paragraph breaks when Y position changes significantly
                if (lastY !== null && Math.abs(lastY - currentY) > 10) {
                    pageText += '\n\n';
                }
                
                pageText += item.str;
                
                // Add space if next item is on the same line
                if (index < textContent.items.length - 1) {
                    const nextItem = textContent.items[index + 1];
                    const nextY = nextItem.transform[5];
                    
                    if (Math.abs(currentY - nextY) < 5) {
                        pageText += ' ';
                    }
                }
                
                lastY = currentY;
            });
            
            // Clean up the text
            pageText = this.cleanText(pageText);
            
            // Cache the page
            this.pages[pageNumber] = pageText;
            
            return pageText;
        } catch (error) {
            console.error(`Error extracting page ${pageNumber}:`, error);
            return `Error loading page ${pageNumber}`;
        }
    }

    /**
     * Clean and format extracted text
     * @param {string} text - Raw text
     * @returns {string}
     */
    cleanText(text) {
        return text
            // Remove excessive whitespace
            .replace(/[ \t]+/g, ' ')
            // Normalize line breaks
            .replace(/\n{3,}/g, '\n\n')
            // Trim
            .trim();
    }

    /**
     * Get total number of pages
     * @returns {number}
     */
    getTotalPages() {
        return this.totalPages;
    }

    /**
     * Get PDF file name
     * @returns {string}
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * Preload multiple pages for better performance
     * @param {number} currentPage - Current page number
     * @param {number} lookahead - Number of pages to preload ahead
     */
    async preloadPages(currentPage, lookahead = 2) {
        const promises = [];
        
        for (let i = 1; i <= lookahead; i++) {
            const pageNum = currentPage + i;
            if (pageNum <= this.totalPages && !this.pages[pageNum]) {
                promises.push(this.extractPageText(pageNum));
            }
        }
        
        await Promise.all(promises);
    }

    /**
     * Reset the PDF handler
     */
    reset() {
        this.pdfDoc = null;
        this.totalPages = 0;
        this.pages = [];
        this.fileName = '';
    }
}

// Export for use in other modules
window.PDFHandler = PDFHandler;
