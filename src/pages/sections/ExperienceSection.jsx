import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Code2,
  MapPin,
  Image,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";

import "./experience.css";

const definesWork = [
  "Production-ready engineering",
  "Real client experience",
  "AI-assisted development",
  "Fast iteration",
];

const techStack = [
  { label: "React", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { label: "Node.js", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
  { label: "Tailwind", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
  { label: "Supabase", logo: "https://cdn.simpleicons.org/supabase/3FCF8E" },
  { label: "AI", icon: Sparkles },
  { label: "GitHub", logo: "https://cdn.simpleicons.org/github/181717" },
];

const aiSummerProgram = {
  id: "digital-school-ai-summer-program",
  title: "Digital School Tetova - Learn & Create with AI (One-Week Summer Program)",
  role: "AI Summer Program",
  category: "Digital School Tetova",
  location: "Tetova",
  description:
    "Intensive AI-focused summer program covering practical AI tools, prompt engineering, rapid prototyping, AI-assisted development, teamwork, and building real-world solutions.",
  tags: ["AI Tools", "Prompt Engineering", "Prototyping", "Teamwork", "AI Development"],
  period: "2025",
  imageUrl: "/images/home-galaxy-dark-v2.png",
};

const fallbackExperience = [
  {
    id: "pizzeria-paradiso",
    title: "Pizzeria Paradiso",
    role: "Full-Stack Website Developer",
    category: "Pizzeria Paradiso",
    location: "Liechtenstein",
    description:
      "Designed, developed, and delivered a production website for a real restaurant client in Liechtenstein. Features online reservations, multilingual content, responsive design, and a premium user experience tailored to the business.",
    tags: ["React", "Tailwind", "UI/UX", "Responsive", "Production"],
    period: "2025",
    imageUrl: "/images/pizzeria-paradiso-cover.png",
    href: "#projects",
  },
  {
    id: "web-development-assistant",
    title: "Web Development Assistant",
    role: "Web Development Assistant",
    category: "Digital School Tetova",
    description:
      "Support students during web development classes by debugging code, explaining technical concepts, and helping students who fall behind catch up, solve problems, and successfully complete their projects.",
    tags: ["HTML", "CSS", "JavaScript", "Debugging", "Mentoring"],
    period: "2022 – Present",
    imageUrl: "/images/home-galaxy-dark-v2.png",
  },
  {
    id: "hackathons",
    title: "Hackathons & Competitions",
    role: "Product Prototyper",
    category: "Hackathons & Competitions",
    description:
      "Shipped product concepts under tight deadlines across hackathons, science fairs, and municipal technology competitions — from idea to functional prototype.",
    tags: ["Hackathons", "Prototyping", "Teamwork", "Pitching", "Agile"],
    period: "2021 – Present",
    imageUrl: "/images/home-galaxy-dark-v2.png",
    href: "#projects",
  },
];

export default function ExperienceSection({ experience = [] }) {
  const reduceMotion = useReducedMotion();

  const items =
    Array.isArray(experience) && experience.length
      ? experience.map(normalizeExperienceItem).map(replaceVelonExperience)
      : fallbackExperience.map(replaceFallbackExperience);

  const timelineItems = items.slice(0, 3);

  return (
    <section id="experience" className="experience-section">
      <div className="experience-effects" aria-hidden="true">
        <span className="xp-orb xp-orb-one" />
        <span className="xp-orb xp-orb-two" />
        <span className="xp-orb xp-orb-three" />
        <span className="xp-star xp-star-one">✦</span>
        <span className="xp-star xp-star-two">✦</span>
      </div>

      <div className="experience-container">
        <motion.aside
          className="experience-intro"
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="experience-eyebrow">
            <span className="experience-eyebrow-dot" />
            Experience
          </div>

          <h2 className="experience-heading">
            Engineering
            <br />
            ideas into
            <br />
            <span>real products.</span>
          </h2>

          <span className="experience-heading-stroke" aria-hidden="true" />

          <p className="experience-description">
            Real client delivery, mentoring, AI learning systems, and deadline-driven prototyping shape how I design, build, and ship.
          </p>

          <div className="experience-glass-panel">
            <div className="experience-panel-title">
              <span className="experience-panel-icon">
                <Code2 size={17} strokeWidth={1.9} />
              </span>
              <span>Engineering approach</span>
            </div>

            <ul className="experience-principles">
              {definesWork.map((item) => (
                <li key={item}>
                  <span className="xp-check">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="experience-panel-divider" />

            <span className="experience-tools-title">Core tools</span>

            <div className="xp-tech-grid">
              {techStack.map(({ label, icon: Icon, logo }) => (
                <div className="xp-tech-item" key={label}>
                  <span className="xp-tech-icon">
                    {logo ? <img src={logo} alt="" /> : <Icon size={22} strokeWidth={1.8} />}
                  </span>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <div className="experience-timeline-wrap">
          <div className="experience-timeline-line" aria-hidden="true" />

          {timelineItems.map((item, index) => (
            <motion.article
              className="experience-entry"
              key={item.id || `${item.title}-${index}`}
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.52,
                delay: reduceMotion ? 0 : index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="experience-node" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="experience-entry-main">
                <div className="experience-meta">
                  <span>
                    <CalendarDays size={15} />
                    {item.period}
                  </span>

                  <i aria-hidden="true" />

                  <span>
                    {index === 0 ? <MapPin size={15} /> : index === 1 ? <UserRound size={15} /> : <Trophy size={15} />}
                    {item.category}
                  </span>

                  <i aria-hidden="true" />

                  <span>
                    <BriefcaseBusiness size={15} />
                    {item.role}
                  </span>
                </div>

                <div className="experience-entry-grid">
                  <div className="experience-entry-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>

                    {!!item.tags?.length && (
                      <div className="experience-tags">
                        {item.tags.slice(0, 5).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ExperiencePreview item={item} />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="xp-closing">
        <span className="xp-closing-icon">
          <Trophy size={18} />
        </span>

        <p>
          Every project. Every challenge. Every deadline.
          <strong>Building today for a better digital tomorrow.</strong>
        </p>

        <a href="/projects" className="xp-closing-cta">
          View All Projects
          <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}


function ExperiencePreview({ item }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(item.imageUrl) && !failed;

  return (
    <div className="experience-image-shell">
      {showImage ? (
        <img src={item.imageUrl} alt={`${item.title} preview`} onError={() => setFailed(true)} />
      ) : (
        <span className="experience-image-placeholder">
          <Image size={28} />
          <strong>{item.title}</strong>
          <small>preview</small>
        </span>
      )}
    </div>
  );
}
function normalizeExperienceItem(item, index) {
  const fallback = fallbackExperience[index % fallbackExperience.length];
  const tags = item.tags || item.tech || item.technologies;

  return {
    ...fallback,
    ...item,
    id: item.id || fallback.id,
    title: item.title || item.role || fallback.title,
    role: item.role || item.position || fallback.role,
    category: item.category || item.company || fallback.category,
    location: item.location || fallback.location || "",
    description: item.description || fallback.description,
    tags: Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    period: item.period || fallback.period,
    imageUrl:
      item.imageUrl ||
      item.thumbnailUrl ||
      item.thumbUrl ||
      fallback.imageUrl ||
      "",
    href: item.href || fallback.href,
  };
}

function replaceVelonExperience(item) {
  const searchable = `${item.id || ""} ${item.title || ""} ${item.role || ""} ${item.category || ""}`.toLowerCase();
  return searchable.includes("velon")
    ? {
        ...item,
        ...aiSummerProgram,
      }
    : item;
}

function replaceFallbackExperience(item) {
  return item.id === "hackathons" ? aiSummerProgram : replaceVelonExperience(item);
}
