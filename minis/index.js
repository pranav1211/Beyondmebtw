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
            console.log('Loaded metadata:', this.metadata);
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
            datetime: metadata.datetime || new Date().toISOString(),
            tags: metadata.tags || [],
            content: htmlContent,
            filename: metadata.filename
        };
    }

    renderNewPosts(posts) {
        const container = document.getElementById('postsContainer');
        const fragment = document.createDocumentFragment();

        posts.forEach((post, index) => {
            const postElement = this.createPostElement(post);
            fragment.appendChild(postElement);

            // Add divider between posts (except after the last post)
            if (index < posts.length - 1 || this.posts.length > posts.length) {
                const divider = document.createElement('div');
                divider.className = 'post-divider';
                fragment.appendChild(divider);
            }
        });

        container.appendChild(fragment);
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'mini-post';
        postDiv.setAttribute('data-id', post.id);

        const { formattedDate, formattedTime } = this.parseDateTime(post.datetime);

        postDiv.innerHTML = `
                    <div class="mini-post-header">
                        <div></div>
                        <div class="mini-post-datetime">
                            <div class="mini-post-date">${formattedDate}</div>
                            <div class="mini-post-time">${formattedTime}</div>
                        </div>
                    </div>
                    <div class="mini-post-content">
                        ${post.content}
                    </div>
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="mini-post-tags">
                            ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                `;

        return postDiv;
    }

    parseDateTime(datetime) {
        try {
            // Handle format like: 2025-08-20T13:27GMT+00
            let dateStr = datetime;

            // Extract timezone offset if present
            const gmtMatch = dateStr.match(/GMT([+-]\d{2})/);
            let timezoneOffset = 0;

            if (gmtMatch) {
                timezoneOffset = parseInt(gmtMatch[1]);
                dateStr = dateStr.replace(/GMT[+-]\d{2}/, '');
            }

            // Parse the datetime
            const date = new Date(dateStr);

            // Adjust for timezone offset
            date.setHours(date.getHours() - timezoneOffset);

            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const formattedTime = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            return { formattedDate, formattedTime };
        } catch (error) {
            console.error('Error parsing datetime:', datetime, error);
            return {
                formattedDate: 'Invalid Date',
                formattedTime: ''
            };
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