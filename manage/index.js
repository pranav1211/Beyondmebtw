// Generate Featured Forms Template
function generateFeaturedForms() {
    const container = document.getElementById('featured-forms-container');
    
    for (let i = 1; i <= 4; i++) {
        const formHTML = `
            <form action="/update" method="GET" id="featured${i}">
                <h2>Featured ${i}</h2>
                <div class="fepost${i-1}-title disptitle"></div>
                <img class="fepost${i-1}-img dispimg"></img>
                <div class="fepost${i-1}-date dispdate"></div>
                <div class="fepost${i-1}-excerpt dispexcerpt"></div>
                <div class="fepost${i-1}-link displink"></div>
                <input type="hidden" name="instance" value="featured${i}">
                
                <label for="name-featured${i}">Post Name:</label>
                <input type="text" id="name-featured${i}" name="name">

                <label for="date-featured${i}">Publish Date:</label>
                <input type="date" id="date-featured${i}" name="date">

                <label for="excerpt-featured${i}">Excerpt:</label>
                <input type="text" id="excerpt-featured${i}" name="excerpt">

                <label for="thumbnail-featured${i}">Thumbnail Image name:</label>
                <input type="text" id="thumbnail-featured${i}" name="thumbnail">

                <label for="link${i}">Post Link:</label>
                <input type="text" id="link${i}" name="link">

                <label for="key-featured${i}">Password:</label>
                <input type="password" id="key-featured${i}" name="key" required>

                <button type="submit">Submit</button>
            </form>
        `;
        container.innerHTML += formHTML;
    }
}

// Generate Project Forms Template
function generateProjectForms() {
    const container = document.getElementById('project-forms-container');
    
    for (let i = 1; i <= 4; i++) {
        const formHTML = `
            <form action="/update" method="GET" id="project${i}">
                <h2>Project ${i}</h2>
                <div class="feproj${i-1}-title disptitle"></div>
                <div class="feproj${i-1}-excerpt dispexcerpt"></div>
                <div class="feproj${i-1}-link displink"></div>
                <input type="hidden" name="instance" value="project${i}">
                
                <label for="name-project${i}">Project Title:</label>
                <input type="text" id="name-project${i}" name="name">

                <label for="excerpt-project${i}">Project Description:</label>
                <input type="text" id="excerpt-project${i}" name="excerpt">

                <label for="link-project${i}">Project Link:</label>
                <input type="text" id="link-project${i}" name="link">

                <label for="key-project${i}">Password:</label>
                <input type="password" id="key-project${i}" name="key" required>

                <button type="submit">Submit</button>
            </form>
        `;
        container.innerHTML += formHTML;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Generate forms first
    generateFeaturedForms();
    generateProjectForms();

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