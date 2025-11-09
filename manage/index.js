// index.js - Main application logic (manages only manage.html and index.html)
document.addEventListener("DOMContentLoaded", () => {
    // Initialize authentication system first
    window.authSystem.init();

    // Get current page info
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Initialize based on current page
    if (currentPage === 'index.html') {
        initializeIndexPage();
    } else if (currentPage === 'manage.html') {
        initializeManagePage();
    }

    // INDEX PAGE INITIALIZATION
    function initializeIndexPage() {
        // Set up authentication for index page
        window.authSystem.setupIndexPageAuth();
        
        // Load data for display (public data, no auth needed)
        loadLatestData();
    }

    // MANAGE PAGE INITIALIZATION
    function initializeManagePage() {
        const contentContainer = document.getElementById("content-container");
        const authLoading = document.getElementById("auth-loading");

        // Hide loading message and show content (auth is already checked by authSystem.init())
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

    // CREATE LOGOUT BUTTON FOR MANAGE PAGE
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
            logoutBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            
            logoutBtn.addEventListener('mouseover', () => {
                logoutBtn.style.transform = 'translateY(-2px)';
                logoutBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            });
            
            logoutBtn.addEventListener('mouseout', () => {
                logoutBtn.style.transform = 'translateY(0)';
                logoutBtn.style.boxShadow = 'none';
            });
            
            logoutContainer.appendChild(logoutBtn);
        }
    }

    // CONTENT FORMS SETUP (for manage page)
    function setupContentForms() {
        const forms = document.querySelectorAll("#content-container form:not(.blog-form)");

        forms.forEach(form => {
            if (form.classList.contains('blog-form') || form.id === 'blog-form') {
                return;
            }

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const formData = new FormData(form);
                const formDataObject = {};
                const formId = form.id;

                formData.forEach((value, key) => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== "") {
                        formDataObject[key] = trimmedValue;
                    }
                });

                if (formId) {
                    formDataObject.formid = formId;
                }

                const baseUrl = "https://manage.beyondmebtw.com/latestdata";

                try {
                    const response = await fetch(baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formDataObject)
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error("Authentication failed. Check your API key.");
                        }
                        throw new Error(`Server responded with status: ${response.status}`);
                    }

                    await response.text();
                    alert("Data updated successfully!");

                    const authKey = window.authSystem.getAuthKey();
                    form.reset();
                    const passwordField = form.querySelector('input[name="key"]');
                    if (passwordField) {
                        passwordField.value = authKey;
                    }

                    loadLatestData();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                }
            });
        });
    }

    // BLOG FORMS SETUP (for manage page)
    function setupBlogForms() {
        const authKey = window.authSystem.getAuthKey();
        const blogForm = document.getElementById("blog-form");
        const clearBlogFormBtn = document.getElementById("clear-blog-form");

        if (!blogForm || !clearBlogFormBtn) return;

        const blogKeyField = document.getElementById("blog-key");
        if (blogKeyField) {
            blogKeyField.value = authKey;
        }

        // Load categories data and populate button groups
        loadCategoriesData();

        blogForm.addEventListener("submit", async (event) => {
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

            const requestBody = {};

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

            requestBody.isNewPost = isNewPost;

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
                const isNewPost = document.getElementById("is-new-post").checked;
                alert(`Blog post ${isNewPost ? 'added' : 'updated'} successfully!`);
                clearBlogForm();
                loadLatestData();
            } catch (error) {
                alert(`Error: ${error.message}`);
                console.error(error);
            }
        });

        clearBlogFormBtn.addEventListener("click", clearBlogForm);

        function clearBlogForm() {
            blogForm.reset();
            if (blogKeyField) {
                blogKeyField.value = authKey;
            }
            const titleElement = document.getElementById("blog-form-title");
            if (titleElement) {
                titleElement.textContent = "Add New Blog Post";
            }
            const newPostCheckbox = document.getElementById("is-new-post");
            if (newPostCheckbox) {
                newPostCheckbox.checked = true;
            }

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
    }

    // LOAD LATEST DATA
    function loadLatestData() {
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

    // DISPLAY CURRENT DATA
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

    // CREATE FEATURED POSTS FORMS
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

    // LOAD BLOG POSTS FROM DATA
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

    // LOAD CATEGORIES DATA AND POPULATE BUTTON GROUPS
    let categoriesCache = null;

    async function loadCategoriesData() {
        try {
            const response = await fetch('https://manage.beyondmebtw.com/categories');
            if (!response.ok) {
                throw new Error('Failed to load categories data');
            }
            categoriesCache = await response.json();

            // Populate button groups
            setupCategoryButtons();
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to showing text inputs or error message
            showCategoriesError();
        }
    }

    function setupCategoryButtons() {
        // Set up category change listener to update subcategory buttons
        const categorySelect = document.getElementById('blog-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', updateSubcategoryButtons);
            // Initial load
            updateSubcategoryButtons();
        }

        // Set up secondary category buttons
        updateSecondaryCategoryButtons();
    }

    function updateSubcategoryButtons() {
        const categorySelect = document.getElementById('blog-category');
        const subcategoryContainer = document.getElementById('subcategory-buttons');
        const subcategoryHidden = document.getElementById('blog-subcategory');

        if (!categorySelect || !subcategoryContainer) return;

        const selectedCategory = categorySelect.value;
        subcategoryContainer.innerHTML = '';

        if (!selectedCategory || !categoriesCache) {
            subcategoryContainer.innerHTML = '<p class="loading-text">Select a category first</p>';
            return;
        }

        const categoryData = categoriesCache[selectedCategory];
        if (!categoryData || !Array.isArray(categoryData.subcategories) || categoryData.subcategories.length === 0) {
            subcategoryContainer.innerHTML = '<p class="loading-text">No subcategories available</p>';
            return;
        }

        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
            if (subcategoryHidden) subcategoryHidden.value = '';
            updateSubcategoryButtonStates();
        });

        // Add category buttons
        categoryData.subcategories.forEach(subcat => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'category-btn';
            btn.textContent = subcat;
            btn.dataset.value = subcat;

            btn.addEventListener('click', () => {
                if (subcategoryHidden) subcategoryHidden.value = subcat;
                updateSubcategoryButtonStates();
            });

            subcategoryContainer.appendChild(btn);
        });

        subcategoryContainer.appendChild(clearBtn);
        updateSubcategoryButtonStates();
    }

    function updateSubcategoryButtonStates() {
        const subcategoryContainer = document.getElementById('subcategory-buttons');
        const subcategoryHidden = document.getElementById('blog-subcategory');

        if (!subcategoryContainer) return;

        const buttons = subcategoryContainer.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.dataset.value === subcategoryHidden.value) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function updateSecondaryCategoryButtons() {
        const secondaryCategoryContainer = document.getElementById('secondary-category-buttons');
        const secondaryCategoryHidden = document.getElementById('blog-secondary-category');

        if (!secondaryCategoryContainer || !categoriesCache) return;

        secondaryCategoryContainer.innerHTML = '';

        if (!Array.isArray(categoriesCache.secondaryCategories) || categoriesCache.secondaryCategories.length === 0) {
            secondaryCategoryContainer.innerHTML = '<p class="loading-text">No secondary categories available</p>';
            return;
        }

        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
            if (secondaryCategoryHidden) secondaryCategoryHidden.value = '';
            updateSecondaryCategoryButtonStates();
            updateSecondarySubcategoryButtons();
        });

        // Add category buttons
        categoriesCache.secondaryCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'category-btn';
            btn.textContent = category;
            btn.dataset.value = category;

            btn.addEventListener('click', () => {
                if (secondaryCategoryHidden) secondaryCategoryHidden.value = category;
                updateSecondaryCategoryButtonStates();
                updateSecondarySubcategoryButtons();
            });

            secondaryCategoryContainer.appendChild(btn);
        });

        secondaryCategoryContainer.appendChild(clearBtn);
        updateSecondaryCategoryButtonStates();
    }

    function updateSecondaryCategoryButtonStates() {
        const secondaryCategoryContainer = document.getElementById('secondary-category-buttons');
        const secondaryCategoryHidden = document.getElementById('blog-secondary-category');

        if (!secondaryCategoryContainer) return;

        const buttons = secondaryCategoryContainer.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.dataset.value === secondaryCategoryHidden.value) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function updateSecondarySubcategoryButtons() {
        const secondarySubcategoryContainer = document.getElementById('secondary-subcategory-buttons');
        const secondarySubcategoryHidden = document.getElementById('blog-secondary-subcategory');
        const secondaryCategoryHidden = document.getElementById('blog-secondary-category');

        if (!secondarySubcategoryContainer || !categoriesCache) return;

        secondarySubcategoryContainer.innerHTML = '';

        const selectedSecondaryCategory = secondaryCategoryHidden ? secondaryCategoryHidden.value : '';

        if (!selectedSecondaryCategory) {
            secondarySubcategoryContainer.innerHTML = '<p class="loading-text">Select secondary category first</p>';
            return;
        }

        const subcategories = categoriesCache.secondarySubcategories?.[selectedSecondaryCategory];

        if (!Array.isArray(subcategories) || subcategories.length === 0) {
            secondarySubcategoryContainer.innerHTML = '<p class="loading-text">No subcategories available</p>';
            return;
        }

        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
            if (secondarySubcategoryHidden) secondarySubcategoryHidden.value = '';
            updateSecondarySubcategoryButtonStates();
        });

        // Add subcategory buttons
        subcategories.forEach(subcat => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'category-btn';
            btn.textContent = subcat;
            btn.dataset.value = subcat;

            btn.addEventListener('click', () => {
                if (secondarySubcategoryHidden) secondarySubcategoryHidden.value = subcat;
                updateSecondarySubcategoryButtonStates();
            });

            secondarySubcategoryContainer.appendChild(btn);
        });

        secondarySubcategoryContainer.appendChild(clearBtn);
        updateSecondarySubcategoryButtonStates();
    }

    function updateSecondarySubcategoryButtonStates() {
        const secondarySubcategoryContainer = document.getElementById('secondary-subcategory-buttons');
        const secondarySubcategoryHidden = document.getElementById('blog-secondary-subcategory');

        if (!secondarySubcategoryContainer) return;

        const buttons = secondarySubcategoryContainer.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.dataset.value === secondarySubcategoryHidden.value) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function showCategoriesError() {
        const containers = [
            'subcategory-buttons',
            'secondary-category-buttons',
            'secondary-subcategory-buttons'
        ];

        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<p class="loading-text">Error loading categories</p>';
            }
        });
    }
});