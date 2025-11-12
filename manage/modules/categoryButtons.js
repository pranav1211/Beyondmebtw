// modules/categoryButtons.js - Button-based category selection

import { 
    getAllSubcategories, 
    getAllSecondaryCategories, 
    getAllSecondarySubcategories 
} from './categoryConfig.js';

// Initialize all category button groups
export function initializeCategoryButtons() {
    setupSubcategoryButtons();
    setupSecondaryCategoryButtons();
    setupSecondarySubcategoryButtons();
}

// SUBCATEGORY BUTTONS
function setupSubcategoryButtons() {
    const container = document.getElementById('subcategory-buttons');
    const hiddenField = document.getElementById('blog-subcategory');
    
    if (!container) return;
    
    const subcategories = getAllSubcategories();
    renderButtonGroup(container, subcategories, hiddenField, updateSubcategoryButtonStates);
}

export function updateSubcategoryButtonStates() {
    const container = document.getElementById('subcategory-buttons');
    const hiddenField = document.getElementById('blog-subcategory');
    updateButtonStates(container, hiddenField);
}

// SECONDARY CATEGORY BUTTONS
function setupSecondaryCategoryButtons() {
    const container = document.getElementById('secondary-category-buttons');
    const hiddenField = document.getElementById('blog-secondary-category');
    
    if (!container) return;
    
    const categories = getAllSecondaryCategories();
    renderButtonGroup(container, categories, hiddenField, updateSecondaryCategoryButtonStates);
}

export function updateSecondaryCategoryButtonStates() {
    const container = document.getElementById('secondary-category-buttons');
    const hiddenField = document.getElementById('blog-secondary-category');
    updateButtonStates(container, hiddenField);
}

// SECONDARY SUBCATEGORY BUTTONS
function setupSecondarySubcategoryButtons() {
    const container = document.getElementById('secondary-subcategory-buttons');
    const hiddenField = document.getElementById('blog-secondary-subcategory');
    
    if (!container) return;
    
    const subcategories = getAllSecondarySubcategories();
    renderButtonGroup(container, subcategories, hiddenField, updateSecondarySubcategoryButtonStates);
}

export function updateSecondarySubcategoryButtonStates() {
    const container = document.getElementById('secondary-subcategory-buttons');
    const hiddenField = document.getElementById('blog-secondary-subcategory');
    updateButtonStates(container, hiddenField);
}

// GENERIC BUTTON RENDERING
function renderButtonGroup(container, items, hiddenField, updateCallback) {
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="loading-text">No options available</p>';
        return;
    }
    
    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
        if (hiddenField) hiddenField.value = '';
        updateCallback();
    });
    
    // Add item buttons
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'category-btn';
        btn.textContent = item;
        btn.dataset.value = item;
        
        btn.addEventListener('click', () => {
            if (hiddenField) hiddenField.value = item;
            updateCallback();
        });
        
        container.appendChild(btn);
    });
    
    container.appendChild(clearBtn);
    updateCallback();
}

// GENERIC BUTTON STATE UPDATE
function updateButtonStates(container, hiddenField) {
    if (!container || !hiddenField) return;
    
    const buttons = container.querySelectorAll('.category-btn');
    const selectedValue = hiddenField.value;
    
    buttons.forEach(btn => {
        if (btn.dataset.value === selectedValue) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}
