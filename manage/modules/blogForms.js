// modules/blogForms.js - Blog form handling

import { loadLatestData } from './dataLoader.js';
import { 
    initializeCategoryButtons,
    updateSubcategoryButtonStates,
    updateSecondaryCategoryButtonStates,
    updateSecondarySubcategoryButtonStates
} from './categoryButtons.js';

export function setupBlogForms() {
    const authKey = window.authSystem.getAuthKey();
    const blogForm = document.getElementById("blog-form");
    const clearBlogFormBtn = document.getElementById("clear-blog-form");

    if (!blogForm || !clearBlogFormBtn) return;

    const blogKeyField = document.getElementById("blog-key");
    if (blogKeyField) {
        blogKeyField.value = authKey;
    }

    // Initialize category buttons
    initializeCategoryButtons();

    // Handle form submission
    blogForm.addEventListener("submit", handleBlogFormSubmit);
    clearBlogFormBtn.addEventListener("click", clearBlogForm);
}

async function handleBlogFormSubmit(event) {
    event.preventDefault();

    const category = document.getElementById("blog-category").value.trim();
    const uid = document.getElementById("blog-uid").value.trim();
    const title = document.getElementById("blog-title").value.trim();
    const date = document.getElementById("blog-date").value.trim();
    const excerpt = document.getElementById("blog-excerpt").value.trim();
    const thumbnail = document.getElementById("blog-thumbnail").value.trim();
    const link = document.getElementById("blog-link").value.trim();
    const subcategory = document.getElementById("blog-subcategory").value.trim();
    const secondaryCategory = document.getElementById("blog-secondary-category").value.trim();
    const secondarySubcategory = document.getElementById("blog-secondary-subcategory").value.trim();
    const key = document.getElementById("blog-key").value.trim();
    const isNewPost = document.getElementById("is-new-post").checked;

    const requestBody = { isNewPost };

    // Only add fields that have values
    if (category) requestBody.category = category;
    if (uid) requestBody.uid = uid;
    if (title) requestBody.title = title;
    if (date) requestBody.date = date;
    if (excerpt) requestBody.excerpt = excerpt;
    if (thumbnail) requestBody.thumbnail = thumbnail;
    if (link) requestBody.link = link;
    if (subcategory) requestBody.subcategory = subcategory;
    if (secondaryCategory) requestBody.secondaryCategory = secondaryCategory;
    if (secondarySubcategory) requestBody.secondarySubcategory = secondarySubcategory;
    if (key) requestBody.key = key;

    const baseUrl = "https://manage.beyondmebtw.com/blogdata";

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error("Authentication failed. Check your password.");
            }
            throw new Error(`Server responded with status: ${response.status}`);
        }

        await response.text();
        alert(`Blog post ${isNewPost ? 'added' : 'updated'} successfully!`);
        clearBlogForm();
        loadLatestData();
    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error(error);
    }
}

function clearBlogForm() {
    const authKey = window.authSystem.getAuthKey();
    const blogForm = document.getElementById("blog-form");
    const blogKeyField = document.getElementById("blog-key");
    const titleElement = document.getElementById("blog-form-title");
    const newPostCheckbox = document.getElementById("is-new-post");

    if (blogForm) blogForm.reset();
    if (blogKeyField) blogKeyField.value = authKey;
    if (titleElement) titleElement.textContent = "Add New Blog Post";
    if (newPostCheckbox) newPostCheckbox.checked = true;

    // Clear hidden fields for button groups
    const subcategoryHidden = document.getElementById('blog-subcategory');
    const secondaryCategoryHidden = document.getElementById('blog-secondary-category');
    const secondarySubcategoryHidden = document.getElementById('blog-secondary-subcategory');

    if (subcategoryHidden) subcategoryHidden.value = '';
    if (secondaryCategoryHidden) secondaryCategoryHidden.value = '';
    if (secondarySubcategoryHidden) secondarySubcategoryHidden.value = '';

    // Update button states
    updateSubcategoryButtonStates();
    updateSecondaryCategoryButtonStates();
    updateSecondarySubcategoryButtonStates();
}
