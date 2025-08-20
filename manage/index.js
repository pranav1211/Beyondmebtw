document.addEventListener("DOMContentLoaded", () => {
    // Get current page info - improved to handle different domains
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    const currentDomain = window.location.hostname;
    
    // Determine page type based on URL patterns
    function getPageType() {
        // Check for index page (main authentication page)
        if (currentPage === 'index.html' || currentPath === '/' || currentDomain === 'manage.beyondmebtw.com') {
            return 'index';
        }
        
        // Check for manage page
        if (currentPage === 'manage.html' || currentPath.includes('/manage.html') || currentDomain.includes('manage.beyondmebtw.com')) {
            return 'manage';
        }
        
        // Check for minis page - handle both old and new locations
        if (currentPage === 'minis.html' || 
            currentPath.includes('/minis.html') || 
            currentDomain === 'minis.beyondmebtw.com' ||
            currentUrl.includes('minis.beyondmebtw.com')) {
            return 'minis';
        }
        
        return 'unknown';
    }
    
    const pageType = getPageType();
    
    // Universal authentication check - improved for cross-domain
    function checkAuthentication() {
        // Try to get authentication from both sessionStorage and localStorage for cross-domain compatibility
        let isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
        
        // Fallback to localStorage if sessionStorage is empty (for cross-domain scenarios)
        if (!isLoggedIn) {
            isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            // Sync sessionStorage with localStorage if found
            if (isLoggedIn) {
                sessionStorage.setItem("isLoggedIn", "true");
                const authKey = localStorage.getItem("authKey");
                if (authKey) {
                    sessionStorage.setItem("authKey", authKey);
                }
            }
        }
        
        // If not on index page and not authenticated, redirect to main authentication
        if (pageType !== 'index' && !isLoggedIn) {
            // Show loading message briefly before redirect
            const authLoading = document.getElementById("auth-loading");
            if (authLoading) {
                authLoading.style.display = "block";
                authLoading.innerHTML = "<p>Authentication required. Redirecting to login...</p>";
            }
            
            // Hide content containers while redirecting
            const contentContainer = document.getElementById("content-container");
            if (contentContainer) {
                contentContainer.style.display = "none";
            }
            
            // Redirect to main authentication page
            setTimeout(() => {
                window.location.href = 'https://manage.beyondmebtw.com/';
            }, 1500);
            return false;
        }
        
        return isLoggedIn;
    }

    // Universal login function - improved with cross-domain storage
    function handleLogin(password) {
        const baseUrl = "https://manage.beyondmebtw.com/loginauth";

        return fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: password
            })
        })
        .then((response) => {
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("Authentication failed. Incorrect password.");
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.text();
        })
        .then(() => {
            // Store authentication in both sessionStorage and localStorage for cross-domain compatibility
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("authKey", password);
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("authKey", password);

            // Set expiration time (5 minutes)
            const expirationTime = new Date().getTime() + (5 * 60 * 1000);
            localStorage.setItem("authExpiration", expirationTime.toString());
            
            return true;
        });
    }

    // Check if authentication has expired
    function checkAuthenticationExpiration() {
        const expirationTime = localStorage.getItem("authExpiration");
        if (expirationTime) {
            const currentTime = new Date().getTime();
            if (currentTime > parseInt(expirationTime)) {
                // Authentication expired, clear all auth data
                sessionStorage.removeItem("isLoggedIn");
                sessionStorage.removeItem("authKey");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("authKey");
                localStorage.removeItem("authExpiration");
                return false;
            }
        }
        return true;
    }

    // Initialize based on page type
    console.log(`Page type detected: ${pageType}`);
    
    // Check authentication expiration first
    checkAuthenticationExpiration();
    
    if (pageType === 'index') {
        initializeIndexPage();
    } else if (pageType === 'manage') {
        if (checkAuthentication()) {
            initializeManagePage();
        }
    } else if (pageType === 'minis') {
        if (checkAuthentication()) {
            initializeMinisPage();
        }
    } else {
        // Unknown page type, check authentication anyway
        checkAuthentication();
    }

    // INDEX PAGE INITIALIZATION
    function initializeIndexPage() {
        const loginForm = document.getElementById("login-form");
        const loginContainer = document.getElementById("login-container");
        const navContainer = document.getElementById("nav-container");
        const errorMessage = document.getElementById("error-message");

        // Check if user is already logged in
        const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || 
                          localStorage.getItem("isLoggedIn") === "true";
        
        if (isLoggedIn && checkAuthenticationExpiration()) {
            showNavigation();
        }

        if (loginForm) {
            loginForm.addEventListener("submit", (event) => {
                event.preventDefault();
                
                const password = document.getElementById("login-password").value;
                const loginBtn = loginForm.querySelector('.login-btn');
                const originalText = loginBtn.textContent;
                
                loginBtn.textContent = 'Authenticating...';
                loginBtn.disabled = true;

                handleLogin(password)
                    .then(() => {
                        if (errorMessage) errorMessage.style.display = 'none';
                        showNavigation();
                    })
                    .catch((error) => {
                        if (errorMessage) {
                            errorMessage.textContent = error.message;
                            errorMessage.style.display = 'block';
                        }
                        console.error(error);
                    })
                    .finally(() => {
                        loginBtn.textContent = originalText;
                        loginBtn.disabled = false;
                    });
            });
        }

        function showNavigation() {
            if (loginContainer) loginContainer.style.display = "none";
            if (navContainer) navContainer.style.display = "flex";
        }

        // Add click handlers for navigation buttons with proper URLs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || 
                                 localStorage.getItem("isLoggedIn") === "true";
                
                if (!isLoggedIn || !checkAuthenticationExpiration()) {
                    e.preventDefault();
                    alert("Please log in first.");
                    location.reload();
                    return;
                }
                
                // Update navigation URLs to proper domains
                const href = btn.getAttribute('href');
                if (href === 'manage.html') {
                    btn.setAttribute('href', 'https://manage.beyondmebtw.com/manage.html');
                } else if (href === 'minis.html') {
                    btn.setAttribute('href', 'https://minis.beyondmebtw.com/backend/minis.html');
                }
            });
        });
    }

    // MANAGE PAGE INITIALIZATION
    function initializeManagePage() {
        const contentContainer = document.getElementById("content-container");
        const authLoading = document.getElementById("auth-loading");

        console.log("Initializing manage page...");

        // Hide loading message and show content
        if (authLoading) authLoading.style.display = "none";
        if (contentContainer) {
            contentContainer.style.display = "block";
        } else {
            console.error("Content container not found on manage page");
        }

        // Set up forms
        setupContentForms();
        setupBlogForms();

        // Load and display data
        loadLatestData();
        
        console.log("Manage page initialization complete");
    }

    // MINIS PAGE INITIALIZATION - Enhanced
    function initializeMinisPage() {
        console.log("Initializing minis page...");
        
        // Hide auth loading if present
        const authLoading = document.getElementById("auth-loading");
        if (authLoading) {
            authLoading.style.display = "none";
        }
        
        // Show content if there's a content container
        const contentContainer = document.getElementById("content-container");
        if (contentContainer) {
            contentContainer.style.display = "block";
            console.log("Minis content container displayed");
        } else {
            console.log("No content container found on minis page");
        }
        
        // Add authentication status indicator
        const body = document.body;
        if (body && !document.getElementById('auth-status')) {
            const authStatus = document.createElement('div');
            authStatus.id = 'auth-status';
            authStatus.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #4CAF50;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 1000;
            `;
            authStatus.textContent = 'Authenticated ✓';
            body.appendChild(authStatus);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (authStatus && authStatus.parentNode) {
                    authStatus.parentNode.removeChild(authStatus);
                }
            }, 3000);
        }
        
        console.log('Minis page initialized successfully');
        
        // You can add minis-specific functionality here
        initializeMinisSpecificFeatures();
    }

    // Minis-specific features
    function initializeMinisSpecificFeatures() {
        // Add any minis-specific initialization here
        console.log("Initializing minis-specific features...");
        
        // Example: Set up periodic authentication check for minis page
        setInterval(() => {
            if (!checkAuthenticationExpiration()) {
                console.log("Authentication expired, redirecting...");
                window.location.href = 'https://manage.beyondmebtw.com/';
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    // EXISTING MANAGE PAGE FUNCTIONS (keeping your original code)
    function setupContentForms() {
        const forms = document.querySelectorAll("#content-container form:not(.blog-form)");

        forms.forEach(form => {
            if (form.classList.contains('blog-form') || form.id === 'blog-form') {
                return;
            }

            form.addEventListener("submit", (event) => {
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

                fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formDataObject)
                })
                .then((response) => {
                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error("Authentication failed. Check your API key.");
                        }
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(() => {
                    alert("Data updated successfully!");

                    const authKey = sessionStorage.getItem("authKey") || localStorage.getItem("authKey");
                    form.reset();
                    const passwordField = form.querySelector('input[name="key"]');
                    if (passwordField) {
                        passwordField.value = authKey;
                    }

                    loadLatestData();
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                });
            });
        });
    }

    function setupBlogForms() {
        const authKey = sessionStorage.getItem("authKey") || localStorage.getItem("authKey");
        const blogForm = document.getElementById("blog-form");
        const clearBlogFormBtn = document.getElementById("clear-blog-form");

        if (!blogForm || !clearBlogFormBtn) return;

        const blogKeyField = document.getElementById("blog-key");
        if (blogKeyField) {
            blogKeyField.value = authKey;
        }

        blogForm.addEventListener("submit", (event) => {
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

            fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Authentication failed. Check your password.");
                    }
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.text();
            })
            .then(() => {
                const isNewPost = document.getElementById("is-new-post").checked;
                alert(`Blog post ${isNewPost ? 'added' : 'updated'} successfully!`);
                clearBlogForm();
                loadLatestData();
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
                console.error(error);
            });
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
        }
    }

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
                fillPasswordFields();
            })
            .catch((error) => {
                console.error('Error loading latest.json:', error);
            });
    }

    function fillPasswordFields() {
        const authKey = sessionStorage.getItem("authKey") || localStorage.getItem("authKey");
        if (authKey) {
            const passwordFields = document.querySelectorAll('input[type="password"][name="key"]');
            passwordFields.forEach(field => {
                field.value = authKey;
            });
        }
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

    // Load data initially when the page loads (for index page without auth)
    if (pageType === 'index') {
        loadLatestData();
    }
    
    // Add logout functionality (useful for testing and security)
    function logout() {
        sessionStorage.clear();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authKey");
        localStorage.removeItem("authExpiration");
        window.location.href = 'https://manage.beyondmebtw.com/';
    }
    
    // Expose logout function globally for potential use
    window.logout = logout;
});