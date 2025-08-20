class MinisApp {
    constructor() {
        this.metadata = [];
        this.posts = [];
        this.currentPage = 0;
        this.postsPerPage = 10;
        this.loading = false;
        this.allLoaded = false;

        this.init();
    }

    async init() {
        await this.loadMetadata();
        await this.loadInitialPosts();
        this.setupEventListeners();
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

        const promises = [];
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.metadata[i];
            promises.push(this.loadPost(item));
        }

        try {
            const newPosts = await Promise.all(promises);
            const validPosts = newPosts.filter(post => post !== null);
            this.posts.push(...validPosts);
            this.renderNewPosts(validPosts);
            this.currentPage++;

            if (endIndex >= this.metadata.length) {
                this.allLoaded = true;
                this.hideLoadMore();
            } else {
                this.showLoadMore();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }

        this.loading = false;
    }

    async loadPost(metadata) {
        try {
            const response = await fetch(`https://minis.beyondmebtw.com/content/${metadata.filename}`);
            if (!response.ok) throw new Error(`Failed to load ${metadata.filename}`);

            const content = await response.text();
            return this.parseMarkdown(content, metadata);
        } catch (error) {
            console.error(`Error loading post ${metadata.filename}:`, error);
            return null;
        }
    }

    parseMarkdown(content, metadata) {
        // Remove frontmatter (everything between --- and ---)
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const cleanContent = content.replace(frontmatterRegex, '').trim();

        // Parse markdown to HTML
        const htmlContent = marked.parse(cleanContent);

        return {
            id: metadata.id || Date.now(),
            date: metadata.date,
            time: metadata.time,
            tags: metadata.tags || [],
            content: htmlContent,
            filename: metadata.filename
        };
    }

    renderNewPosts(posts) {
        const container = document.getElementById('postsContainer');
        const fragment = document.createDocumentFragment();
        
        // Get the last rendered date to compare
        const existingPosts = container.querySelectorAll('.mini-post-container');
        let lastRenderedDate = null;
        if (existingPosts.length > 0) {
            const lastPost = existingPosts[existingPosts.length - 1];
            const lastDateTab = lastPost.querySelector('.date-tab');
            if (lastDateTab) {
                // Extract the date from the formatted date
                lastRenderedDate = this.getDateFromFormattedDate(lastDateTab.textContent);
            }
        }

        posts.forEach((post, index) => {
            const currentDate = post.date;
            const isFirstPost = index === 0 && existingPosts.length === 0;
            const isSameDate = currentDate === lastRenderedDate;
            
            const postElement = this.createPostElement(post, !isSameDate);
            if (isSameDate && !isFirstPost) {
                postElement.classList.add('same-date');
            }
            fragment.appendChild(postElement);

            // Add divider between posts (except after the last post)
            if (index < posts.length - 1 || !this.allLoaded) {
                const divider = document.createElement('div');
                divider.className = 'post-divider';
                
                // Check if next post has same date for reduced spacing
                if (index < posts.length - 1) {
                    const nextPost = posts[index + 1];
                    if (nextPost.date === currentDate) {
                        divider.classList.add('reduced');
                    }
                }
                
                fragment.appendChild(divider);
            }

            lastRenderedDate = currentDate;
        });

        container.appendChild(fragment);
    }

    createPostElement(post, showDate = true) {
        const postContainer = document.createElement('div');
        postContainer.className = 'mini-post-container';
        postContainer.setAttribute('data-id', post.id);

        const formattedDate = this.formatDate(post.date);
        const formattedTime = this.formatTime(post.time);

        // Create date tab if needed
        let dateTabHtml = '';
        if (showDate) {
            dateTabHtml = `<div class="date-tab">${formattedDate}</div>`;
        }

        // Create tags with time as first element
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

        postContainer.innerHTML = `
            ${dateTabHtml}
            <div class="mini-post">
                <div class="mini-post-content">
                    ${post.content}
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
            // Append IST to the time
            return `${timeStr} IST`;
        } catch (error) {
            return timeStr;
        }
    }

    getDateFromFormattedDate(formattedDate) {
        // This is a helper to extract the original date from formatted date
        // Since we're comparing with post.date directly, we need to reverse the formatting
        // This is a simplified approach - in production, you might want to store the original date
        try {
            const date = new Date(formattedDate);
            return date.toISOString().split('T')[0];
        } catch (error) {
            return null;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
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