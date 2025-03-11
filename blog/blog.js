// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

bloglink.style.backgroundColor = '#F4F2EF';

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