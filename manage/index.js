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
        loadBlogPosts();
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
                    
                    // Reload blog posts to show the updated data
                    loadBlogPosts();
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

    function loadBlogPosts() {
        // Load blog posts from different category JSON files
        const categories = [
            { name: 'f1arti', file: 'f1arti.json', subcategories: ['2025', 'general'] },
            { name: 'movietv', file: 'movietv.json', subcategories: ['movies', 'tv'] },
            { name: 'experience', file: 'experience.json', subcategories: [] },
            { name: 'techart', file: 'techart.json', subcategories: [] }
        ];

        categories.forEach(category => {
            fetch(category.file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${category.file}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (category.subcategories.length > 0) {
                        // Handle categories with subcategories
                        category.subcategories.forEach(subcategory => {
                            const elementId = getElementId(category.name, subcategory);
                            const latestPost = getLatestPostBySubcategory(data, subcategory);
                            displayPost(elementId, latestPost);
                        });
                    } else {
                        // Handle categories without subcategories
                        const elementId = getElementId(category.name);
                        const latestPost = getLatestPost(data);
                        displayPost(elementId, latestPost);
                    }
                })
                .catch(error => {
                    console.error(`Error loading ${category.file}:`, error);
                    // Display error message in the respective sections
                    if (category.subcategories.length > 0) {
                        category.subcategories.forEach(subcategory => {
                            const elementId = getElementId(category.name, subcategory);
                            displayError(elementId, `Error loading ${category.name} - ${subcategory}`);
                        });
                    } else {
                        const elementId = getElementId(category.name);
                        displayError(elementId, `Error loading ${category.name}`);
                    }
                });
        });
    }

    function getElementId(category, subcategory = null) {
        const mapping = {
            'f1arti': {
                '2025': 'f1-2025-latest',
                'general': 'f1-general-latest'
            },
            'movietv': {
                'movies': 'movie-latest',
                'tv': 'tv-latest'
            },
            'experience': 'experience-latest',
            'techart': 'tech-latest'
        };

        if (subcategory) {
            return mapping[category][subcategory];
        } else {
            return mapping[category];
        }
    }

    function parseDate(dateString) {
        // Handle date format like "Jun 29, 2025"
        if (!dateString) return new Date(0); // Return epoch if no date
        
        try {
            // First try to parse as is
            let date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // If that fails, try to parse manually
            const parts = dateString.trim().split(/[\s,]+/);
            if (parts.length >= 3) {
                const month = parts[0];
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                const monthMap = {
                    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                };
                
                if (monthMap[month] !== undefined) {
                    return new Date(year, monthMap[month], day);
                }
            }
            
            return new Date(0); // Return epoch if parsing fails
        } catch (error) {
            console.error('Error parsing date:', dateString, error);
            return new Date(0);
        }
    }

    function getLatestPostBySubcategory(data, subcategory) {
        if (!data || !Array.isArray(data)) {
            return null;
        }

        // Filter posts by subcategory and get the latest one
        const filteredPosts = data.filter(post => {
            if (subcategory === '2025') {
                return post.subcategory === '2025';
            } else if (subcategory === 'general') {
                return !post.subcategory || post.subcategory === '' || post.subcategory === 'general';
            } else if (subcategory === 'movies') {
                return post.subcategory === 'movies' || post.subcategory === 'movie';
            } else if (subcategory === 'tv') {
                return post.subcategory === 'tv' || post.subcategory === 'television';
            }
            return false;
        });

        if (filteredPosts.length === 0) {
            return null;
        }

        // Sort by date using custom date parser and return the latest
        return filteredPosts.sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
    }

    function getLatestPost(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return null;
        }

        // Sort by date using custom date parser and return the latest
        return data.sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
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

    function displayError(elementId, errorMessage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="no-posts">${errorMessage}</div>`;
        }
    }

    function showdata() {
        fetch('latest.json')  
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
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

                document.querySelector('.latest-title').innerText = mainTitle;
                document.querySelector('.latest-date').innerText = formattedDate;
                document.querySelector('.latest-excerpt').innerText = mainExcerpt;
                document.querySelector('.latest-img').src = mainThumbnail;
                document.querySelector('.latest-link').innerText = mainLink;

                // Featured Posts
                const featuredPosts = data.featured;
                for (let i = 0; i < 4; i++) {
                    const divid = `fepost${i}`;
                    const post = featuredPosts[i];

                    document.querySelector(`.${divid}-title`).innerText = post.title;

                    const FeatDate = post.date;
                    const dateObject = new Date(FeatDate);
                    const formattedDateFeat = new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                    }).format(dateObject);

                    document.querySelector(`.${divid}-date`).innerText = formattedDateFeat;
                    document.querySelector(`.${divid}-excerpt`).innerText = post.excerpt;
                    document.querySelector(`.${divid}-img`).src = `https://beyondmebtw.com/assets/images/thumbnails/${post.thumbnail}`;
                    document.querySelector(`.${divid}-link`).innerHTML = post.link;
                }

                // Featured Projects
                const featuredProjects = data.projects;
                for (let i = 0; i < 4; i++) {
                    const divid = `feproj${i}`;
                    const project = featuredProjects[i];

                    document.querySelector(`.${divid}-title`).innerText = project.title;
                    document.querySelector(`.${divid}-excerpt`).innerText = project.excerpt;
                    document.querySelector(`.${divid}-link`).innerHTML = project.link;
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    showdata();
});