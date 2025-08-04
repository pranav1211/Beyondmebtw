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
        const queryString = `key=${encodeURIComponent(password)}`;
        const url = `${baseUrl}?${queryString}`;

        fetch(url)
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
                // Store authentication state
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

    function showContentForms() {
        // Hide login form
        loginContainer.style.display = "none";

        // Show content forms
        contentContainer.style.display = "block";

        // Fill all password fields with the authenticated password
        const authKey = sessionStorage.getItem("authKey");
        const passwordFields = document.querySelectorAll('input[type="password"][name="key"]');
        passwordFields.forEach(field => {
            field.value = authKey;
        });

        // Set up form submissions for content forms
        setupContentForms();
        setupBlogForms();
        
        // Load latest.json once and use it for both showdata and loadBlogPosts
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
                const queryStringParams = [];

                const formId = form.id;

                formData.forEach((value, key) => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== "") {
                        queryStringParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(trimmedValue)}`);
                    }
                });

                if (formId) {
                    queryStringParams.push(`formid=${encodeURIComponent(formId)}`);
                }

                const baseUrl = "https://manage.beyondmebtw.com/latestdata";
                const queryString = queryStringParams.join("&");
                const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
               

                fetch(url)
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
                        form.querySelector('input[name="key"]').value = authKey;
                    })
                    .catch((error) => {
                        alert(`Error: ${error.message}`);
                        console.error(error);
                    });
            });
        });
    }

    function setupBlogForms() {
        const authKey = sessionStorage.getItem("authKey");
        
        // Blog form elements
        const blogForm = document.getElementById("blog-form");
        const clearBlogFormBtn = document.getElementById("clear-blog-form");

        // Fill blog password fields
        document.getElementById("blog-key").value = authKey;

        // Blog form submission
        blogForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const queryStringParams = [];

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

            // Add parameters only if they have values
            if (category) queryStringParams.push(`category=${encodeURIComponent(category)}`);
            if (uid) queryStringParams.push(`uid=${encodeURIComponent(uid)}`);
            if (title) queryStringParams.push(`title=${encodeURIComponent(title)}`);
            if (date) queryStringParams.push(`date=${encodeURIComponent(date)}`);
            if (excerpt) queryStringParams.push(`excerpt=${encodeURIComponent(excerpt)}`);
            if (thumbnail) queryStringParams.push(`thumbnail=${encodeURIComponent(thumbnail)}`);
            if (link) queryStringParams.push(`link=${encodeURIComponent(link)}`);
            if (subcategory) queryStringParams.push(`subcategory=${encodeURIComponent(subcategory)}`);
            if (secondaryCategory) queryStringParams.push(`secondaryCategory=${encodeURIComponent(secondaryCategory)}`);
            if (secondarySubcategory) queryStringParams.push(`secondarySubcategory=${encodeURIComponent(secondarySubcategory)}`);
            if (key) queryStringParams.push(`key=${encodeURIComponent(key)}`);

            // Always add the isNewPost parameter explicitly
            queryStringParams.push(`isNewPost=${isNewPost}`);

            const baseUrl = "https://manage.beyondmebtw.com/blogdata";
            const queryString = queryStringParams.join("&");
            const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            console.log("Is New Post (checkbox checked):", isNewPost);
            console.log("All form values:", {
                category, uid, title, date, excerpt, thumbnail, link, 
                subcategory, secondaryCategory, secondarySubcategory, isNewPost
            });

            fetch(url)
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
            document.getElementById("blog-key").value = authKey;
            document.getElementById("blog-form-title").textContent = "Add New Blog Post";
            document.getElementById("is-new-post").checked = true; // Default to checked
        }
    }

    // Combined function to load latest.json once and handle both showdata and loadBlogPosts
    function loadLatestData() {
        fetch('latest.json')  
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch latest.json: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                // Handle main site data (original showdata functionality)
                showMainSiteData(data);
                
                // Handle blog posts data (loadBlogPosts functionality)
                loadBlogPostsFromData(data);
            })
            .catch((error) => {
                console.error('Error loading latest.json:', error);
            });
    }

    function showMainSiteData(data) {
        // Main Post
        const mainPost = data.mainPost;
        const mainTitle = mainPost.title;
        const mainDate = mainPost.date;
        const dateObject = new Date(mainDate);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(dateObject);

        const mainExcerpt = mainPost.excerpt;
        const mainThumbnail = mainPost.thumbnail;
        const mainLink = mainPost.link;

        // Only update if elements exist (in case this is called on a different page)
        const latestTitle = document.querySelector('.latest-title');
        const latestDate = document.querySelector('.latest-date');
        const latestExcerpt = document.querySelector('.latest-excerpt');
        const latestImg = document.querySelector('.latest-img');
        const latestLink = document.querySelector('.latest-link');

        if (latestTitle) latestTitle.innerText = mainTitle;
        if (latestDate) latestDate.innerText = formattedDate;
        if (latestExcerpt) latestExcerpt.innerText = mainExcerpt;
        if (latestImg) latestImg.src = mainThumbnail;
        if (latestLink) latestLink.innerText = mainLink;

        // Featured Posts
        const featuredPosts = data.featured;
        for (let i = 0; i < 4; i++) {
            const divid = `fepost${i}`;
            const post = featuredPosts[i];

            const titleEl = document.querySelector(`.${divid}-title`);
            const dateEl = document.querySelector(`.${divid}-date`);
            const excerptEl = document.querySelector(`.${divid}-excerpt`);
            const imgEl = document.querySelector(`.${divid}-img`);
            const linkEl = document.querySelector(`.${divid}-link`);

            if (titleEl) titleEl.innerText = post.title;

            if (dateEl) {
                const FeatDate = post.date;
                const dateObject = new Date(FeatDate);
                const formattedDateFeat = new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                }).format(dateObject);
                dateEl.innerText = formattedDateFeat;
            }

            if (excerptEl) excerptEl.innerText = post.excerpt;
            if (imgEl) imgEl.src = `https://beyondmebtw.com/assets/images/thumbnails/${post.thumbnail}`;
            if (linkEl) linkEl.innerHTML = post.link;
        }

        // Featured Projects
        const featuredProjects = data.projects;
        for (let i = 0; i < 4; i++) {
            const divid = `feproj${i}`;
            const project = featuredProjects[i];

            const titleEl = document.querySelector(`.${divid}-title`);
            const excerptEl = document.querySelector(`.${divid}-excerpt`);
            const linkEl = document.querySelector(`.${divid}-link`);

            if (titleEl) titleEl.innerText = project.title;
            if (excerptEl) excerptEl.innerText = project.excerpt;
            if (linkEl) linkEl.innerHTML = project.link;
        }
    }

    function loadBlogPostsFromData(data) {
        // Check if categories data exists
        if (!data.categories) {
            console.error('No categories data found in latest.json');
            return;
        }

        const categories = data.categories;

        // Map category data to display elements
        const categoryMappings = [
            {
                categoryKey: 'f1arti',
                subcategories: [
                    { subcategoryKey: '2025', elementId: 'f1-2025-latest' },
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