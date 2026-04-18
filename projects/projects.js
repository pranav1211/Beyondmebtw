// Define category colors map
const categoryColors = {
  'Web Development': '#4285F4',
  'Mobile App': '#EA4335',
  'Machine Learning': '#34A853',
  'AI/ML': '#34A853',
  'Game Development': '#FBBC05',
  'IoT': '#9C27B0',
  'Backend': '#FF9800',
  'Full Stack': '#00BCD4',
  'Design': '#E91E63',
  'Other': '#607D8B'
};

// Fetch projects data from JSON then initialize Vue app
fetch('./project-data.json')
  .then(res => res.json())
  .then(projectsData => {
    const normalizeProjectImages = images => {
      if (!Array.isArray(images)) return [];
      return images.map(image => {
        if (typeof image === 'string') {
          return { url: image, description: '' };
        }
        return {
          url: image && image.url ? image.url : '',
          description: image && image.description ? image.description : ''
        };
      }).filter(image => image.url);
    };

    new Vue({
      el: '#app',
      data: {
        projects: projectsData.map(project => ({
          ...project,
          images: normalizeProjectImages(project.images)
        })),
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
          if (!this.isExpandedView) {
            this.isExpandedView = true;
          }

          this.selectedProject = projectId;

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
        handleKeydown(event) {
          if (!this.isImageViewerActive) return;
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.nextImage();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.prevImage();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            this.closeImageViewer();
          }
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
        },
        getProjectCover(project) {
          return project.images && project.images.length ? project.images[0].url : project.logo;
        },
        getViewerImage() {
          if (!this.selectedProjectData || !this.selectedProjectData.images[this.currentImageIndex]) return null;
          return this.selectedProjectData.images[this.currentImageIndex];
        }
      },
      mounted() {
        window.addEventListener('keydown', this.handleKeydown);
        const homeLink = document.querySelector('#home');
        const blogLink = document.querySelector('#blog');
        const projLink = document.querySelector('#projects');
        const aboutLink = document.querySelector('#about');

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
      },
      beforeDestroy() {
        window.removeEventListener('keydown', this.handleKeydown);
      }
    });
  })
  .catch(err => {
    console.error('Failed to load project data:', err);
  });
