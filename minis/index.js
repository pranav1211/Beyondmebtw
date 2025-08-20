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
            this.posts.push(...newPosts.filter(post => post !== null));
            this.renderNewPosts(newPosts.filter(post => post !== null));
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
        let lastDate = null;

        posts.forEach((post, index) => {
            const currentDate = post.date;
            const showDate = currentDate !== lastDate;
            
            const postElement = this.createPostElement(post, showDate);
            fragment.appendChild(postElement);

            // Add divider between posts (except after the last post)
            if (index < posts.length - 1 || this.posts.length > posts.length) {
                const divider = document.createElement('div');
                divider.className = 'post-divider';
                fragment.appendChild(divider);
            }

            lastDate = currentDate;
        });

        container.appendChild(fragment);
    }

    createPostElement(post, showDate = true) {
        const postDiv = document.createElement('div');
        postDiv.className = 'mini-post';
        if (!showDate) {
            postDiv.classList.add('time-only');
        }
        postDiv.setAttribute('data-id', post.id);

        const formattedDate = this.formatDate(post.date);
        const formattedTime = this.formatTime(post.time);

        postDiv.innerHTML = `
            <div class="mini-post-header">
                <div class="mini-post-content">
                    ${post.content}
                </div>
                <div class="mini-post-datetime">
                    <div class="mini-post-date">${formattedDate}</div>
                    <div class="mini-post-time">${formattedTime}</div>
                </div>
            </div>
            ${post.tags && post.tags.length > 0 ? `
                <div class="mini-post-tags">
                    ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;

        return postDiv;
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