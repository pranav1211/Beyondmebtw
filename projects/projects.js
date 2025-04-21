// Import the projects data
import projectsData from './project-data.js';

// Initialize Vue application
new Vue({
    el: '#app',
    data: {
        projects: projectsData,
        selectedProject: null,
        projectSlides: {}, // Tracks current slide for each project
        slideIntervals: {} // Tracks slideshow intervals for each project
    },
    methods: {
        toggleProject(projectId) {
            // If already selected, close it
            if (this.selectedProject === projectId) {
                this.closeProject();
                return;
            }
            
            // If another project is expanded, close it first
            if (this.selectedProject !== null) {
                this.stopSlideshow(this.selectedProject);
            }
            
            // Expand selected project
            this.selectedProject = projectId;
            
            // Initialize slide index if not already set
            if (this.projectSlides[projectId] === undefined) {
                this.$set(this.projectSlides, projectId, 0);
            }
            
            // Scroll to the expanded project with smooth animation
            this.$nextTick(() => {
                const expandedCard = document.querySelector('.project-card.expanded');
                if (expandedCard) {
                    const headerOffset = 100;
                    const elementPosition = expandedCard.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
            
            // Start slideshow for this project
            this.startSlideshow(projectId);
        },
        closeProject(event) {
            if (event) event.stopPropagation();
            
            // Stop slideshow for current project
            if (this.selectedProject !== null) {
                this.stopSlideshow(this.selectedProject);
            }
            
            this.selectedProject = null;
        },
        nextSlide(project) {
            const currentIndex = this.projectSlides[project.id] || 0;
            this.$set(this.projectSlides, project.id, (currentIndex + 1) % project.images.length);
        },
        prevSlide(project) {
            const currentIndex = this.projectSlides[project.id] || 0;
            this.$set(this.projectSlides, project.id, (currentIndex - 1 + project.images.length) % project.images.length);
        },
        startSlideshow(projectId) {
            this.stopSlideshow(projectId); // Clear any existing interval
            
            // Start a new interval for this project
            const interval = setInterval(() => {
                if (this.selectedProject === projectId) {
                    const project = this.projects.find(p => p.id === projectId);
                    if (project) {
                        this.nextSlide(project);
                    }
                } else {
                    this.stopSlideshow(projectId);
                }
            }, 5000); // Change slide every 5 seconds
            
            this.$set(this.slideIntervals, projectId, interval);
        },
        stopSlideshow(projectId) {
            const interval = this.slideIntervals[projectId];
            if (interval) {
                clearInterval(interval);
                this.$delete(this.slideIntervals, projectId);
            }
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

        // Add click event listeners
        homeLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com";
        });

        blogLink.addEventListener('click', () => {
            window.location = "https://medium.com/@beyondmebtw";
        });

        projLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/projects";
        });

        aboutLink.addEventListener('click', () => {
            window.location = "https://beyondmebtw.com/about";
        });
        
        // Handle clicks outside of project cards to close expanded card
        document.addEventListener('click', (e) => {
            if (this.selectedProject !== null) {
                const clickedInsideCard = e.target.closest('.project-card');
                const clickedCloseButton = e.target.closest('.close-btn');
                
                if (!clickedInsideCard || clickedCloseButton) {
                    this.closeProject();
                }
            }
        });
        
        // Cleanup event listener on component destroy
        this.$once('hook:beforeDestroy', () => {
            document.removeEventListener('click', this.handleOutsideClick);
        });
    },
    beforeDestroy() {
        // Clean up all slideshow intervals
        Object.keys(this.slideIntervals).forEach(projectId => {
            this.stopSlideshow(projectId);
        });
    }
});