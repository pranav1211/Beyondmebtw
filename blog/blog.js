// Global variables
let blogData = null;
let currentCategory = null;
let currentSubcategory = null;
let allCategoryData = {};
let latestBlogData = null;

// JSON file mappings for each category
const categoryJsonFiles = {
    'movie-tv': 'movietv.json',
    'f1': 'f1arti.json',
    'experience': 'experience.json',
    'tech': 'techart.json'
};

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

// Fetch latest blog data
async function fetchLatestBlogData() {
    try {
        const response = await fetch('latestblog.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        latestBlogData = await response.json();
        console.log('Latest blog data loaded successfully');
        return latestBlogData;
    } catch (error) {
        console.error('Error fetching latest blog data:', error);
        return null;
    }
}

// Fetch category-specific data
async function fetchCategoryData(categoryKey) {
    const jsonFile = categoryJsonFiles[categoryKey];
    if (!jsonFile) {
        console.error('No JSON file found for category:', categoryKey);
        return null;
    }

    try {
        const response = await fetch(jsonFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categoryData = await response.json();
        console.log(`Category data loaded for ${categoryKey}`);
        return categoryData;
    } catch (error) {
        console.error(`Error fetching category data for ${categoryKey}:`, error);
        return null;
    }
}

// Load all JSON files upfront
async function loadAllData() {
    try {
        // Load main blog data and latest blog data
        const [mainBlogData, latestData] = await Promise.all([
            fetchBlogData(),
            fetchLatestBlogData()
        ]);

        blogData = mainBlogData;
        latestBlogData = latestData;

        // Load all category-specific data
        const categoryPromises = Object.keys(categoryJsonFiles).map(async (categoryKey) => {
            const categoryData = await fetchCategoryData(categoryKey);
            if (categoryData) {
                allCategoryData[categoryKey] = categoryData;
                // Merge with main blog data if it exists
                if (blogData && blogData.categories && blogData.categories[categoryKey]) {
                    blogData.categories[categoryKey] = {
                        ...blogData.categories[categoryKey],
                        ...categoryData
                    };
                }
            }
        });

        await Promise.all(categoryPromises);
        console.log('All data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading all data:', error);
        return false;
    }
}

// Initialize the page
async function initializePage() {
    try {
        setupNavigation();
        
        // Load all data first
        const dataLoaded = await loadAllData();

        if (dataLoaded && blogData) {
            renderLatestPosts();
            renderCategories();
            setupSearch();
        } else {
            console.error('Failed to load data');
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Lazy load images
function lazyLoadImage(img) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    imageObserver.observe(img);
}

// Handle post card clicks with middle mouse button support
function handlePostCardClick(event, postLink) {
    event.preventDefault();
    
    // Middle mouse button (wheel button) - open in new tab
    if (event.button === 1) {
        window.open(postLink, '_blank');
        return;
    }
    
    // Left click - open in new tab
    if (event.button === 0) {
        window.open(postLink, '_blank');
        return;
    }
}

// Render latest posts
function renderLatestPosts() {
    if (!latestBlogData || !latestBlogData.latestPosts) {
        console.error('Latest blog data not available');
        return;
    }

    latestPostsGrid.innerHTML = '';

    // Create a lookup map for all posts by their UID from all categories
    const postLookup = {};
    
    // Add posts from main blog data
    if (blogData && blogData.categories) {
        Object.values(blogData.categories).forEach(category => {
            if (category.posts && Array.isArray(category.posts)) {
                category.posts.forEach(post => {
                    postLookup[post.uid] = post;
                });
            }
        });
    }

    // Add posts from category-specific data
    Object.values(allCategoryData).forEach(categoryData => {
        if (categoryData.posts && Array.isArray(categoryData.posts)) {
            categoryData.posts.forEach(post => {
                postLookup[post.uid] = post;
            });
        }
    });

    // Get the latest posts using the UIDs from latestPosts array
    const latestPosts = latestBlogData.latestPosts
        .map(uid => postLookup[uid])
        .filter(post => post !== undefined); // Filter out any missing posts

    latestPosts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'latest-post-card';
        postCard.style.position = 'relative';
        postCard.style.cursor = 'pointer';
        postCard.style.display = 'flex';
        postCard.style.flexDirection = 'column';
        
        // Add click event listeners for left and middle mouse buttons
        postCard.addEventListener('click', (e) => handlePostCardClick(e, post.link));
        postCard.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                handlePostCardClick(e, post.link);
            }
        });

        postCard.innerHTML = `
            <img class="latest-post-thumbnail lazy" data-src="${post.thumbnail}" alt="${post.title}">
            <h4 class="latest-post-title">${post.title}</h4>
            <p class="latest-post-excerpt">${post.excerpt}</p>
            <div class="latest-post-date">${formatDate(post.date)}</div>
            <div class="read-more">Read More</div>
        `;

        // Set up lazy loading for the image
        const img = postCard.querySelector('.latest-post-thumbnail');
        lazyLoadImage(img);

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
        postCard.style.position = 'relative';
        postCard.style.cursor = 'pointer';
        postCard.style.display = 'flex';
        postCard.style.flexDirection = 'column';
        
        // Add click event listeners for left and middle mouse buttons
        postCard.addEventListener('click', (e) => handlePostCardClick(e, post.link));
        postCard.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                handlePostCardClick(e, post.link);
            }
        });

        postCard.innerHTML = `
            <img class="post-thumbnail lazy" data-src="${post.thumbnail}" alt="${post.title}">
            <h4 class="post-title">${post.title}</h4>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-date">${formatDate(post.date)}</div>
            <div class="read-more">Read More</div>
        `;

        // Set up lazy loading for the image
        const img = postCard.querySelector('.post-thumbnail');
        lazyLoadImage(img);

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
    const allPosts = [];

    // Collect all posts from all loaded data
    if (blogData && blogData.categories) {
        Object.values(blogData.categories).forEach(category => {
            if (category.posts && Array.isArray(category.posts)) {
                allPosts.push(...category.posts);
            }
        });
    }

    // Also collect from category-specific data
    Object.values(allCategoryData).forEach(categoryData => {
        if (categoryData.posts && Array.isArray(categoryData.posts)) {
            allPosts.push(...categoryData.posts);
        }
    });

    // Remove duplicates based on UID
    const uniquePosts = allPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.uid === post.uid)
    );

    // Filter posts based on search term
    const filteredPosts = uniquePosts.filter(post =>
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
        postCard.style.position = 'relative';
        postCard.style.cursor = 'pointer';
        postCard.style.display = 'flex';
        postCard.style.flexDirection = 'column';
        
        // Add click event listeners for left and middle mouse buttons
        postCard.addEventListener('click', (e) => handlePostCardClick(e, post.link));
        postCard.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                handlePostCardClick(e, post.link);
            }
        });

        postCard.innerHTML = `
            <img class="post-thumbnail lazy" data-src="${post.thumbnail}" alt="${post.title}">
            <h4 class="post-title">${post.title}</h4>
            <p class="post-excerpt">${post.excerpt}</p>
            <div class="post-date">${formatDate(post.date)}</div>
            ${post.subcategory ? `<div style="margin-top: 5px; font-size: 12px; color: #8b7355;">Category: ${post.subcategory}</div>` : ''}
            <div class="read-more">Read More</div>
        `;

        // Set up lazy loading for the image
        const img = postCard.querySelector('.post-thumbnail');
        lazyLoadImage(img);

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