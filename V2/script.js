// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

homelink.style.backgroundColor = '#F4F2EF';
homelink.style.borderRadius = '60px';

homelink.addEventListener('click', () => {
    window.location = "index.html";
});

bloglink.addEventListener('click', () => {
    window.location = "blog.html";
});

projlink.addEventListener('click', () => {
    window.location = "projects.html";
});

aboutlink.addEventListener('click', () => {
    window.location = "about.html";
});

// Slideshow functionality
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showSlide(n) {
    slides.forEach(slide => {
        slide.classList.remove('active');
    });
    
    slides[n].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Change slide every 5 seconds
setInterval(nextSlide, 5000);

// Read more button
const readMoreBtn = document.querySelector('.read-more');
readMoreBtn.addEventListener('click', () => {
    window.location = "blog/the-day-of-the-jackal-review.html";
});