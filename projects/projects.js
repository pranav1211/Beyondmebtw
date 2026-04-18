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

function loadProjectsData() {
  const storageKey = 'beyondmebtw.projects.cache.v1';
  let cachedProjects = null;

  try {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        cachedProjects = parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to read projects cache:', error);
  }

  return fetch('./project-data.json', { cache: 'no-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load project data: ${res.status}`);
      return res.json();
    })
    .then(data => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save projects cache:', error);
      }
      return data;
    })
    .catch(error => {
      if (cachedProjects) {
        console.warn('Using cached projects data after fetch failure:', error);
        return cachedProjects;
      }
      throw error;
    });
}

// Fetch projects data from JSON then initialize Vue app
loadProjectsData()
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
        projects: projectsData.map(project => {
          const images = normalizeProjectImages(project.images);
          return {
            ...project,
            images,
            coverImage: images[0]?.url || project.logo || ''
          };
        }),
        projectMap: {},
        selectedProject: null,
        isExpandedView: false,
        isImageViewerActive: false,
        currentImageIndex: 0,
        imageZoom: 1,
        touchStartX: 0,
        touchStartY: 0,
        categoryColors: categoryColors,
        preloadedImages: new Set()
      },
      computed: {
        selectedProjectData() {
          if (!this.selectedProject) return null;
          return this.projectMap[this.selectedProject] || null;
        }
      },
      methods: {
        preloadImage(url) {
          if (!url || this.preloadedImages.has(url)) return;
          this.preloadedImages.add(url);
          const image = new Image();
          image.decoding = 'async';
          image.src = url;
        },
        preloadProjectAssets(project) {
          if (!project) return;
          this.preloadImage(project.logo);
          this.preloadImage(project.coverImage);
          project.images.slice(0, 3).forEach(image => this.preloadImage(image.url));
        },
        preloadViewerNeighbors() {
          if (!this.selectedProjectData || !this.selectedProjectData.images.length) return;
          const images = this.selectedProjectData.images;
          const current = images[this.currentImageIndex];
          const next = images[(this.currentImageIndex + 1) % images.length];
          const prev = images[(this.currentImageIndex - 1 + images.length) % images.length];
          [current, next, prev].forEach(image => {
            if (image && image.url) this.preloadImage(image.url);
          });
        },
        selectProject(projectId) {
          if (!this.isExpandedView) {
            this.isExpandedView = true;
          }

          this.selectedProject = projectId;
          this.currentImageIndex = 0;
          this.imageZoom = 1;
          this.preloadProjectAssets(this.projectMap[projectId]);

          this.$nextTick(() => {
            const container = this.$el.querySelector('.projects-container');
            if (container) {
              container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        },
        closeExpandedView() {
          this.isExpandedView = false;
          this.selectedProject = null;
        },
        openImageViewer(index) {
          this.currentImageIndex = index;
          this.imageZoom = 1;
          this.isImageViewerActive = true;
          this.preloadViewerNeighbors();
        },
        closeImageViewer() {
          this.imageZoom = 1;
          this.isImageViewerActive = false;
        },
        toggleImageZoom() {
          this.imageZoom = this.imageZoom > 1 ? 1 : 2;
        },
        zoomIn(event) {
          if (event) event.stopPropagation();
          this.imageZoom = Math.min(this.imageZoom + 0.5, 3);
        },
        zoomOut(event) {
          if (event) event.stopPropagation();
          this.imageZoom = Math.max(this.imageZoom - 0.5, 1);
        },
        handleKeydown(event) {
          if (!this.isImageViewerActive) return;
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.nextImage();
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.prevImage();
          } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            this.zoomIn();
          } else if (event.key === '-') {
            event.preventDefault();
            this.zoomOut();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            this.closeImageViewer();
          }
        },
        nextImage(event) {
          if (event) event.stopPropagation();
          if (!this.selectedProjectData) return;
          this.imageZoom = 1;
          this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedProjectData.images.length;
          this.preloadViewerNeighbors();
        },
        prevImage(event) {
          if (event) event.stopPropagation();
          if (!this.selectedProjectData) return;
          this.imageZoom = 1;
          this.currentImageIndex = (this.currentImageIndex - 1 + this.selectedProjectData.images.length) % this.selectedProjectData.images.length;
          this.preloadViewerNeighbors();
        },
        handleViewerBackgroundClick(event) {
          if (event.target.classList.contains('image-viewer')) {
            this.closeImageViewer();
          }
        },
        handleViewerTouchStart(event) {
          if (!event.touches || !event.touches.length) return;
          this.touchStartX = event.touches[0].clientX;
          this.touchStartY = event.touches[0].clientY;
        },
        handleViewerTouchEnd(event) {
          if (this.imageZoom > 1 || !event.changedTouches || !event.changedTouches.length) return;

          const touch = event.changedTouches[0];
          const deltaX = touch.clientX - this.touchStartX;
          const deltaY = touch.clientY - this.touchStartY;

          if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

          if (deltaX < 0) {
            this.nextImage();
          } else {
            this.prevImage();
          }
        },
        getCategoryColor(category) {
          return this.categoryColors[category] || this.categoryColors['Other'];
        },
        getProjectCover(project) {
          return project.coverImage || project.logo;
        },
        getViewerImage() {
          if (!this.selectedProjectData || !this.selectedProjectData.images[this.currentImageIndex]) return null;
          return this.selectedProjectData.images[this.currentImageIndex];
        }
      },
      mounted() {
        this.projectMap = this.projects.reduce((acc, project) => {
          acc[project.id] = project;
          return acc;
        }, {});

        const warmInitialImages = () => {
          this.projects.slice(0, 6).forEach(project => this.preloadImage(project.coverImage || project.logo));
        };

        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(warmInitialImages, { timeout: 1200 });
        } else {
          window.setTimeout(warmInitialImages, 250);
        }

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
