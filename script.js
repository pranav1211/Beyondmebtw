// Navigation active state
const homelink = document.querySelector('#home');
const bloglink = document.querySelector('#blog');
const projlink = document.querySelector('#projects');
const aboutlink = document.querySelector('#about');

homelink.style.backgroundColor = '#F4F2EF';

homelink.addEventListener('click', () => {
    window.location = "index.html";
});

bloglink.addEventListener('click', () => {
    window.location = "https://medium.com/@beyondmebtw";
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


document.addEventListener("DOMContentLoaded", () => {
    fetch('manage/latest.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON: ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {

            const mainPost = data.mainPost;
            const mainTitle = mainPost.title;
            const mainDate = mainPost.date;
            const mainExcerpt = mainPost.excerpt;
            const mainThumbnail = mainPost.thumbnail;
            const mainLink = mainPost.link;

            const featuredPosts = data.featured;
            const featuredDetails = featuredPosts.map(post => ({
                title: post.title,
                date: post.date,
                excerpt: post.excerpt,
                thumbnail: post.thumbnail,
                link: post.link
            }));

            document.querySelector('.latest-post-title').innerText = mainTitle;
            document.querySelector('.latest-post-date').innerText = mainDate;
            document.querySelector('.latest-post-excerpt').innerText = mainExcerpt;
            document.querySelector('.latest-post-img').src = "https://beyondmebtw.com/assets/images/thumbnails/" + mainThumbnail;
            document.querySelector('.latest-post-content').onclick = () => window.open(mainLink, '_blank');
            document.querySelector('.read-more').onclick = () => window.open(mainLink, '_blank');

            console.log("Main Post:");
            console.log({ mainTitle, mainDate, mainExcerpt, mainThumbnail, mainLink });

            for (i = 0; i < 4; i++) {
                var divid = "fp" + i                

                document.querySelector("." + divid + "title").innerText = featuredPosts[i].title;
                document.querySelector("." + divid + "date").innerText = featuredPosts[i].date;
                document.querySelector("." + divid + "excerpt").innerText = featuredPosts[i].excerpt;
                document.querySelector("." + divid + "img").src = "https://beyondmebtw.com/assets/images/thumbnails/" + featuredPosts[i].thumbnail;                                
            }
            document.querySelector(".fp0").onclick = () => window.open(featuredPosts[0].link, '_blank');
            document.querySelector(".fp1").onclick = () => window.open(featuredPosts[1].link, '_blank');
            document.querySelector(".fp2").onclick = () => window.open(featuredPosts[2].link, '_blank');
            document.querySelector(".fp3").onclick = () => window.open(featuredPosts[3].link, '_blank');


            console.log("\nFeatured Posts:");
            featuredDetails.forEach((post, index) => {
                console.log(`Featured Post ${index + 1}:`);
                console.log(post);
            });

        })
        .catch((error) => {
            console.error("Error fetching JSON data:", error);
        });
});