// Import data
import skillsData from './data/skills-data.js';
import experienceData from './data/experience-data.js';

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
    window.location = "https://beyondmebtw.com/blog";
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

    // Render skills
    renderSkills();

    // Render experience
    renderExperience();
});

// ========================================
// RENDER SKILLS FUNCTION
// ========================================
function renderSkills() {
    const skillsContainer = document.querySelector('.skills-container');
    if (!skillsContainer) return;

    skillsContainer.innerHTML = '';

    Object.keys(skillsData).forEach(category => {
        const categoryData = skillsData[category];
        const categoryElement = document.createElement('div');
        categoryElement.className = 'skill-category';

        // Category header
        const headerHTML = `
            <div class="skill-category-header">
                <span class="skill-category-icon">${categoryData.icon}</span>
                <h3 class="skill-category-title">${category}</h3>
            </div>
        `;

        // Application description (moved to top)
        const applicationHTML = `
            <div class="skill-application">
                ${categoryData.application}
            </div>
        `;

        let contentHTML = '';

        // Check if this category has subcategories (Software Development)
        if (categoryData.subcategories) {
            contentHTML += '<div class="skill-subcategories">';
            Object.keys(categoryData.subcategories).forEach(subcategory => {
                const subcategoryData = categoryData.subcategories[subcategory];
                contentHTML += `
                    <div class="skill-subcategory">
                        <h4 class="skill-subcategory-title">${subcategory}</h4>
                        <div class="skill-tags-container">
                            ${subcategoryData.skills.map(skill => `
                                <div class="skill-tag" style="border-color: ${skill.color}20;">
                                    <span class="skill-icon">${skill.icon}</span>
                                    <span class="skill-name">${skill.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            contentHTML += '</div>';
        } else {
            // Direct skills array (Design & Content, Professional)
            contentHTML += `
                <div class="skill-tags-container">
                    ${categoryData.skills.map(skill => `
                        <div class="skill-tag" style="border-color: ${skill.color}20;">
                            <span class="skill-icon">${skill.icon}</span>
                            <span class="skill-name">${skill.name}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        categoryElement.innerHTML = headerHTML + applicationHTML + contentHTML;
        skillsContainer.appendChild(categoryElement);
    });
}

// ========================================
// RENDER EXPERIENCE FUNCTION
// ========================================
function renderExperience() {
    const experienceContainer = document.querySelector('.experience-container');
    if (!experienceContainer) return;

    experienceContainer.innerHTML = '';

    experienceData.forEach(org => {
        const orgElement = document.createElement('div');
        orgElement.className = 'organization-group';

        let orgHTML = `<div class="experience-where">${org.organization}</div>`;

        org.roles.forEach(role => {
            orgHTML += `
                <div class="role-container">
                    <div class="experience-role">${role.title}</div>
                    <div class="experience-duration">${role.duration}</div>
                    <div class="experience-about">
                        <ul>
                            ${role.description.map(item => `${item}<br>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });

        orgElement.innerHTML = orgHTML;
        experienceContainer.appendChild(orgElement);
    });
}