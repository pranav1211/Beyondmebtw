// Main Application Logic

// Global variables
let responsePdfFile = null;
let answerKeyData = null;
let calculatedResults = null;

// DOM elements
const responsePdf = document.getElementById('responsePdf');
const uploadArea = document.getElementById('uploadArea');
const responseFileName = document.getElementById('responseFileName');
const calculateBtn = document.getElementById('calculateBtn');
const downloadBtn = document.getElementById('downloadBtn');

/**
 * Initialize the application
 */
async function init() {
    try {
        // Load answer key
        answerKeyData = await loadJSON(CONFIG.ANSWER_KEY_PATH);
        console.log('Answer key loaded successfully');
    } catch (error) {
        showError('Failed to load answer key. Please refresh the page.');
        console.error(error);
    }
    
    setupEventListeners();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // File input change
    responsePdf.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => responsePdf.click());
    
    // Calculate button
    calculateBtn.addEventListener('click', handleCalculate);
    
    // Download button
    downloadBtn.addEventListener('click', handleDownload);
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const contentWrapper = document.getElementById('contentWrapper');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Sidebar navigation - smooth scroll
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Update active state
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('show');
                }
            }
        });
    });
    
    // Update active nav on scroll
    window.addEventListener('scroll', updateActiveNav);
}

/**
 * Update active navigation based on scroll position
 */
function updateActiveNav() {
    const sections = document.querySelectorAll('[id^="section-"], #upload-section, #score-summary, #section-breakdown');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= (sectionTop - 200)) {
            currentSection = section.getAttribute('id');
        }
    });
    
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    processFile(file);
}

/**
 * Handle drag over event
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.add('drag-over');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

/**
 * Handle drop event
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    processFile(file);
}

/**
 * Process uploaded file
 */
function processFile(file) {
    if (!file) return;
    
    try {
        // Validate file type
        if (file.type !== 'application/pdf') {
            throw new Error('Please select a valid PDF file');
        }
        
        // Validate file size
        validateFileSize(file);
        
        // Store file and update UI
        responsePdfFile = file;
        responseFileName.textContent = `Selected: ${file.name}`;
        calculateBtn.disabled = false;
        hideError();
        
    } catch (error) {
        showError(error.message);
        responsePdfFile = null;
        calculateBtn.disabled = true;
    }
}

/**
 * Handle calculate button click
 */
async function handleCalculate() {
    if (!responsePdfFile || !answerKeyData) return;
    
    showLoading();
    hideError();
    
    try {
        // Extract text from PDF
        const extractedText = await extractTextFromPDF(responsePdfFile);
        
        // Parse the extracted text
        const userResponses = parseQuestionPaper(extractedText);
        
        // Calculate scores
        calculatedResults = calculateScore(userResponses, answerKeyData);
        
        // Display results
        displayResults(calculatedResults);
        
        // Enable download button
        downloadBtn.disabled = false;
        
    } catch (error) {
        showError(`Error processing file: ${error.message}`);
        console.error(error);
    } finally {
        hideLoading();
    }
}

/**
 * Handle download button click
 */
function handleDownload() {
    if (!calculatedResults) return;
    
    try {
        generateResultsPDF(calculatedResults);
    } catch (error) {
        showError(`Error generating PDF: ${error.message}`);
        console.error(error);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
