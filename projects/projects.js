// Import the projects data
import projectsData from './project-data.js';

// Define category colors map
const categoryColors = {
  'Web Development': '#4285F4',
  'Mobile App': '#EA4335',
  'Machine Learning': '#34A853',
  'Game Development': '#FBBC05',
  'IoT': '#9C27B0',
  'Backend': '#FF9800',
  'Design': '#E91E63',
  'Other': '#607D8B'
};

// Initialize Vue application
new Vue({
    el: '#app',
    data: {
        projects: projectsData,
        selectedProject: null,
        isExpandedView: false,
        isImageViewerActive: false,
        currentImageIndex: 0,
        categoryColors: categoryColors
    },
    computed: {
        selectedProjectData() {
            if (!this.selectedProject) return null;
            return this.projects.find(p => p.id === this.selectedProject);
        }
    },
    methods: {
        selectProject(projectId) {
            // If this is the first project selection, switch to expanded view
            if (!this.isExpandedView) {
                this.isExpandedView = true;
            }

            // Select the project
            this.selectedProject = projectId;

            // Only scroll on mobile (width <= 768px), desktop just opens in place
            this.$nextTick(() => {
                if (window.innerWidth <= 768) {
                    const container = this.$el.querySelector('.projects-container');
                    if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        },
        closeExpandedView() {
            this.isExpandedView = false;
            this.selectedProject = null;
        },
        openImageViewer(index) {
            this.currentImageIndex = index;
            this.isImageViewerActive = true;
        },
        closeImageViewer() {
            this.isImageViewerActive = false;
        },
        nextImage(event) {
            if (event) event.stopPropagation();
            if (!this.selectedProjectData) return;

            this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedProjectData.images.length;
        },
        prevImage(event) {
            if (event) event.stopPropagation();
            if (!this.selectedProjectData) return;

            this.currentImageIndex = (this.currentImageIndex - 1 + this.selectedProjectData.images.length) % this.selectedProjectData.images.length;
        },
        handleViewerBackgroundClick(event) {
            if (event.target.classList.contains('image-viewer')) {
                this.closeImageViewer();
            }
        },
        getCategoryColor(category) {
            return this.categoryColors[category] || this.categoryColors['Other'];
        }
    },
    mounted() {
        // Set up navigation links
        const homeLink = document.querySelector('#home');
        const blogLink = document.querySelector('#blog');
        const projLink = document.querySelector('#projects');
        const aboutLink = document.querySelector('#about');

        // Set active state for projects link
        projLink.style.backgroundColor = '#F4F2EF';

        homeLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com";
        });

        blogLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/blog";
        });

        projLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/projects";
        });

        aboutLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/about";
        });
    }
});