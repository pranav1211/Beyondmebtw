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

// Category manifest — fetched from blog/categories.json
const CATEGORIES_MANIFEST_URL = 'https://beyondmebtw.com/blog/categories.json';
let categoriesManifest = {};

async function fetchWithCache(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Subcategory mappings — built dynamically from JSON after load
let subcategoryMappings = {};

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
const categoryFiltersContainer = document.querySelector('.category-filters');

// Initialize page
document.addEventListener('DOMContentLoaded', initializePage);

function setupNavigation() {
    if (bloglink) {
        bloglink.style.backgroundColor = '#F4F2EF';
    }

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

async function loadManifest() {
    try {
        categoriesManifest = await fetchWithCache(CATEGORIES_MANIFEST_URL);
        if (!categoriesManifest || typeof categoriesManifest !== 'object') {
            categoriesManifest = {};
        }
    } catch (error) {
        console.error('Error loading categories manifest:', error);
        categoriesManifest = {};
    }
}

function renderCategoryFilters() {
    if (!categoryFiltersContainer) return;

    const existing = categoryFiltersContainer.querySelectorAll('.category-filter[data-category]:not([data-category="all"])');
    existing.forEach(btn => btn.remove());

    Object.keys(categoriesManifest).forEach(key => {
        const cat = categoriesManifest[key];
        const btn = document.createElement('button');
        btn.className = 'category-filter';
        btn.setAttribute('data-category', key);
        btn.innerHTML = `<i class="${cat.icon || 'fas fa-folder'}"></i> ${cat.name || key}`;
        categoryFiltersContainer.appendChild(btn);
    });
}

async function loadAllData() {
    try {
        showLoading();
        allPosts = [];

        const keys = Object.keys(categoriesManifest);
        const categoryPromises = keys.map(async (categoryKey) => {
            try {
                const jsonFile = `https://beyondmebtw.com/blog/${categoryKey}.json`;
                const categoryData = await fetchWithCache(jsonFile);

                if (categoryData.subcategories && Array.isArray(categoryData.subcategories) && categoryData.subcategories.length > 0) {
                    subcategoryMappings[categoryKey] = categoryData.subcategories;
                }

                if (categoryData.posts && Array.isArray(categoryData.posts)) {
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

function getDisplaySubcategory(post) {
    if (currentFilter === post.secondaryCategory && post.secondarySubcategory) {
        return post.secondarySubcategory;
    }
    return post.subcategory || '';
}

function getCategoryTitle(categoryKey) {
    return (categoriesManifest[categoryKey] && categoriesManifest[categoryKey].name) || categoryKey;
}

function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);

    Object.keys(categoriesManifest).forEach(categoryKey => {
        if (params.has(categoryKey)) {
            const value = params.get(categoryKey);

            currentFilter = categoryKey;
            currentSubfilter = null;

            const categoryBtn = document.querySelector(
                `.category-filter[data-category="${categoryKey}"]`
            );

            if (categoryBtn) {
                document
                    .querySelectorAll('.category-filter')
                    .forEach(btn => btn.classList.remove('active'));

                categoryBtn.classList.add('active');
            }

            updateSubcategoryFilters(categoryKey);

            if (value) {
                handleSubcategoryFromUrl(categoryKey, value);
            }
        }
    });
}

function handleSubcategoryFromUrl(categoryKey, value) {
    const subs = subcategoryMappings[categoryKey] || [];
    const target = value.toLowerCase();
    const match = subs.find(s => s.toLowerCase() === target);
    if (match) activateSubcategory(match);
}

function activateSubcategory(name) {
    currentSubfilter = name;

    const subButtons = document.querySelectorAll('.subcategory-filter');

    subButtons.forEach(btn => {
        btn.classList.remove('active');

        if (btn.textContent.trim() === name) {
            btn.classList.add('active');
        }
    });
}

async function initializePage() {
    try {
        console.log('Initializing page...');
        setupNavigation();
        await loadManifest();
        renderCategoryFilters();
        setupFilters();
        setupSearch();
        setupScrollToTop();
        setupLoadMore();

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

function setupFilters() {
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            const category = filter.getAttribute('data-category');
            currentFilter = category;
            currentSubfilter = null;

            updateSubcategoryFilters(category);
            resetPagination();
            applyFilters();
        });
    });
}

function updateSubcategoryFilters(category) {
    const subcategoryContainer = subcategoryFilters;
    subcategoryContainer.innerHTML = '';

    if (category !== 'all' && subcategoryMappings[category]) {
        const allSubBtn = document.createElement('button');
        allSubBtn.className = 'subcategory-filter active';
        allSubBtn.textContent = 'All';
        allSubBtn.addEventListener('click', () => selectSubcategory(null, allSubBtn));
        subcategoryContainer.appendChild(allSubBtn);

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

function selectSubcategory(subcategory, button) {
    const subFilters = document.querySelectorAll('.subcategory-filter');
    subFilters.forEach(f => f.classList.remove('active'));

    button.classList.add('active');

    currentSubfilter = subcategory;
    resetPagination();
    applyFilters();
}

function setupSearch() {
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            resetPagination();
            applyFilters();
        }, 300);
    });
}

function setupScrollToTop() {
    if (!scrollToTop) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTop.classList.add('visible');
        } else {
            scrollToTop.classList.remove('visible');
        }
    });

    scrollToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function setupLoadMore() {
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', () => {
        loadMorePosts();
    });
}

function applyFilters() {
    let filtered = [...allPosts];

    if (currentFilter !== 'all') {
        filtered = filtered.filter(post => {
            return post.category === currentFilter ||
                (post.secondaryCategory && post.secondaryCategory === currentFilter);
        });
    }

    if (currentSubfilter) {
        filtered = filtered.filter(post => {
            if (currentFilter === post.secondaryCategory && post.secondarySubcategory) {
                return post.secondarySubcategory === currentSubfilter;
            }
            return post.subcategory === currentSubfilter;
        });
    }

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

function resetPagination() {
    currentPage = 0;
    displayedPosts = [];
    postsGrid.innerHTML = '';
}

function renderPosts() {
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToAdd = filteredPosts.slice(startIndex, endIndex);

    displayedPosts.push(...postsToAdd);

    postsToAdd.forEach((post) => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
    });

    updateLoadMoreButton();

    if (filteredPosts.length === 0) {
        showNoResults();
    } else {
        hideNoResults();
    }
}

function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.style.cursor = 'pointer';

    postCard.addEventListener('click', (e) => handlePostCardClick(e, post.link));
    postCard.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            handlePostCardClick(e, post.link);
        }
    });

    let categoriesHTML = `<div class="post-category">${post.categoryTitle}</div>`;

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

    const img = postCard.querySelector('.post-thumbnail');
    lazyLoadImage(img);

    return postCard;
}

function handlePostCardClick(event, postLink) {
    event.preventDefault();

    if (event.button === 1) {
        window.open(postLink, '_blank');
        return;
    }

    if (event.button === 0) {
        window.open(postLink, '_blank');
        return;
    }
}

function loadMorePosts() {
    if (isLoading || !hasMorePosts) return;

    showLoadingSpinner();
    currentPage++;
    renderPosts();
    hideLoadingSpinner();
}

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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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
