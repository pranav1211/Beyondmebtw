class MinisApp {
    constructor() {
        this.metadata = [];
        this.posts = [];
        this.currentPage = 0;
        this.postsPerPage = 5;
        this.loading = false;
        this.allLoaded = false;
        this.lastRenderedDate = null; // Track the last rendered date

        this.init();
    }

    async init() {
        await this.loadMetadata();
        await this.loadInitialPosts();
        this.setupEventListeners();
        this.setupIntersectionObserver();
    }

    async loadMetadata() {
        try {
            const response = await fetch('https://minis.beyondmebtw.com/content/metadata.json');
            if (!response.ok) throw new Error('Failed to load metadata');
            this.metadata = await response.json();

            // Sort metadata by date and time (latest first)
            this.metadata.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.time);
                const dateB = new Date(b.date + 'T' + b.time);
                return dateB - dateA;
            });

            console.log('Loaded and sorted metadata:', this.metadata);
        } catch (error) {
            console.error('Error loading metadata:', error);
            this.showNoResults();
        }
    }

    async loadInitialPosts() {
        this.showLoading();
        await this.loadMorePosts();
        this.hideLoading();
    }

    async loadMorePosts() {
        if (this.loading || this.allLoaded) return;

        this.loading = true;
        const startIndex = this.currentPage * this.postsPerPage;
        const endIndex = Math.min(startIndex + this.postsPerPage, this.metadata.length);

        if (startIndex >= this.metadata.length) {
            this.allLoaded = true;
            this.hideLoadMore();
            return;
        }

        // Process posts directly from metadata (no file loading needed)
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.metadata[i];
            try {
                const post = this.createPostFromMetadata(item);
                if (post !== null) {
                    this.renderSinglePost(post);
                    this.posts.push(post);
                }
            } catch (error) {
                console.error(`Error processing post ${item.id}:`, error);
            }
        }

        this.currentPage++;

        if (endIndex >= this.metadata.length) {
            this.allLoaded = true;
            this.hideLoadMore();
        } else {
            this.showLoadMore();
        }

        this.loading = false;
    }

    createPostFromMetadata(metadata) {
        // Create post object directly from metadata since HTML content is already stored
        return {
            id: metadata.id,
            title: metadata.title,
            date: metadata.date,
            time: metadata.time,
            tags: metadata.tags || [],
            htmlContent: metadata.content, // Use the pre-processed HTML content
            rawMarkdown: metadata.rawMarkdown || '', // Keep raw markdown if available
            parsed: true // Already processed
        };
    }

    renderSinglePost(post) {
        const container = document.getElementById('postsContainer');
        const fragment = document.createDocumentFragment();

        const currentDate = post.date;
        const isSameDate = currentDate === this.lastRenderedDate;

        // Create post element with proper date tab visibility
        const postElement = this.createPostElement(post, !isSameDate);

        // Add same-date class if needed
        if (isSameDate) {
            postElement.classList.add('same-date');
            console.log(`Post marked as same-date: ${post.id}, date: ${currentDate}`);
        } else {
            // Update the last rendered date only when we show a new date tab
            this.lastRenderedDate = currentDate;
            console.log(`New date tab shown: ${currentDate}`);
        }

        fragment.appendChild(postElement);

        // Add divider between posts (except after the last post)
        if (!this.allLoaded) {
            const divider = document.createElement('div');
            divider.className = 'post-divider';
            fragment.appendChild(divider);
        }

        container.appendChild(fragment);

        // Setup lazy content loading for this post
        this.setupLazyContentLoading(postElement, post);
    }

    setupLazyContentLoading(postElement, post) {
        const contentElement = postElement.querySelector('.mini-post-content');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && contentElement.innerHTML.includes('placeholder-line')) {
                    // Load the HTML content directly (no markdown parsing needed)
                    contentElement.innerHTML = post.htmlContent;
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px'
        });

        observer.observe(contentElement);
    }

    createPostElement(post, showDate = true) {
        const postContainer = document.createElement('div');
        postContainer.className = 'mini-post-container';
        postContainer.setAttribute('data-id', post.id);

        const formattedDate = this.formatDate(post.date);
        const formattedTime = this.formatTime(post.time);

        // Create date tab HTML - only if showDate is true
        let dateTabHtml = '';
        if (showDate) {
            dateTabHtml = `<div class="date-tab">${formattedDate}</div>`;
            console.log(`Creating date tab for: ${formattedDate}`);
        } else {
            console.log(`No date tab for: ${formattedDate} (same as previous)`);
        }
        
        // Create tags with time
        let tagsHtml = '';
        if (post.tags && post.tags.length > 0 || formattedTime) {
            const timeTag = `<span class="time-tag">${formattedTime}</span>`;
            const regularTags = post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('');
            tagsHtml = `
                <div class="mini-post-meta">
                    ${timeTag}
                    ${regularTags}
                </div>
            `;
        }

        // Loading placeholder
        const loadingPlaceholder = `
            <div class="content-loading-placeholder">
                <div class="placeholder-line"></div>
                <div class="placeholder-line short"></div>
                <div class="placeholder-line"></div>
            </div>
        `;

        postContainer.innerHTML = `
            ${dateTabHtml}
            <div class="mini-post">
                ${titleHtml}
                <div class="mini-post-content">
                    ${loadingPlaceholder}
                </div>
                ${tagsHtml}
            </div>
        `;

        return postContainer;
    }

    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    }

    formatTime(timeStr) {
        try {
            return `${timeStr} IST`;
        } catch (error) {
            return timeStr;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupIntersectionObserver() {
        const loadMoreObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.loading && !this.allLoaded) {
                    this.loadMorePosts();
                }
            });
        }, {
            rootMargin: '200px'
        });

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreObserver.observe(loadMoreBtn);
        }
    }

    setupEventListeners() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.addEventListener('click', () => this.loadMorePosts());

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (!this.loading && !this.allLoaded) {
                    const scrollPosition = window.innerHeight + window.scrollY;
                    const threshold = document.body.offsetHeight - 1000;

                    if (scrollPosition >= threshold) {
                        this.loadMorePosts();
                    }
                }
            }, 100);
        });
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showLoadMore() {
        document.getElementById('loadMoreBtn').style.display = 'block';
    }

    hideLoadMore() {
        document.getElementById('loadMoreBtn').style.display = 'none';
    }

    showNoResults() {
        document.getElementById('noResults').style.display = 'block';
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MinisApp();
});