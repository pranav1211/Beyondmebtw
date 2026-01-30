// Utility functions

/**
 * Show error message to user
 */
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.add('active');
}

/**
 * Hide error message
 */
function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('active');
}

/**
 * Show loading indicator
 */
function showLoading() {
    document.getElementById('loading').classList.add('active');
    document.getElementById('outputSection').classList.remove('active');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

/**
 * Load JSON file from path
 */
async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
        }
        return await response.json();
    } catch (error) {
        throw new Error(`Error loading ${path}: ${error.message}`);
    }
}

/**
 * Format answer for display
 */
function formatAnswer(answer) {
    if (answer === null || answer === undefined) {
        return 'Not Answered';
    }
    if (Array.isArray(answer)) {
        return answer.join(', ');
    }
    return answer.toString();
}

/**
 * Validate file size
 */
function validateFileSize(file) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error('File size exceeds 50MB limit');
    }
    return true;
}

/**
 * Validate file type
 */
function validateFileType(file, allowedTypes) {
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type');
    }
    return true;
}
