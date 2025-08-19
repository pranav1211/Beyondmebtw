const projectsData = [
  {
    id: 1,
    title: "Beyond Me Btw",
    shortDescription: "A personal Blog site",
    fullDescription: "• Beyond Me Btw is a personal blog site where I share my thoughts, experiences, and insights on various topics.\n• Features a clean design, easy navigation, and responsive layout for an optimal reading experience.\n• Entirely coded from scratch and hosted on a self-configured nginx-ubuntu server.\n• Serves as both a portfolio of my work and a platform for creating blog posts on various topics.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/bmb/a.webp", "/assets/images/projects/bmb/1.webp", "/assets/images/projects/bmb/2.webp", "/assets/images/projects/bmb/3.webp"],
    link: "https://beyondmebtw.com",
    githubLink: "https://github.com/pranav1211/beyondmebtw",
    category: "Web Development",
    tags: ["HTML", "CSS", "JavaScript", "Node.js", "Backend", "Nginx", "Ubuntu","Vue.js"]
  },
  {
    id: 2,
    title: "Gradient club website",
    shortDescription: "The official website of the Gradient student Club at BMSCE",
    fullDescription: "• Independently designed and developed the official website for the Gradient AI/ML club at BMSCE from scratch.\n• Built using React, Next.js, and Tailwind CSS with a strong emphasis on performance, responsiveness, and modern design.\n• Created a dynamic content server and multiple custom pages to showcase events, team members, and club updates.\n• Managed hosting and deployment on Vercel to ensure reliability, scalability, and ease of maintenance.\n• Helped improve the club's digital presence and engagement with the student and tech community.",
    logo: "https://gradient-content-server.vercel.app/content/Logo.png",
    images: ["/assets/images/projects/grd/Gradient.webp", "https://gradient-content-server.vercel.app/content/gallery/home.png"],
    link: "https://gradientaiml.tech",
    githubLink: "https://github.com/pranav1211/Gradient-website",
    category: "Web Development",
    tags: ["React", "JavaScript", "UI/UX", "Next.js", "Tailwind CSS", "Vercel"]
  },
  {
    id: 3,
    title: "LUMEX AI",
    shortDescription: "An AI-Powered real-time visual assistant",
    fullDescription: "• This project is currently being built.\n• LUMEX (Live Understanding and Mobility EXpert) is an AI-powered real-time visual assistant designed to enhance user interaction with their environment.\n• Utilizes advanced computer vision and machine learning algorithms to provide contextual information, navigation assistance, and real-time object recognition.\n• Serves as a versatile tool for various applications such as smart homes, augmented reality, and personal assistance.\n• Leverages the power of Lidar and depth cameras to create a 3D understanding of the environment.\n• Enables features like obstacle detection and spatial awareness through advanced depth perception.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/lumex.webp"],
    link: "",
    githubLink: "https://github.com/pranav1211/LUMEX-AI",
    category: "AI/ML",
    tags: ["Python", "Computer Vision", "Machine Learning", "Lidar", "Depth Cameras"]
  },
  {
    id: 4,
    title: "Real Time Driver Monitoring System",
    shortDescription: "A monitoring system for driver fatigue and distraction",
    fullDescription: "An AI-powered solution that monitors driver alertness and behavior in real-time, detecting signs of fatigue and distraction to prevent accidents and improve road safety.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/rtdms.webp"],
    link: "https://beyondmebtw.com/projects/rtdms/",
    githubLink: "https://github.com/pranav1211/RTDMS",
    category: "AI/ML",
    tags: ["Python", "Computer Vision", "Machine Learning"]
  },
  {
    id: 5,
    title: "My Library",
    shortDescription: "A personal book collection management application",
    fullDescription: "• A digital library management system allowing users to catalog, search, and organize their book collections.\n• Features include reading progress tracking and book recommendations.\n• The book information is fetched from the Google Books API.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/mylib.webp"],
    link: "https://library.beyondmebtw.com",
    githubLink: "https://github.com/pranav1211/My-Library",
    category: "Full Stack",
    tags: ["JavaScript", "Node.js", "Database", "Vue.js"]
  },
  {
    id: 6,
    title: "Pair Game",
    shortDescription: "A memory matching card game with engaging gameplay",
    fullDescription: "• An interactive memory card game where players need to match pairs of identical cards.\n• Features multiple difficulty levels, score tracking, and engaging animations.\n• Based on the classic memory game concept, This was built as a project for an interview as a tech member of the Gradient AI/ML club at BMSCE.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/pair.webp"],
    link: "https://beyondmebtw.com/projects/pairgame",
    githubLink: "https://github.com/pranav1211/Pair-Game",
    category: "Game Development",
    tags: ["Python", "HTML", "CSS"]
  },  {
    id: 7,
    title: "Uncharted Lost Voyage",
    shortDescription: "An online treasure hunting game",
    fullDescription: "• A digital treasure hunt hosted during Utsav Ananta 2025, where participants raced against time to solve puzzles and outwit competitors. \n • Co-developed with event volunteers; I led puzzle design, system integration, deployment, marketing, and designed the event's visual artwork. \n • Successfully launched as a playable online game post-event under a dedicated subdomain of the GradientAIML.tech website.",
    logo: "https://gradient-content-server.vercel.app/content/Logo.png",
    images: ["https://gradient-content-server.vercel.app/content/utsav25/gallery/unc/ulvfs.png","https://gradient-content-server.vercel.app/content/utsav25/gallery/unc/2.jpeg", "https://gradient-content-server.vercel.app/content/utsav25/gallery/unc/4.jpg"],
    link: "https://uncharted3.gradientaiml.tech",
    githubLink: "https://github.com/pranav1211/Uncharted-3",
    category: "Game Development",
    tags: ["Next.js", "HTML", "CSS", "Vercel"]
  },
  {
    id: 8,
    title: "F1 Haptic Trailer: Android Recreation",
    shortDescription: "A haptic feedback experience for F1 fans",
    fullDescription: "• A digital recreation of the F1 haptic trailer, optimized for Android devices. \n • Features immersive haptic feedback synchronized with video content. \n • Developed using web technologies to ensure broad compatibility.",
    logo: "https://beyondmebtw.com/assets/images/favicon.ico",
    images: ["/assets/images/projects/f1haptic.webp"],
    link: "https://beyondmebtw.com/projects/f1haptic",
    githubLink: "https://github.com/pranav1211/Uncharted-3",
    category: "Game Development",
    tags: ["Next.js", "HTML", "CSS", "Vercel"]
  }

];

export default projectsData;