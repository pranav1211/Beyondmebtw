// modules/managePage.js - Manage page initialization
import { loadLatestData } from './dataLoader.js';
import { setupContentForms } from './contentForms.js';
import { setupBlogForms } from './blogForms.js';

export function initializeManagePage() {
    const contentContainer = document.getElementById("content-container");
    const authLoading = document.getElementById("auth-loading");

    // Hide loading message and show content
    if (authLoading) authLoading.style.display = "none";
    if (contentContainer) contentContainer.style.display = "block";

    // Set up forms
    setupContentForms();
    setupBlogForms();

    // Load and display data
    loadLatestData();
    
    // Create logout button
    createLogoutButton();
}

function createLogoutButton() {
    const logoutContainer = document.getElementById("logout-container") ||
                           document.querySelector("header") ||
                           document.querySelector(".nav-bar") ||
                           document.body;

    if (!document.getElementById("logout-btn")) {
        const logoutBtn = document.createElement("button");
        logoutBtn.id = "logout-btn";
        logoutBtn.className = "logout-btn";
        logoutBtn.textContent = "Logout";
        logoutContainer.appendChild(logoutBtn);
    }
}
