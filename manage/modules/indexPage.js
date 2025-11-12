// modules/indexPage.js - Index page initialization
import { loadLatestData } from './dataLoader.js';

export function initializeIndexPage() {
    // Set up authentication for index page
    window.authSystem.setupIndexPageAuth();
    
    // Load data for display (public data, no auth needed)
    loadLatestData();
}
