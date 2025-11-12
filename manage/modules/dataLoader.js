// modules/dataLoader.js - Data loading and display

import { CATEGORY_CONFIG } from './categoryConfig.js';

export function loadLatestData() {
    fetch('latest.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch latest.json: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            displayCurrentData(data);
            createFeaturedPostsForms(data.featured);
            loadBlogPostsFromData(data);
            window.authSystem.fillPasswordFields();
        })
        .catch((error) => {
            console.error('Error loading latest.json:', error);
        });
}

function displayCurrentData(data) {
    displayLatestPost(data.mainPost);
}

function displayLatestPost(mainPost) {
    const container = document.getElementById('latest-display');
    if (!container || !mainPost) return;

    const formattedDate = new Date(mainPost.date).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });

    container.innerHTML = `
        <div class="post-preview">
            <img src="${mainPost.thumbnail}" alt="${mainPost.title}" onerror="this.style.display='none'">
            <h3>${mainPost.title}</h3>
            <p class="date">${formattedDate}</p>
            <p class="excerpt">${mainPost.excerpt}</p>
            <a href="${mainPost.link}" target="_blank">View Post</a>
        </div>
    `;
}

function createFeaturedPostsForms(featuredPosts = []) {
    const container = document.getElementById('featured-posts-container');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        const post = featuredPosts[i] || {};
        const formattedDate = post.date ? new Date(post.date).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }) : '';

        const formHTML = `
            <form id="featured${i + 1}" class="content-form">
                <h2>Featured Post ${i + 1}</h2>
                
                <div class="current-data">
                    ${post.title ? `
                        <div class="post-preview">
                            <img src="${post.thumbnail}" alt="${post.title}" onerror="this.style.display='none'">
                            <h4>${post.title}</h4>
                            <p class="date">${formattedDate}</p>
                            <p class="excerpt">${post.excerpt}</p>
                            <a href="${post.link}" target="_blank">View Post</a>
                        </div>
                    ` : '<p class="no-content">No post assigned</p>'}
                </div>
                
                <input type="hidden" name="instance" value="featured${i + 1}">
                
                <label for="name-featured${i + 1}">Post Name:</label>
                <input type="text" id="name-featured${i + 1}" name="name">
                
                <label for="date-featured${i + 1}">Publish Date:</label>
                <input type="date" id="date-featured${i + 1}" name="date">
                
                <label for="excerpt-featured${i + 1}">Excerpt:</label>
                <textarea id="excerpt-featured${i + 1}" name="excerpt" rows="3"></textarea>
                
                <label for="thumbnail-featured${i + 1}">Thumbnail URL:</label>
                <input type="text" id="thumbnail-featured${i + 1}" name="thumbnail">
                
                <label for="link-featured${i + 1}">Post Link:</label>
                <input type="text" id="link-featured${i + 1}" name="link">
                
                <label for="key-featured${i + 1}">Password:</label>
                <input type="password" id="key-featured${i + 1}" name="key" required>
                
                <button type="submit">Update Featured Post ${i + 1}</button>
            </form>
        `;

        container.insertAdjacentHTML('beforeend', formHTML);
    }
}

function loadBlogPostsFromData(data) {
    if (!data.categories) {
        console.error('No categories data found in latest.json');
        return;
    }

    const categories = data.categories;

    const categoryMappings = [
        {
            categoryKey: 'f1arti',
            subcategories: [
                { subcategoryKey: '2025 season', elementId: 'f1-2025-latest' },
                { subcategoryKey: 'general', elementId: 'f1-general-latest' }
            ]
        },
        {
            categoryKey: 'movietv',
            subcategories: [
                { subcategoryKey: 'movies', elementId: 'movie-latest' },
                { subcategoryKey: 'tv', elementId: 'tv-latest' }
            ]
        },
        {
            categoryKey: 'experience',
            elementId: 'experience-latest'
        },
        {
            categoryKey: 'techart',
            elementId: 'tech-latest'
        }
    ];

    categoryMappings.forEach(mapping => {
        const categoryData = categories[mapping.categoryKey];

        if (!categoryData) {
            console.error(`Category ${mapping.categoryKey} not found in data`);
            return;
        }

        if (mapping.subcategories) {
            mapping.subcategories.forEach(subcategory => {
                const subcategoryData = categoryData.subcategories && categoryData.subcategories[subcategory.subcategoryKey];
                const latestPost = subcategoryData ? subcategoryData.mainPost : null;
                displayPost(subcategory.elementId, latestPost);
            });
        } else {
            const latestPost = categoryData.mainPost;
            displayPost(mapping.elementId, latestPost);
        }
    });
}

function displayPost(elementId, post) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }

    if (!post) {
        element.innerHTML = '<div class="no-posts">No posts available</div>';
        return;
    }

    element.innerHTML = `
        <div class="post-item">
            <div class="post-uid">UID: ${post.uid || 'N/A'}</div>
            <div class="post-title">${post.title || 'No title'}</div>
            <div class="post-thumbnail">${post.thumbnail || 'No thumbnail'}</div>
        </div>
    `;
}
