document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById("login-container");
    const dashboardContainer = document.getElementById("dashboard-container");
    const loginButton = document.getElementById("login-button");
    const loginPassword = document.getElementById("login-password");
    const loginError = document.getElementById("login-error");
    const saveButton = document.getElementById("save-button");
    
    let blogData = null;
    let managekey = localStorage.getItem('blogManagementKey'); // Try to get saved password
    
    // If we have a saved password, try to use it automatically
    if (managekey) {
        attemptLogin(managekey, true);
    }

    // Handle login
    loginButton.addEventListener("click", () => {
        const enteredKey = loginPassword.value;
        
        if (!enteredKey) {
            loginError.innerText = "Password is required";
            return;
        }
        
        attemptLogin(enteredKey, false);
    });
    
    function attemptLogin(key, isAutoLogin) {
        // Verify password with server
        fetch(`https://manage.beyondmebtw.com/verify?key=${encodeURIComponent(key)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Authentication failed");
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    managekey = key;
                    // Save password for future use
                    localStorage.setItem('blogManagementKey', key);
                    
                    loginContainer.style.display = "none";
                    dashboardContainer.style.display = "block";
                    loadBlogData();
                } else {
                    if (isAutoLogin) {
                        // Clear invalid stored password
                        localStorage.removeItem('blogManagementKey');
                    } else {
                        loginError.innerText = "Invalid password";
                    }
                }
            })
            .catch(error => {
                if (!isAutoLogin) {
                    loginError.innerText = "Authentication failed. Please try again.";
                }
                console.error(error);
                
                // Clear potentially invalid stored password
                if (isAutoLogin) {
                    localStorage.removeItem('blogManagementKey');
                }
            });
    }

    // Load blog data
    function loadBlogData() {
        fetch(`https://manage.beyondmebtw.com/data?key=${encodeURIComponent(managekey)}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Authentication failed");
                    }
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                blogData = data;
                populateForms(data);
            })
            .catch(error => {
                console.error("Error loading blog data:", error);
                
                if (error.message.includes("Authentication failed")) {
                    // If authentication failed, return to login
                    dashboardContainer.style.display = "none";
                    loginContainer.style.display = "block";
                    loginPassword.value = "";
                    loginError.innerText = "Your session has expired. Please log in again.";
                    
                    // Clear invalid stored password
                    localStorage.removeItem('blogManagementKey');
                } else {
                    alert("Failed to load blog data. Please refresh the page.");
                }
            });
    }

    // Populate the forms with data
    function populateForms(data) {
        // Populate latest post
        const latest = data.latestPost;
        document.getElementById("latest-title").value = latest.title || "";
        
        // Format date for input field (YYYY-MM-DD)
        if (latest.date) {
            const dateObj = new Date(latest.date);
            const formattedDate = dateObj.toISOString().split('T')[0];
            document.getElementById("latest-date").value = formattedDate;
        }
        
        document.getElementById("latest-excerpt").value = latest.excerpt || "";
        document.getElementById("latest-thumbnail").value = latest.thumbnail || "";
        document.getElementById("latest-link").value = latest.link || "";

        // Clear and repopulate featured posts
        const featuredContainer = document.getElementById("featured-posts");
        featuredContainer.innerHTML = "";

        // Add featured post forms
        data.featuredPosts.forEach((post, index) => {
            const postForm = document.createElement("div");
            postForm.className = "post-edit-form featured-post";
            postForm.dataset.index = index;

            postForm.innerHTML = `
                <h3>Featured Post ${index + 1}</h3>
                <label for="featured-title-${index}">Title:</label>
                <input type="text" id="featured-title-${index}" name="title" value="${post.title || ''}" required>

                <label for="featured-date-${index}">Publish Date:</label>
                <input type="date" id="featured-date-${index}" name="date" required>

                <label for="featured-excerpt-${index}">Excerpt:</label>
                <textarea id="featured-excerpt-${index}" name="excerpt" required>${post.excerpt || ''}</textarea>

                <label for="featured-thumbnail-${index}">Thumbnail Image:</label>
                <input type="text" id="featured-thumbnail-${index}" name="thumbnail" value="${post.thumbnail || ''}" required>

                <label for="featured-link-${index}">Post Link:</label>
                <input type="text" id="featured-link-${index}" name="link" value="${post.link || ''}" required>
            `;

            featuredContainer.appendChild(postForm);

            // Format date for each featured post
            if (post.date) {
                const dateObj = new Date(post.date);
                const formattedDate = dateObj.toISOString().split('T')[0];
                document.getElementById(`featured-date-${index}`).value = formattedDate;
            }
        });
    }

    // Save all changes
    saveButton.addEventListener("click", () => {
        // Gather latest post data
        const latestPost = {
            title: document.getElementById("latest-title").value,
            date: formatDate(document.getElementById("latest-date").value),
            excerpt: document.getElementById("latest-excerpt").value,
            thumbnail: document.getElementById("latest-thumbnail").value,
            link: document.getElementById("latest-link").value
        };

        // Gather featured posts data
        const featuredPosts = [];
        const featuredPostForms = document.querySelectorAll(".featured-post");
        
        featuredPostForms.forEach((form, index) => {
            featuredPosts.push({
                title: document.getElementById(`featured-title-${index}`).value,
                date: formatDate(document.getElementById(`featured-date-${index}`).value),
                excerpt: document.getElementById(`featured-excerpt-${index}`).value,
                thumbnail: document.getElementById(`featured-thumbnail-${index}`).value,
                link: document.getElementById(`featured-link-${index}`).value
            });
        });

        // Prepare data for sending
        const updatedData = {
            latestPost: latestPost,
            featuredPosts: featuredPosts
        };

        // Send data to server
        saveDataToServer(updatedData);
    });

    // Format date to a readable format
    function formatDate(dateStr) {
        if (!dateStr) return "";
        
        const dateObject = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return dateObject.toLocaleDateString('en-US', options);
    }

    // Save data to server
    function saveDataToServer(data) {
        const urlParams = new URLSearchParams();
        urlParams.append('data', JSON.stringify(data));
        urlParams.append('key', managekey);

        fetch(`https://manage.beyondmebtw.com/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlParams
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("Authentication failed. Your session may have expired.");
                }
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                alert("Changes saved successfully!");
                // Reload data to show the latest changes
                loadBlogData();
            } else {
                alert(`Failed to save changes: ${result.message || "Unknown error"}`);
            }
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
            console.error(error);
            
            if (error.message.includes("Authentication failed")) {
                // If authentication failed, return to login
                dashboardContainer.style.display = "none";
                loginContainer.style.display = "block";
                loginPassword.value = "";
                loginError.innerText = "Your session has expired. Please log in again.";
                
                // Clear the stored key if authentication failed
                localStorage.removeItem('blogManagementKey');
            }
        });
    }
});