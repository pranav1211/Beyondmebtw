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

// Profile image hover effect
const profilePic = document.querySelector('.profile-pic');
if (profilePic) {
    profilePic.addEventListener('mouseover', () => {
        profilePic.style.transform = 'scale(1.03)';
    });
    
    profilePic.addEventListener('mouseout', () => {
        profilePic.style.transform = 'scale(1)';
    });
}

// Read more button
const readMoreBtn = document.querySelector('.read-more');
if (readMoreBtn) {
    readMoreBtn.addEventListener('click', () => {
        window.location = "https://medium.com/@beyondmebtw/beyond-me-btw-a-new-chapter-6268aa22a706";
    });
}

var latest = document.querySelector(".latest-post")

latest.addEventListener('click',()=>{
    window.location = 'https://medium.com/@beyondmebtw/beyond-me-btw-a-new-chapter-6268aa22a706'
})

// Project cards hover effects
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-3px)';
        card.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.1)';
    });
    
    card.addEventListener('mouseout', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });
});


document.getElementById('copy-email').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default link behavior

    const email = document.getElementById('email-address').innerText; // Get the email address
    navigator.clipboard.writeText(email) // Copy to clipboard
        .then(() => {
            showToast('Email copied to clipboard!'); // Show toast notification
        })
        .catch((err) => {
            console.error('Failed to copy email: ', err); // Handle errors
        });
});

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message; // Set the toast message
    toast.classList.add('show'); // Make the toast visible

    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

