document.addEventListener("DOMContentLoaded", () => {
    // Login form handling
    const loginForm = document.getElementById("login-form");
    const loginContainer = document.getElementById("login-container");
    const contentContainer = document.getElementById("content-container");

    // Check if user is already logged in    
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
        showContentForms();
    }

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const password = document.getElementById("login-password").value;
        const baseUrl = "https://manage.beyondmebtw.com/loginauth";

        fetch(baseUrl, {
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
                sessionStorage.setItem("isLoggedIn", "true");
                sessionStorage.setItem("authKey", password);

                // Show content forms
                showContentForms();
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
                console.error(error);
            });
    });

    // Show content forms after authentication
    function showContentForms() {
        // Hide login form
        loginContainer.style.display = "none";

        // Show content forms
        contentContainer.style.display = "block";

        // Set up form submissions
        setupContentForms();
        setupBlogForms();

        // Load and display data
        loadLatestData();
    }

    function setupContentForms() {
        const forms = document.querySelectorAll("#content-container form:not(.blog-form)");

        forms.forEach(form => {
            // Skip blog forms
            if (form.classList.contains('blog-form') || form.id === 'blog-form') {
                return;
            }

            form.addEventListener("submit", (event) => {
                event.preventDefault();

                const formData = new FormData(form);
                const formDataObject = {};
                const formId = form.id;

                // Convert FormData to regular object
                formData.forEach((value, key) => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== "") {
                        formDataObject[key] = trimmedValue;
                    }
                });

                // Add form ID if it exists
                if (formId) {
                    formDataObject.formid = formId;
                }

                const baseUrl = "https://manage.beyondmebtw.com/latestdata";

                // Changed to POST with JSON body
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

                        // Reset the form but keep the password filled
                        const authKey = sessionStorage.getItem("authKey");
                        form.reset();
                        const passwordField = form.querySelector('input[name="key"]');
                        if (passwordField) {
                            passwordField.value = authKey;
                        }

                        // Reload data to show updates
                        loadLatestData();
                    })
                    .catch((error) => {
                        alert(`Error: ${error.message}`);
                        console.error(error);
                    });
            });
        });
    }

    // Blog form setup
    function setupBlogForms() {
        const authKey = sessionStorage.getItem("authKey");

        // Blog form elements
        const blogForm = document.getElementById("blog-form");
        const clearBlogFormBtn = document.getElementById("clear-blog-form");

        if (!blogForm || !clearBlogFormBtn) return;

        // Fill blog password fields
        const blogKeyField = document.getElementById("blog-key");
        if (blogKeyField) {
            blogKeyField.value = authKey;
        }

        // Blog form submission
        blogForm.addEventListener("submit", (event) => {
            event.preventDefault();

            // Get all form field values manually to ensure we capture everything correctly
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

            // Create request body object with only non-empty values
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

            // Always add the isNewPost parameter
            requestBody.isNewPost = isNewPost;

            const baseUrl = "https://manage.beyondmebtw.com/blogdata";

            console.log("Is New Post (checkbox checked):", isNewPost);
            console.log("All form values:", {
                category, uid, title, date, excerpt, thumbnail, link,
                subcategory, secondaryCategory, secondarySubcategory, isNewPost
            });

            // Changed to POST with JSON body
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

                    // Reset the form but keep the password filled
                    clearBlogForm();

                    // Reload latest data to show the updated data
                    loadLatestData();
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                });
        });

        // Clear blog form button
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

    // Combined function to load latest.json once and handle both data display and blog posts
    function loadLatestData() {
        fetch('latest.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch latest.json: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                // Display current data and create forms with that data
                displayCurrentData(data);
                createFeaturedPostsForms(data.featured);
                createFeaturedProjectsForms(data.projects);

                // Handle blog posts data
                loadBlogPostsFromData(data);

                // Fill password fields after forms are created
                fillPasswordFields();
            })
            .catch((error) => {
                console.error('Error loading latest.json:', error);
            });
    }

    function fillPasswordFields() {
        const authKey = sessionStorage.getItem("authKey");
        if (authKey) {
            const passwordFields = document.querySelectorAll('input[type="password"][name="key"]');
            passwordFields.forEach(field => {
                field.value = authKey;
            });
        }
    }

    function displayCurrentData(data) {
        // Display Latest Post
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
                <img src="${mainPost.thumbnail}" alt="${mainPost.title}" style="max-width: 200px; height: auto;">
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

        container.innerHTML = '<h3>Featured Posts</h3>';

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

    function createFeaturedProjectsForms(projects = []) {
        const container = document.getElementById('featured-projects-container');
        if (!container) return;

        container.innerHTML = '<h3>Featured Projects</h3>';

        for (let i = 0; i < 4; i++) {
            const project = projects[i] || {};

            const formHTML = `
                <form id="project${i + 1}" class="content-form">
                    <h2>Featured Project ${i + 1}</h2>
                    
                    <div class="current-data">
                        ${project.title ? `
                            <div class="project-preview">
                                <h4>${project.emoji || '📁'} ${project.title}</h4>
                                <p class="excerpt">${project.excerpt}</p>
                                <a href="${project.link}" target="_blank">View Project</a>
                            </div>
                        ` : '<p class="no-content">No project assigned</p>'}
                    </div>
                    
                    <input type="hidden" name="instance" value="project${i + 1}">
                    
                    <label for="name-project${i + 1}">Project Title:</label>
                    <input type="text" id="name-project${i + 1}" name="name">
                    
                    <label for="excerpt-project${i + 1}">Project Description:</label>
                    <textarea id="excerpt-project${i + 1}" name="excerpt" rows="3"></textarea>
                    
                    <label for="link-project${i + 1}">Project Link:</label>
                    <input type="text" id="link-project${i + 1}" name="link">
                    
                    <label for="key-project${i + 1}">Password:</label>
                    <input type="password" id="key-project${i + 1}" name="key" required>
                    
                    <button type="submit">Update Project ${i + 1}</button>
                </form>
            `;

            container.insertAdjacentHTML('beforeend', formHTML);
        }
    }

    function loadBlogPostsFromData(data) {
        // Check if categories data exists
        if (!data.categories) {
            console.error('No categories data found in latest.json');
            return;
        }

        const categories = data.categories;

        // Map category data to display elements - using the exact case from latest.json
        const categoryMappings = [
            {
                categoryKey: 'f1arti', // Lowercase to match latest.json
                subcategories: [
                    { subcategoryKey: '2025 season', elementId: 'f1-2025-latest' },
                    { subcategoryKey: 'general', elementId: 'f1-general-latest' }
                ]
            },
            {
                categoryKey: 'movietv', // Lowercase to match latest.json
                subcategories: [
                    { subcategoryKey: 'movies', elementId: 'movie-latest' },
                    { subcategoryKey: 'tv', elementId: 'tv-latest' }
                ]
            },
            {
                categoryKey: 'experience', // Lowercase to match latest.json
                elementId: 'experience-latest'
            },
            {
                categoryKey: 'techart', // Lowercase to match latest.json
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
                // Handle categories with subcategories
                mapping.subcategories.forEach(subcategory => {
                    const subcategoryData = categoryData.subcategories && categoryData.subcategories[subcategory.subcategoryKey];
                    const latestPost = subcategoryData ? subcategoryData.mainPost : null;
                    displayPost(subcategory.elementId, latestPost);
                });
            } else {
                // Handle categories without subcategories (direct mainPost)
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

    // Load data initially when the page loads (for non-authenticated users)
    loadLatestData();
});