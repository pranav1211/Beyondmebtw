// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

homelink.style.backgroundColor = '#F4F2EF';

homelink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com";
});

bloglink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/blog";
});

projlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/projects";
});

aboutlink.addEventListener('click', () => {
    window.location = "https://beyondmebtw.com/about";
});

const profilePic = document.querySelector('.profile-pic');
if (profilePic) {
    profilePic.addEventListener('mouseover', () => {
        profilePic.style.transform = 'scale(1.03)';
    });

    profilePic.addEventListener('mouseout', () => {
        profilePic.style.transform = 'scale(1)';
    });
}

document.getElementById('copy-email').addEventListener('click', function (event) {
    event.preventDefault();
    const email = "pranav@beyondmebtw.com";

    const gmailUrl = `https://mail.google.com/mail/u/0/?to=${encodeURIComponent(email)}&tf=cm`;

    window.open(gmailUrl, '_blank');
});

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Component creation functions
function createFeaturedPost(post, index) {
    const postDate = new Date(post.date);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(postDate);

    const postElement = document.createElement('div');
    postElement.className = 'featured-post';
    postElement.innerHTML = `
        <img src="${post.thumbnail}" alt="Featured post" class="featured-post-img">
        <div class="featured-post-details">
            <h3 class="featured-post-title">${post.title}</h3>
            <p class="featured-post-date">${formattedDate}</p>
            <p class="featured-post-excerpt">${post.excerpt}</p>
        </div>
        <button class="featured-read-more">Read More</button>
    `;

    postElement.addEventListener('click', () => {
        window.open(post.link, '_blank');
    });

    return postElement;
}

function renderFeaturedPosts(posts) {
    const container = document.getElementById('featured-posts-container');
    container.innerHTML = ''; // Clear existing content

    posts.forEach((post, index) => {
        const postElement = createFeaturedPost(post, index);
        container.appendChild(postElement);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fetch('https://beyondmebtw.com/manage/latest.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            // Handle main post
            const mainPost = data.mainPost;
            const mainDate = new Date(mainPost.date);
            const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
            }).format(mainDate);

            document.querySelector('.latest-post-title').innerText = mainPost.title;
            document.querySelector('.latest-post-date').innerText = formattedDate;
            document.querySelector('.latest-post-excerpt').innerText = mainPost.excerpt;
            document.querySelector('.latest-post-img').src = mainPost.thumbnail;

            document.querySelector('.latest-post-content').onclick = () => window.open(mainPost.link, '_blank');
            document.querySelector('.read-more').onclick = () => window.open(mainPost.link, '_blank');

            // Render featured posts using component approach
            renderFeaturedPosts(data.featured);

        })
        .catch((error) => {
            console.error("Error fetching JSON data:", error);
        });
});