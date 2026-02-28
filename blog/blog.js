// Global variables
let allPosts = [];
let filteredPosts = [];
let displayedPosts = [];
let currentFilter = 'all';
let currentSubfilter = null;
let currentPage = 0;
const postsPerPage = 8;
let isLoading = false;
let hasMorePosts = true;

// JSON file mappings for each category
const categoryJsonFiles = {
    'movie-tv': 'https://beyondmebtw.com/blog/movietv.json',
    'f1': 'https://beyondmebtw.com/blog/f1arti.json',
    'experience': 'https://beyondmebtw.com/blog/experience.json',
    'tech': 'https://beyondmebtw.com/blog/techart.json'
};

// Cache TTL: 1 hour in milliseconds
const CACHE_TTL = 60 * 60 * 1000;

// Fetch with localStorage cache. Returns parsed JSON.
// On cache hit: instant, no network request.
// On cache miss or expired: fetches, stores result, returns data.
async function fetchWithCache(url) {
    const cacheKey = 'blog_cache_' + url;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                return data;
            }
        }
    } catch (_) {
        // Corrupt cache entry — fall through to network fetch
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (_) {
        // localStorage may be full or unavailable (private browsing) — ignore
    }

    return data;
}

// Subcategory mappings
const subcategoryMappings = {
    'movie-tv': ['Movies', 'TV Shows'],
    'f1': ['2025 Season', 'General']
};

// DOM elements
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');
const postsGrid = document.getElementById('postsGrid');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const noResults = document.getElementById('noResults');
const scrollToTop = document.getElementById('scrollToTop');
const subcategoryFilters = document.getElementById('subcategoryFilters');

// Initialize page
document.addEventListener('DOMContentLoaded', initializePage);

// Navigation setup
function setupNavigation() {
    // Set active state for blog link
    if (bloglink) {
        bloglink.style.backgroundColor = '#F4F2EF';
    }

    // Navigation event listeners
    if (homelink) {
        homelink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com";
        });
    }

    if (bloglink) {
        bloglink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/blog";
        });
    }

    if (projlink) {
        projlink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/projects";
        });
    }

    if (aboutlink) {
        aboutlink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/about";
        });
    }
}

// Load all data
async function loadAllData() {
    try {
        showLoading();
        allPosts = [];

        // Load all category-specific data (served from cache when available)
        const categoryPromises = Object.entries(categoryJsonFiles).map(async ([categoryKey, jsonFile]) => {
            try {
                const categoryData = await fetchWithCache(jsonFile);

                if (categoryData.posts && Array.isArray(categoryData.posts)) {
                    // Add category info to each post
                    const postsWithCategory = categoryData.posts.map(post => ({
                        ...post,
                        category: categoryKey,
                        categoryTitle: getCategoryTitle(categoryKey)
                    }));
                    allPosts.push(...postsWithCategory);
                }
                return categoryData;
            } catch (error) {
                console.error(`Error fetching category data for ${categoryKey}:`, error);
                return null;
            }
        });

        await Promise.all(categoryPromises);

        // Sort all posts by date (newest first)
        allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log('All data loaded successfully', allPosts.length, 'posts');
        hideLoading();
        return true;
    } catch (error) {
        console.error('Error loading all data:', error);
        hideLoading();
        return false;
    }
}

// Get display subcategory based on current filter context
function getDisplaySubcategory(post) {
    // If we're viewing the post in its secondary category context
    if (currentFilter === post.secondaryCategory && post.secondarySubcategory) {
        return post.secondarySubcategory;
    }
    // Otherwise use primary subcategory
    return post.subcategory || '';
}

// Get category title from key
function getCategoryTitle(categoryKey) {
    const titles = {
        'movie-tv': 'Movies & TV',
        'f1': 'Formula 1',
        'experience': 'Personal Experience',
        'tech': 'Technology'
    };
    return titles[categoryKey] || categoryKey;
}

function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);

    const category = params.get('category');
    const season = params.get('season');

    if (category && categoryJsonFiles[category]) {
        currentFilter = category;
    }

    if (season && category === 'f1') {
        if (season === '2025') {
            currentSubfilter = '2025 Season';
        }
        else if (season === 'general') {
            currentSubfilter = 'General';
        }
    }
    
}

// Initialize the page
async function initializePage() {
    try {
        console.log('Initializing page...');
        setupNavigation();
        setupFilters();
        setupSearch();
        setupScrollToTop();
        setupLoadMore();

        // Load all data first
        const dataLoaded = await loadAllData();

        if (dataLoaded) {
            applyUrlFilters();
            console.log('Data loaded, rendering posts...');
            applyFilters();
        } else {
            console.error('Failed to load data');
            showNoResults();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showNoResults();
    }
}

// Setup filters
function setupFilters() {
    // Category filters
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all filters
            categoryFilters.forEach(f => f.classList.remove('active'));
            // Add active class to clicked filter
            filter.classList.add('active');

            const category = filter.getAttribute('data-category');
            currentFilter = category;
            currentSubfilter = null;

            // Show/hide subcategory filters
            updateSubcategoryFilters(category);

            // Reset pagination and apply filters
            resetPagination();
            applyFilters();
        });
    });
}

// Update subcategory filters
function updateSubcategoryFilters(category) {
    const subcategoryContainer = subcategoryFilters;
    subcategoryContainer.innerHTML = '';

    if (category !== 'all' && subcategoryMappings[category]) {
        // Add "All" subcategory
        const allSubBtn = document.createElement('button');
        allSubBtn.className = 'subcategory-filter active';
        allSubBtn.textContent = 'All';
        allSubBtn.addEventListener('click', () => selectSubcategory(null, allSubBtn));
        subcategoryContainer.appendChild(allSubBtn);

        // Add specific subcategories
        subcategoryMappings[category].forEach(subcategory => {
            const subBtn = document.createElement('button');
            subBtn.className = 'subcategory-filter';
            subBtn.textContent = subcategory;
            subBtn.addEventListener('click', () => selectSubcategory(subcategory, subBtn));
            subcategoryContainer.appendChild(subBtn);
        });

        subcategoryContainer.classList.add('visible');
    } else {
        subcategoryContainer.classList.remove('visible');
    }
}

// Select subcategory
function selectSubcategory(subcategory, button) {
    // Remove active class from all subcategory filters
    const subFilters = document.querySelectorAll('.subcategory-filter');
    subFilters.forEach(f => f.classList.remove('active'));

    // Add active class to clicked filter
    button.classList.add('active');

    currentSubfilter = subcategory;
    resetPagination();
    applyFilters();
}

// Setup search
function setupSearch() {
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            resetPagination();
            applyFilters();
        }, 300);
    });
}

// Setup scroll to top
function setupScrollToTop() {
    if (!scrollToTop) return;

    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTop.classList.add('visible');
        } else {
            scrollToTop.classList.remove('visible');
        }
    });

    // Scroll to top functionality
    scrollToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Setup load more
function setupLoadMore() {
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', () => {
        loadMorePosts();
    });
}

// Apply filters
function applyFilters() {
    let filtered = [...allPosts];

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(post => {
            // Check if post's primary category matches OR secondary category matches
            return post.category === currentFilter ||
                (post.secondaryCategory && post.secondaryCategory === currentFilter);
        });
    }

    // Apply subcategory filter
    if (currentSubfilter) {
        filtered = filtered.filter(post => {
            // If we're viewing in the post's secondary category context
            if (currentFilter === post.secondaryCategory && post.secondarySubcategory) {
                return post.secondarySubcategory === currentSubfilter;
            }
            // Otherwise use primary subcategory
            return post.subcategory === currentSubfilter;
        });
    }

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(post =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm) ||
            (post.subcategory && post.subcategory.toLowerCase().includes(searchTerm)) ||
            (post.secondaryCategory && getCategoryTitle(post.secondaryCategory).toLowerCase().includes(searchTerm))
        );
    }

    filteredPosts = filtered;
    hasMorePosts = filteredPosts.length > postsPerPage;
    renderPosts();
}

// Reset pagination
function resetPagination() {
    currentPage = 0;
    displayedPosts = [];
    postsGrid.innerHTML = '';
}

// Render posts
function renderPosts() {
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToAdd = filteredPosts.slice(startIndex, endIndex);

    displayedPosts.push(...postsToAdd);

    // Add new posts to grid
    postsToAdd.forEach((post, index) => {
        setTimeout(() => {
            const postCard = createPostCard(post);
            postsGrid.appendChild(postCard);
        }, index * 100);
    });

    // Update load more button
    updateLoadMoreButton();

    // Show no results if needed
    if (filteredPosts.length === 0) {
        showNoResults();
    } else {
        hideNoResults();
    }
}

// Create post card
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.style.cursor = 'pointer';

    // Add click event listeners
    postCard.addEventListener('click', (e) => handlePostCardClick(e, post.link));
    postCard.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            handlePostCardClick(e, post.link);
        }
    });

    // Create categories HTML
    let categoriesHTML = `<div class="post-category">${post.categoryTitle}</div>`;

    // Add secondary category if it exists and isn't empty
    if (post.secondaryCategory && post.secondaryCategory.trim() !== '') {
        const secondaryCategoryTitle = getCategoryTitle(post.secondaryCategory);
        categoriesHTML += `<div class="secondary-category">${secondaryCategoryTitle}</div>`;
    }

    postCard.innerHTML = `
                <img class="post-thumbnail lazy" data-src="${post.thumbnail}" alt="${post.title}">
                <h4 class="post-title">${post.title}</h4>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-meta">
                    <div class="post-date">${formatDate(post.date)}</div>
                    <div class="post-categories">
                        ${categoriesHTML}
                    </div>
                </div>
                <div class="read-more">Read More</div>
            `;

    // Set up lazy loading for the image
    const img = postCard.querySelector('.post-thumbnail');
    lazyLoadImage(img);

    return postCard;
}

// Handle post card clicks
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

// Load more posts
function loadMorePosts() {
    if (isLoading || !hasMorePosts) return;

    showLoadingSpinner();
    currentPage++;

    // Simulate loading delay for better UX
    setTimeout(() => {
        renderPosts();
        hideLoadingSpinner();
    }, 500);
}

// Update load more button
function updateLoadMoreButton() {
    const totalDisplayed = displayedPosts.length;
    const totalFiltered = filteredPosts.length;

    hasMorePosts = totalDisplayed < totalFiltered;

    if (hasMorePosts) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Load More Posts (${totalFiltered - totalDisplayed} remaining)`;
    } else {
        loadMoreBtn.style.display = 'none';
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

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show/hide loading states
function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'block';
}

function hideLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}

function showLoadingSpinner() {
    isLoading = true;
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (loadMoreBtn) loadMoreBtn.disabled = true;
}

function hideLoadingSpinner() {
    isLoading = false;
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (loadMoreBtn) loadMoreBtn.disabled = false;
}

function showNoResults() {
    if (noResults) noResults.style.display = 'block';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

function hideNoResults() {
    if (noResults) noResults.style.display = 'none';
}