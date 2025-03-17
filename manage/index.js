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
    }

    function setupContentForms() {
        const forms = document.querySelectorAll("#content-container form");

        forms.forEach(form => {
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

    function showdata() {
        fetch('latest.json')            
            // fetch('https://beyondembtw.com/manage/latest.json')
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

    showdata()
});