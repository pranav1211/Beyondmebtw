document.addEventListener("DOMContentLoaded", () => {
    // Authentication check first
    if (!checkAuthentication()) {
        return; // Don't initialize the app if not authenticated
    }

    // Initialize the minis app
    new MinisApp();
});

// Authentication functions
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function isAuthenticated() {
    return getCookie('beyondme_auth') === "true";
}

function checkAuthentication() {
    const isLoggedIn = isAuthenticated();

    if (!isLoggedIn) {
        // Show loading message briefly before redirect
        const authLoading = document.getElementById("auth-loading");
        if (authLoading) {
            authLoading.style.display = "block";
        }

        // Hide content containers while redirecting
        const contentContainer = document.getElementById("content-container");
        if (contentContainer) {
            contentContainer.style.display = "none";
        }

        // Redirect after a brief delay
        setTimeout(() => {
            window.location.href = 'https://manage.beyondmebtw.com/index.html';
        }, 1000);
        return false;
    }

    return true;
}

class MinisApp {
    constructor() {
        this.postsContainer = document.getElementById('postsContainer');
        this.loadingContainer = document.getElementById('loadingContainer');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.noResults = document.getElementById('noResults');
        
        this.posts = [];
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.isLoading = false;
        this.hasMorePosts = true;
        this.renderedPosts = new Set(); // Track which posts have been rendered
        
        // Intersection Observer for lazy markdown parsing
        this.markdownObserver = new IntersectionObserver(
            this.handleMarkdownIntersection.bind(this),
            { rootMargin: '200px' } // Start loading 200px before element comes into view
        );
        
        this.initializeEventListeners();
        this.loadPosts();
    }

    initializeEventListeners() {
        this.loadMoreBtn.addEventListener('click', () => {
            this.loadPosts();
        });
    }

    async loadPosts() {
        if (this.isLoading || !this.hasMorePosts) return;
        
        this.setLoading(true);
        
        try {
            const response = await fetch(`https://minis.beyondmebtw.com/api/posts?page=${this.currentPage}&limit=${this.postsPerPage}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            
            const data = await response.json();
            
            if (data.posts && data.posts.length > 0) {
                this.posts.push(...data.posts);
                this.renderNewPosts(data.posts);
                this.currentPage++;
                
                // Check if we have more posts
                if (data.posts.length < this.postsPerPage || data.hasMore === false) {
                    this.hasMorePosts = false;
                    this.loadMoreBtn.style.display = 'none';
                }
            } else {
                this.hasMorePosts = false;
                this.loadMoreBtn.style.display = 'none';
                
                if (this.posts.length === 0) {
                    this.noResults.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            this.hasMorePosts = false;
            this.loadMoreBtn.style.display = 'none';
            
            if (this.posts.length === 0) {
                this.noResults.style.display = 'block';
            }
        } finally {
            this.setLoading(false);
        }
    }

    renderNewPosts(newPosts) {
        const fragment = document.createDocumentFragment();
        let lastDate = this.getLastRenderedDate();
        
        newPosts.forEach((post, index) => {
            const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const isSameDate = postDate === lastDate;
            
            // Add divider if not same date and not the first post overall
            if (!isSameDate && (this.posts.length > newPosts.length || index > 0)) {
                const divider = this.createDivider(isSameDate);
                fragment.appendChild(divider);
            }
            
            const postElement = this.createPostElement(post, postDate, isSameDate);
            fragment.appendChild(postElement);
            
            lastDate = postDate;
        });
        
        this.postsContainer.appendChild(fragment);
    }

    createPostElement(post, postDate, isSameDate) {
        const container = document.createElement('div');
        container.className = `mini-post-container${isSameDate ? ' same-date' : ''}`;
        
        // Create date tab
        if (!isSameDate) {
            const dateTab = document.createElement('div');
            dateTab.className = 'date-tab';
            dateTab.textContent = postDate;
            container.appendChild(dateTab);
        }
        
        // Create post card
        const postCard = document.createElement('div');
        postCard.className = 'mini-post';
        
        // Create content div with placeholder that will be replaced by markdown
        const contentDiv = document.createElement('div');
        contentDiv.className = 'mini-post-content';
        contentDiv.dataset.rawContent = post.content; // Store raw content for lazy loading
        contentDiv.innerHTML = '<div class="content-placeholder">Loading content...</div>';
        
        // Create meta section
        const metaDiv = document.createElement('div');
        metaDiv.className = 'mini-post-meta';
        
        // Add time tag
        const timeTag = document.createElement('span');
        timeTag.className = 'time-tag';
        timeTag.textContent = new Date(post.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        metaDiv.appendChild(timeTag);
        
        // Add regular tags
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                metaDiv.appendChild(tagElement);
            });
        }
        
        postCard.appendChild(contentDiv);
        postCard.appendChild(metaDiv);
        container.appendChild(postCard);
        
        // Set up lazy loading for markdown
        this.markdownObserver.observe(contentDiv);
        
        return container;
    }

    handleMarkdownIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const contentDiv = entry.target;
                const rawContent = contentDiv.dataset.rawContent;
                
                if (rawContent && contentDiv.querySelector('.content-placeholder')) {
                    // Use requestIdleCallback for better performance, fallback to setTimeout
                    if (window.requestIdleCallback) {
                        requestIdleCallback(() => this.parseMarkdown(contentDiv, rawContent));
                    } else {
                        setTimeout(() => this.parseMarkdown(contentDiv, rawContent), 0);
                    }
                    
                    // Stop observing this element
                    this.markdownObserver.unobserve(contentDiv);
                }
            }
        });
    }

    parseMarkdown(contentDiv, rawContent) {
        try {
            const htmlContent = marked.parse(rawContent);
            contentDiv.innerHTML = htmlContent;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            contentDiv.innerHTML = rawContent; // Fallback to raw content
        }
    }

    createDivider(isSameDate) {
        const divider = document.createElement('div');
        divider.className = `post-divider${isSameDate ? ' reduced' : ''}`;
        return divider;
    }

    getLastRenderedDate() {
        const lastContainer = this.postsContainer.lastElementChild;
        if (lastContainer && lastContainer.classList.contains('mini-post-container')) {
            const dateTab = lastContainer.querySelector('.date-tab');
            return dateTab ? dateTab.textContent : null;
        }
        return null;
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        
        if (isLoading) {
            this.loadingSpinner.style.display = 'block';
            this.loadMoreBtn.style.display = 'none';
        } else {
            this.loadingSpinner.style.display = 'none';
            if (this.hasMorePosts) {
                this.loadMoreBtn.style.display = 'block';
            }
        }
    }
}