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
    }

    function setupContentForms() {
        const forms = document.querySelectorAll("#content-container form:not(.blog-form)");

        forms.forEach(form => {
            // Skip blog forms
            if (form.classList.contains('blog-form') || form.id === 'blog-search-form' || form.id === 'blog-form') {
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

                console.log("Constructed URL:", url);

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
        
        // Blog search form
        const blogSearchForm = document.getElementById("blog-search-form");
        const blogPostDisplay = document.getElementById("blog-post-display");
        const blogForm = document.getElementById("blog-form");
        const updatePostBtn = document.getElementById("update-post-btn");
        const clearBlogFormBtn = document.getElementById("clear-blog-form");

        // Fill blog password fields
        document.getElementById("search-key").value = authKey;
        document.getElementById("blog-key").value = authKey;

        let currentPost = null;

        // Blog search form submission
        blogSearchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const category = document.getElementById("search-category").value;
            const identifier = document.getElementById("search-identifier").value;
            const key = document.getElementById("search-key").value;

            const baseUrl = "https://manage.beyondmebtw.com/searchblogpost";
            const queryString = `category=${encodeURIComponent(category)}&identifier=${encodeURIComponent(identifier)}&key=${encodeURIComponent(key)}`;
            const url = `${baseUrl}?${queryString}`;

            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            throw new Error("Post not found with the given UID or title.");
                        }
                        if (response.status === 403) {
                            throw new Error("Authentication failed. Check your password.");
                        }
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.success && data.post) {
                        currentPost = data.post;
                        displayBlogPost(data.post);
                        blogPostDisplay.style.display = "block";
                    } else {
                        throw new Error("Invalid response from server.");
                    }
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                    blogPostDisplay.style.display = "none";
                });
        });

        // Update post button
        updatePostBtn.addEventListener("click", () => {
            if (currentPost) {
                populateBlogForm(currentPost);
                document.getElementById("blog-form-title").textContent = "Update Blog Post";
                document.getElementById("is-new-post").checked = false;
            }
        });

        // Blog form submission
        blogForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(blogForm);
            const queryStringParams = [];

            formData.forEach((value, key) => {
                if (key === "isNewPost") {
                    queryStringParams.push(`${encodeURIComponent(key)}=${document.getElementById("is-new-post").checked}`);
                } else {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== "") {
                        queryStringParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(trimmedValue)}`);
                    }
                }
            });

            const baseUrl = "https://manage.beyondmebtw.com/blogdata";
            const queryString = queryStringParams.join("&");
            const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            console.log("Constructed blog URL:", url);

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
                })
                .catch((error) => {
                    alert(`Error: ${error.message}`);
                    console.error(error);
                });
        });

        // Clear blog form button
        clearBlogFormBtn.addEventListener("click", clearBlogForm);

        function displayBlogPost(post) {
            document.getElementById("display-uid").textContent = post.uid || "";
            document.getElementById("display-title").textContent = post.title || "";
            document.getElementById("display-date").textContent = post.date || "";
            document.getElementById("display-excerpt").textContent = post.excerpt || "";
            document.getElementById("display-thumbnail").textContent = post.thumbnail || "";
            document.getElementById("display-link").textContent = post.link || "";
            document.getElementById("display-subcategory").textContent = post.subcategory || "";
            document.getElementById("display-secondary-category").textContent = post.secondaryCategory || "";
            document.getElementById("display-secondary-subcategory").textContent = post.secondarySubcategory || "";
        }

        function populateBlogForm(post) {
            document.getElementById("blog-category").value = "";
            document.getElementById("blog-uid").value = post.uid || "";
            document.getElementById("blog-title").value = post.title || "";
            document.getElementById("blog-date").value = post.date || "";
            document.getElementById("blog-excerpt").value = post.excerpt || "";
            document.getElementById("blog-thumbnail").value = post.thumbnail || "";
            document.getElementById("blog-link").value = post.link || "";
            document.getElementById("blog-subcategory").value = post.subcategory || "";
            document.getElementById("blog-secondary-category").value = post.secondaryCategory || "";
            document.getElementById("blog-secondary-subcategory").value = post.secondarySubcategory || "";
            
            // Set category based on search
            const searchCategory = document.getElementById("search-category").value;
            if (searchCategory) {
                document.getElementById("blog-category").value = searchCategory;
            }
        }

        function clearBlogForm() {
            blogForm.reset();
            document.getElementById("blog-key").value = authKey;
            document.getElementById("blog-form-title").textContent = "Add/Update Blog Post";
            document.getElementById("is-new-post").checked = false;
            currentPost = null;
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
                document.querySelector('.latest-img').src = `https://beyondmebtw.com/assets/images/thumbnails/${mainThumbnail}`;
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