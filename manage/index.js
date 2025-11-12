// index.js - Main application entry point
import { authSystem } from './modules/auth.js';
import { initializeIndexPage } from './modules/indexPage.js';
import { initializeManagePage } from './modules/managePage.js';

document.addEventListener("DOMContentLoaded", () => {
    // Initialize authentication system first
    window.authSystem = authSystem;
    authSystem.init();

    // Get current page info
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Initialize based on current page
    if (currentPage === 'index.html') {
        initializeIndexPage();
    } else if (currentPage === 'manage.html') {
        initializeManagePage();
    }
});
