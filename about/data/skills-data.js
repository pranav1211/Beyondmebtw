// Skills Data Structure
// Expanded from project-data.json tags and experience-data.js stack mentions.
// Restructured Software Development into 4 subcategories (Frontend, Backend
// & Data, AI/ML, Languages) so each one is a tight, scannable group.
const skillsData = {
    "Software Development": {
        icon: "💻",
        subcategories: {
            "Frontend": {
                skills: [
                    { name: "HTML/CSS", icon: "🌐", color: "#E44D26" },
                    { name: "JavaScript", icon: "⚡", color: "#F7DF1E" },
                    { name: "Vue.js", icon: "💚", color: "#42B883" },
                    { name: "Vue 3", icon: "🟢", color: "#42B883" },
                    { name: "Pinia", icon: "🍍", color: "#FFD43B" },
                    { name: "React", icon: "⚛️", color: "#61DAFB" },
                    { name: "Next.js", icon: "▲", color: "#000000" },
                    { name: "Tailwind CSS", icon: "🎨", color: "#06B6D4" },
                    { name: "PWA", icon: "📱", color: "#5A0FC8" },
                    { name: "Anime.js", icon: "🎬", color: "#FF6B9D" }
                ]
            },
            "Backend & Data": {
                skills: [
                    { name: "Node.js", icon: "🟢", color: "#68A063" },
                    { name: "Flask", icon: "🔥", color: "#000000" },
                    { name: "MongoDB", icon: "🍃", color: "#47A248" },
                    { name: "PostgreSQL", icon: "🐘", color: "#4169E1" },
                    { name: "Supabase", icon: "⚡", color: "#3ECF8E" },
                    { name: "IndexedDB", icon: "💾", color: "#4285F4" },
                    { name: "Nginx", icon: "🔧", color: "#009639" },
                    { name: "Ubuntu", icon: "🐧", color: "#E95420" },
                    { name: "Postman", icon: "📮", color: "#FF6C37" },
                    { name: "Vercel", icon: "▲", color: "#000000" }
                ]
            },
            "AI / ML & Computer Vision": {
                skills: [
                    { name: "Python", icon: "🐍", color: "#3776AB" },
                    { name: "TensorFlow", icon: "🧠", color: "#FF6F00" },
                    { name: "PyTorch", icon: "🔥", color: "#EE4C2C" },
                    { name: "OpenCV", icon: "👁️", color: "#5C3EE8" },
                    { name: "Computer Vision", icon: "📷", color: "#00BFFF" },
                    { name: "DepthAI", icon: "🌊", color: "#00ACEE" },
                    { name: "Pandas", icon: "🐼", color: "#150458" },
                    { name: "SciKit-Learn", icon: "📊", color: "#F7931E" }
                ]
            },
            "Languages": {
                skills: [
                    { name: "Python", icon: "🐍", color: "#3776AB" },
                    { name: "JavaScript", icon: "⚡", color: "#F7DF1E" },
                    { name: "Java", icon: "☕", color: "#007396" },
                    { name: "C / C++", icon: "⚙️", color: "#00599C" }
                ]
            }
        },
        application: "Used to ship responsive websites (this portfolio, the Gradient AI/ML club site, BeyondMoney finance PWA), build computer vision and ML pipelines for projects like LUMEX AI and the Driver Monitoring System, and own the backend/infrastructure on a self-managed nginx + Ubuntu server."
    },
    "Design & Photography": {
        icon: "🎨",
        skills: [
            { name: "UI / UX Design", icon: "✨", color: "#FF6B9D" },
            { name: "Graphic Design", icon: "🖼️", color: "#FF7043" },
            { name: "Photography", icon: "📸", color: "#1A1A1A" },
            { name: "Adobe Lightroom", icon: "🌅", color: "#31A8FF" },
            { name: "Adobe Photoshop", icon: "🖌️", color: "#001E36" },
            { name: "Video Editing", icon: "🎥", color: "#9C27B0" },
            { name: "Content Writing", icon: "✍️", color: "#4A90E2" },
            { name: "Content Creation", icon: "📱", color: "#00BCD4" },
            { name: "Digital Marketing", icon: "📈", color: "#4CAF50" }
        ],
        application: "Drives the visual identity of every project I ship — from interface polish on BeyondMoney and the Mynyl vinyl player, to photo series on photos.beyondmebtw, event posters during Gradient Week, and the written voice of Beyond Me Btw itself."
    },
    "Professional": {
        icon: "💼",
        skills: [
            { name: "Project Management", icon: "📋", color: "#607D8B" },
            { name: "Event Management", icon: "🎪", color: "#E91E63" },
            { name: "Public Speaking", icon: "🎤", color: "#9C27B0" },
            { name: "Sponsorship", icon: "🤝", color: "#FF9800" },
            { name: "Mentoring", icon: "🧭", color: "#26A69A" },
            { name: "Team Coordination", icon: "👥", color: "#5C6BC0" }
        ],
        application: "Coordinated and led tech-team events at the Gradient AI/ML club — Uncharted: Lost Voyage, Maze Maniac Resurrected, Parallel Fusion — handling sponsorship, marketing, and stakeholder engagement end-to-end."
    }
};

export default skillsData;
