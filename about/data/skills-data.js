// Skills Data Structure
const skillsData = {
    "Software Development": {
        icon: "💻",
        subcategories: {
            "Web Development": {
                skills: [
                    { name: "HTML/CSS", icon: "🌐", color: "#E44D26" },
                    { name: "JavaScript", icon: "⚡", color: "#F7DF1E" },
                    { name: "React", icon: "⚛️", color: "#61DAFB" },
                    { name: "Next.js", icon: "▲", color: "#000000" },
                    { name: "Anime.js", icon: "🎬", color: "#FF6B9D" },
                    { name: "Node.js", icon: "🟢", color: "#68A063" },
                    { name: "Vue.js", icon: "💚", color: "#42B883" },
                    { name: "Nginx", icon: "🔧", color: "#009639" },
                    { name: "Tailwind CSS", icon: "🎨", color: "#06B6D4" },
                    { name: "Vercel", icon: "▲", color: "#000000" },
                    { name: "Flask", icon: "🔥", color: "#000000" }
                ]
            },
            "Artificial Intelligence & Machine Learning": {
                skills: [
                    { name: "Tensorflow", icon: "🧠", color: "#FF6F00" },
                    { name: "OpenCV", icon: "👁️", color: "#5C3EE8" },
                    { name: "Pandas", icon: "🐼", color: "#150458" },
                    { name: "DepthAI", icon: "📷", color: "#00BFFF" },
                    { name: "PyTorch", icon: "🔥", color: "#EE4C2C" },
                    { name: "SciKit-Learn", icon: "📊", color: "#F7931E" }
                ]
            },
            "General Programming": {
                skills: [
                    { name: "Python", icon: "🐍", color: "#3776AB" },
                    { name: "JavaScript", icon: "⚡", color: "#F7DF1E" },
                    { name: "Java", icon: "☕", color: "#007396" },
                    { name: "C/C++", icon: "⚙️", color: "#00599C" }
                ]
            }
        },
        application: "Used to create responsive and interactive websites (e.g., this personal portfolio), build machine learning pipelines for image analysis and prediction, and implement backend logic and scripting for various tools and applications."
    },
    "Design & Content": {
        icon: "🎨",
        skills: [
            { name: "Design and Content", icon: "✨", color: "#FF6B9D" },
            { name: "Content Writing", icon: "✍️", color: "#4A90E2" },
            { name: "Graphic Design", icon: "🖼️", color: "#FF7043" },
            { name: "Video Editing", icon: "🎥", color: "#9C27B0" },
            { name: "Content Creation", icon: "📱", color: "#00BCD4" },
            { name: "Digital Marketing", icon: "📈", color: "#4CAF50" }
        ],
        application: "Applied to improve user experience in various projects along with design posters and promotional materials."
    },
    "Professional": {
        icon: "💼",
        skills: [
            { name: "Project Management", icon: "📋", color: "#607D8B" },
            { name: "Event Management", icon: "🎪", color: "#E91E63" },
            { name: "Public Speaking", icon: "🎤", color: "#9C27B0" },
            { name: "Sponsorship", icon: "🤝", color: "#FF9800" }
        ],
        application: "Coordinated events and projects, ensuring smooth execution and stakeholder engagement."
    }
};

export default skillsData;
