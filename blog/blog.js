// Global variables
let blogData = null;
let currentCategory = null;
let currentSubcategory = null;

// DOM elements
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');
const blogGrid = document.getElementById('blogGrid');
const expandedView = document.getElementById('expandedView');
const postsGrid = document.getElementById('postsGrid');
const subcategoryTabs = document.getElementById('subcategoryTabs');
const categoriesList = document.getElementById('categoriesList');
const closeBtn = document.getElementById('closeBtn');
const latestPostsGrid = document.getElementById('latestPostsGrid');
const searchInput = document.getElementById('searchInput');

// Initialize page
document.addEventListener('DOMContentLoaded', initializePage);

// Navigation setup
function setupNavigation() {
    // Set active state for blog link
    bloglink.style.backgroundColor = '#F4F2EF';

    // Navigation event listeners
    homelink.addEventListener('click', () => {
        window.location = "https://beyondmebtw.com";
    });

    bloglink.addEventListener('click', () => {
        window.location = "https://medium.com/@beyondmebtw";
    });

    projlink.addEventListener('click', () => {
        window.location = "https://beyondmebtw.com/projects";
    });

    aboutlink.addEventListener('click', () => {
        window.location = "https://beyondmebtw.com/about";
    });

    // Close button event listener
    closeBtn.addEventListener('click', closeExpandedView);
}

// Fetch blog data from JSON file
async function fetchBlogData() {
    try {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        blogData = await response.json();
        console.log('Blog data loaded successfully');
        return blogData;
    } catch (error) {
        console.error('Error fetching blog data:', error);
        return null;
    }
}

// Initialize the page
async function initializePage() {
    try {
        setupNavigation();
        await fetchBlogData();

        if (blogData) {
            renderLatestPosts();
            renderCategories();
            setupSearch();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Render latest posts
function renderLatestPosts() {
    if (!blogData || !blogData.categories || !blogData.latestPosts) {
        console.error('Blog data not available or missing latestPosts');
        return;
    }

    latestPostsGrid.innerHTML = '';

    // Create a lookup map for all posts by their UID
    const postLookup = {};
    Object.values(blogData.categories).forEach(category => {
        if (category.posts && Array.isArray(category.posts)) {
            category.posts.forEach(post => {
                postLookup[post.uid] = post;
            });
        }
    });

    // Get the latest posts using the UIDs from latestPosts array
    const latestPosts = blogData.latestPosts
        .map(uid => postLookup[uid])
        .filter(post => post !== undefined); // Filter out any missing posts

    latestPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'latest-post-card';
        postCard.onclick = () => window.location.href = post.link;

        postCard.innerHTML = `
            <img class="latest-post-thumbnail" src="${post.thumbnail}" alt="${post.title}">
            <h4 class="latest-post-title">${post.title}</h4>
            <p class="latest-post-excerpt">${post.excerpt}</p>
            <div class="latest-post-date">${formatDate(post.date)}</div>
        `;

        latestPostsGrid.appendChild(postCard);
    });

    // If no posts available, show message
    if (latestPosts.length === 0) {
        latestPostsGrid.innerHTML = '<p style="text-align: center; color: #8b7355;">No posts available yet.</p>';
    }
}


// Render categories grid
function renderCategories() {
    if (!blogData || !blogData.categories) {
        console.error('Blog data not available');
        return;
    }

    blogGrid.innerHTML = '';

    Object.entries(blogData.categories).forEach(([key, category]) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.onclick = () => expandCategory(key);

        categoryCard.innerHTML = `
            <div class="category-header">
                <i class="${category.icon} category-icon"></i>
                <h3 class="category-title">${category.title}</h3>
            </div>
            <p class="category-description">${category.description}</p>
        `;

        blogGrid.appendChild(categoryCard);
    });
}

// Expand category view
function expandCategory(categoryKey) {
    if (!blogData || !blogData.categories[categoryKey]) {
        console.error('Category not found:', categoryKey);
        return;
    }

    currentCategory = categoryKey;
    const category = blogData.categories[categoryKey];

    // Hide categories grid and show expanded view
    blogGrid.style.display = 'none';
    expandedView.style.display = 'flex';

    // Render subcategory tabs
    renderSubcategoryTabs(category);

    // Render sidebar categories
    renderSidebarCategories();

    // Always show all posts by default (set currentSubcategory to null)
    currentSubcategory = null;
    renderCategoryPosts(category);
}

// Render subcategory tabs
function renderSubcategoryTabs(category) {
    subcategoryTabs.innerHTML = '';

    if (!category.subcategories || category.subcategories.length === 0) {
        return;
    }

    // Add "All" tab (active by default)
    const allTab = document.createElement('button');
    allTab.className = 'subcategory-tab active';
    allTab.textContent = 'All';
    allTab.onclick = () => switchSubcategory(null);
    subcategoryTabs.appendChild(allTab);

    // Add subcategory tabs
    category.subcategories.forEach(subcategory => {
        const tab = document.createElement('button');
        tab.className = 'subcategory-tab';
        tab.textContent = subcategory;
        tab.onclick = () => switchSubcategory(subcategory);
        subcategoryTabs.appendChild(tab);
    });
}

// Switch subcategory
function switchSubcategory(subcategory) {
    currentSubcategory = subcategory;

    // Update active tab
    const tabs = subcategoryTabs.querySelectorAll('.subcategory-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if ((subcategory === null && tab.textContent === 'All') ||
            (subcategory && tab.textContent === subcategory)) {
            tab.classList.add('active');
        }
    });

    // Render posts
    if (subcategory) {
        renderPostsBySubcategory(subcategory);
    } else {
        renderCategoryPosts(blogData.categories[currentCategory]);
    }
}

// Render posts by subcategory
function renderPostsBySubcategory(subcategory) {
    const category = blogData.categories[currentCategory];
    if (!category.posts) {
        postsGrid.innerHTML = '<p style="text-align: center; color: #8b7355;">No posts available.</p>';
        return;
    }

    const filteredPosts = category.posts.filter(post =>
        post.subcategory === subcategory
    );

    renderPosts(filteredPosts);
}

// Render all posts in category
function renderCategoryPosts(category) {
    if (!category.posts) {
        postsGrid.innerHTML = '<p style="text-align: center; color: #8b7355;">No posts available.</p>';
        return;
    }

    renderPosts(category.posts);
}

// Render posts
function renderPosts(posts) {
    postsGrid.innerHTML = '';

    if (posts.length === 0) {
        postsGrid.innerHTML = '<p style="text-align: center; color: #8b7355;">No posts available.</p>';
        return;
    }

    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.onclick = () => window.location.href = post.link;

        postCard.innerHTML = `
            <img class="post-thumbnail" src="${post.thumbnail}" alt="${post.title}">
            <h4 class="post-title">${post.title}</h4>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-date">${formatDate(post.date)}</div>
        `;

        postsGrid.appendChild(postCard);
    });
}

// Render sidebar categories
function renderSidebarCategories() {
    categoriesList.innerHTML = '';

    Object.entries(blogData.categories).forEach(([key, category]) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'sidebar-category';
        if (key === currentCategory) {
            categoryItem.classList.add('active');
        }
        categoryItem.onclick = () => switchCategory(key);

        categoryItem.innerHTML = `
            <div class="sidebar-category-header">
                <i class="${category.icon} sidebar-category-icon"></i>
                <span class="sidebar-category-title">${category.title}</span>
            </div>
        `;

        categoriesList.appendChild(categoryItem);
    });
}

// Switch category in expanded view
function switchCategory(categoryKey) {
    expandCategory(categoryKey);
}

// Close expanded view
function closeExpandedView() {
    expandedView.style.display = 'none';
    blogGrid.style.display = 'grid';
    currentCategory = null;
    currentSubcategory = null;
}

// Setup search functionality
function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();

        if (searchTerm.length === 0) {
            // Reset to normal view
            closeExpandedView();
            renderCategories();
            return;
        }

        if (searchTerm.length < 2) return; // Wait for at least 2 characters

        searchPosts(searchTerm);
    });
}

// Search posts function
function searchPosts(searchTerm) {
    if (!blogData || !blogData.categories) return;

    const allPosts = [];

    // Collect all posts from all categories
    Object.values(blogData.categories).forEach(category => {
        if (category.posts && Array.isArray(category.posts)) {
            allPosts.push(...category.posts);
        }
    });

    // Filter posts based on search term
    const filteredPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        (post.subcategory && post.subcategory.toLowerCase().includes(searchTerm))
    );

    // Display search results
    displaySearchResults(filteredPosts, searchTerm);
}

// Display search results
function displaySearchResults(posts, searchTerm) {
    // Close expanded view if open
    expandedView.style.display = 'none';
    blogGrid.style.display = 'grid';

    // Clear existing content
    blogGrid.innerHTML = '';

    if (posts.length === 0) {
        blogGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3 style="color: #3b342d; margin-bottom: 10px;">No posts found</h3>
                <p style="color: #8b7355;">No posts match your search term "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    // Create search results header
    const searchHeader = document.createElement('div');
    searchHeader.style.gridColumn = '1 / -1';
    searchHeader.style.textAlign = 'center';
    searchHeader.style.marginBottom = '20px';
    searchHeader.innerHTML = `
        <h3 style="color: #3b342d; margin-bottom: 10px;">Search Results</h3>
        <p style="color: #8b7355;">Found ${posts.length} post${posts.length === 1 ? '' : 's'} for "${searchTerm}"</p>
    `;
    blogGrid.appendChild(searchHeader);

    // Display search results as post cards
    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.style.margin = '10px';
        postCard.onclick = () => window.location.href = post.link;

        postCard.innerHTML = `
            <img class="post-thumbnail" src="${post.thumbnail}" alt="${post.title}">
            <h4 class="post-title">${post.title}</h4>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-date">${formatDate(post.date)}</div>
            ${post.subcategory ? `<div style="margin-top: 5px; font-size: 12px; color: #8b7355;">Category: ${post.subcategory}</div>` : ''}
        `;

        blogGrid.appendChild(postCard);
    });
}

// Format date function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}