document.addEventListener("DOMContentLoaded", () => {
    // Global variables
    let blogData = null;
    const serverUrl = "https://manage.beyondmebtw.com";
    
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const dashboardSection = document.getElementById("dashboard-section");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const logoutBtn = document.getElementById("logout-btn");
    const addPostBtn = document.getElementById("add-post-btn");
    const editModal = document.getElementById("edit-modal");
    const closeBtn = document.querySelector(".close-btn");
    const editPostForm = document.getElementById("edit-post-form");
    
    // Check if user is already logged in
    const checkAuthStatus = () => {
        const authToken = localStorage.getItem("authToken");
        if (authToken) {
            loginSection.style.display = "none";
            dashboardSection.style.display = "block";
            fetchBlogData();
        }
    };
    
    // Login form submission
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const password = document.getElementById("password").value;
        
        // Authenticate with server
        fetch(`${serverUrl}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Authentication failed");
            }
            return response.json();
        })
        .then(data => {
            // Store auth token and show dashboard
            localStorage.setItem("authToken", data.token);
            loginSection.style.display = "none";
            dashboardSection.style.display = "block";
            loginForm.reset();
            loginError.textContent = "";
            fetchBlogData();
        })
        .catch(error => {
            loginError.textContent = "Invalid password. Please try again.";
            console.error(error);
        });
    });
    
    // Logout button
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        dashboardSection.style.display = "none";
        loginSection.style.display = "block";
    });
    
    // Fetch blog data from server
    const fetchBlogData = () => {
        const authToken = localStorage.getItem("authToken");
        
        fetch(`${serverUrl}/getdata`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }
            return response.json();
        })
        .then(data => {
            blogData = data;
            renderPosts();
        })
        .catch(error => {
            console.error("Error fetching blog data:", error);
            // If authentication error, log out
            if (error.message.includes("401")) {
                localStorage.removeItem("authToken");
                dashboardSection.style.display = "none";
                loginSection.style.display = "block";
            }
        });
    };
    
    // Render posts on dashboard
    const renderPosts = () => {
        if (!blogData) return;
        
        // Render main post
        const mainPostEl = document.getElementById("main-post");
        mainPostEl.innerHTML = `
            <div class="post-content">
                <h3>${blogData.mainPost.title}</h3>
                <p><strong>Date:</strong> ${blogData.mainPost.date}</p>
                <p><strong>Excerpt:</strong> ${blogData.mainPost.excerpt}</p>
                <p><strong>Thumbnail:</strong> ${blogData.mainPost.thumbnail}</p>
                <p><strong>Link:</strong> ${blogData.mainPost.link}</p>
            </div>
            <button class="edit-btn" data-type="main" data-index="0">Edit</button>
        `;
        
        // Render featured posts
        const featuredPostsEl = document.getElementById("featured-posts");
        featuredPostsEl.innerHTML = "";
        
        blogData.featured.forEach((post, index) => {
            const postEl = document.createElement("div");
            postEl.className = "post-card";
            postEl.innerHTML = `
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p><strong>Date:</strong> ${post.date}</p>
                    <p><strong>Excerpt:</strong> ${post.excerpt}</p>
                    <p><strong>Thumbnail:</strong> ${post.thumbnail}</p>
                    <p><strong>Link:</strong> ${post.link}</p>
                </div>
                <button class="edit-btn" data-type="featured" data-index="${index}">Edit</button>
            `;
            featuredPostsEl.appendChild(postEl);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                openEditModal(btn.dataset.type, parseInt(btn.dataset.index));
            });
        });
    };
    
    // Open edit modal
    const openEditModal = (type, index) => {
        const modalTitle = document.getElementById("modal-title");
        const postIndexInput = document.getElementById("post-index");
        const postTypeInput = document.getElementById("post-type");
        const titleInput = document.getElementById("edit-title");
        const dateInput = document.getElementById("edit-date");
        const excerptInput = document.getElementById("edit-excerpt");
        const thumbnailInput = document.getElementById("edit-thumbnail");
        const linkInput = document.getElementById("edit-link");
        
        // Set modal title based on post type
        modalTitle.textContent = type === "main" ? "Edit Main Post" : `Edit Featured Post ${index + 1}`;
        
        // Set form values
        postIndexInput.value = index;
        postTypeInput.value = type;
        
        const post = type === "main" ? blogData.mainPost : blogData.featured[index];
        
        titleInput.value = post.title;
        
        // Convert date format for date input (MM/DD/YYYY to YYYY-MM-DD)
        const dateParts = post.date.split(/[,\s]+/);
        const month = new Date(`${dateParts[0]} 1, 2000`).getMonth() + 1;
        const day = parseInt(dateParts[1] || 1);
        const year = parseInt(dateParts[2] || 2025);
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        dateInput.value = formattedDate;
        excerptInput.value = post.excerpt;
        thumbnailInput.value = post.thumbnail;
        linkInput.value = post.link;
        
        // Show modal
        editModal.style.display = "flex";
    };
    
    // Close modal when clicking close button
    closeBtn.addEventListener("click", () => {
        editModal.style.display = "none";
    });
    
    // Close modal when clicking outside
    window.addEventListener("click", (event) => {
        if (event.target === editModal) {
            editModal.style.display = "none";
        }
    });
    
    // Handle edit form submission
    editPostForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const postIndex = document.getElementById("post-index").value;
        const postType = document.getElementById("post-type").value;
        const title = document.getElementById("edit-title").value;
        const dateInput = document.getElementById("edit-date").value;
        const excerpt = document.getElementById("edit-excerpt").value;
        const thumbnail = document.getElementById("edit-thumbnail").value;
        const link = document.getElementById("edit-link").value;
        
        // Format date (YYYY-MM-DD to "Month DD, YYYY")
        const dateObj = new Date(dateInput);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);
        
        // Update data based on post type
        if (postType === "main") {
            blogData.mainPost = {
                title,
                date: formattedDate,
                excerpt,
                thumbnail,
                link
            };
        } else {
            blogData.featured[postIndex] = {
                title,
                date: formattedDate,
                excerpt,
                thumbnail,
                link
            };
        }
        
        // Save updated data to server
        saveData();
        
        // Close modal
        editModal.style.display = "none";
    });
    
    // Add new post button
    addPostBtn.addEventListener("click", () => {
        // If we already have 3 featured posts, show error
        if (blogData.featured.length >= 3) {
            alert("You already have 3 featured posts. Please edit or remove one to add a new post.");
            return;
        }
        
        // Create a new post template
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        
        blogData.featured.push({
            title: "New Post",
            date: formattedDate,
            excerpt: "Enter your post excerpt here...",
            thumbnail: "default.jpg",
            link: "https://beyondmebtw.com/posts/new-post"
        });
        
        // Save and re-render
        saveData();
    });
    
    // Save data to server
    const saveData = () => {
        const authToken = localStorage.getItem("authToken");
        
        fetch(`${serverUrl}/updatedata`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(blogData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to save data");
            }
            return response.json();
        })
        .then(data => {
            // Re-render posts
            renderPosts();
            alert("Data saved successfully!");
        })
        .catch(error => {
            console.error("Error saving data:", error);
            alert("Failed to save data. Please try again.");
        });
    };
    
    // Initialize app
    checkAuthStatus();
});