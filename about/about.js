// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

aboutlink.style.backgroundColor = '#F4F2EF';

homelink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com";
});

bloglink.addEventListener('click', () => {
    window.location = "https://medium.com/@beyondmebtw";
});

projlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/projects";
});

aboutlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/about";
});

// Image slider functionality
document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('.slider-image');
    let currentImageIndex = 0;

    function changeImage() {
        // Remove active class from all images
        images.forEach(img => img.classList.remove('active'));

        // Move to next image
        currentImageIndex = (currentImageIndex + 1) % images.length;

        // Add active class to current image
        images[currentImageIndex].classList.add('active');
    }

    // Change image every 5 seconds
    setInterval(changeImage, 5000);
    
    // Blog title clicks
    const blogTitles = document.querySelectorAll('.blog-title');
    blogTitles.forEach(title => {
        title.addEventListener('click', function () {
            // This would normally navigate to the blog post
            alert('This would navigate to: ' + this.textContent);
        });
    });
});