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

function renderFeaturedProjects(projects) {
    const container = document.getElementById('projects-grid');
    if (!container || !projects || projects.length === 0) return;
    container.innerHTML = projects.map(proj => `
        <div class="project-card">
            <div class="project-details">
                <div class="project-icon">${proj.logo ? `<img src="${proj.logo}" alt="" style="width:28px;height:28px;object-fit:contain;border-radius:4px">` : '&#9670;'}</div>
                <div>
                    <h3 class="project-title">${proj.title || ''}</h3>
                    <p class="project-desc">${proj.shortDescription || ''}</p>
                </div>
            </div>
            <a href="${proj.link || proj.githubLink || '#'}" target="_blank">
                <button class="project-explore">Explore</button>
            </a>
        </div>
    `).join('');
}

document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
        fetch('https://beyondmebtw.com/manage/latest.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('https://beyondmebtw.com/projects/project-data.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    ]).then(([data, allProjects]) => {
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

        // Render featured posts
        renderFeaturedPosts(data.featured);

        // Render featured projects from latest.json featuredProjects IDs
        if (data.featuredProjects && allProjects) {
            const featured = data.featuredProjects
                .map(id => allProjects.find(p => p.id === id))
                .filter(Boolean);
            renderFeaturedProjects(featured);
        }
    }).catch((error) => {
        console.error("Error fetching JSON data:", error);
    });
});