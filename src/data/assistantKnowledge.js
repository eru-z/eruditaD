export const assistantKnowledge = Object.freeze({
  identity: {
    name: "Erudita Zilbeari",
    roles: ["Full-Stack Web & Mobile Developer", "UI/UX Designer"],
    summary: "Erudita builds polished web applications, mobile applications, business websites, dashboards, and user-focused digital products.",
  },
  navigation: {
    sections: ["Home", "About", "Experience", "Projects", "Stack", "Achievements", "Contact"],
    projectFilters: ["All", "Web", "Mobile", "Platform Web & Mobile", "Client Work"],
    features: ["Dark and light mode", "Project filtering", "Project case studies", "Contact form", "AI portfolio assistant"],
  },
  technologies: {
    frontend: ["HTML", "CSS", "JavaScript", "Bootstrap", "Tailwind", "React.js"],
    mobile: ["React Native"],
    cms: ["WordPress"],
    backend: ["Python", "Node.js", "PHP"],
    databases: ["PostgreSQL", "MySQL"],
    tools: ["Vercel", "GitHub", "Hosting/Domains", "Expo", "Supabase"],
  },
  featuredProjects: ["Pyramid Backstage", "Pizzeria Paradiso", "SciMaster AI"],
  services: ["Web development", "Mobile development", "UI/UX design", "Full-stack solutions"],
  contact: { section: "Contact", email: "eruditazilbearids@gmail.com" },
  unknown: "I don’t have confirmed information about that yet.",
});

export const STARTER_QUESTIONS = [
  "Who is Erudita?",
  "What technologies does she use?",
  "Show me her best projects.",
  "What services does she offer?",
  "How can I contact her?",
];

export const ASSISTANT_ACTIONS = {
  projects: { label: "View Projects", href: "/#projects" },
  experience: { label: "View Experience", href: "/#experience" },
  technologies: { label: "View Technologies", href: "/#stack" },
  contact: { label: "Contact Erudita", href: "/#contact" },
  request: { label: "Request a Project", href: "/#contact" },
};
