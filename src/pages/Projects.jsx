import React from "react";
import {
  ArrowUpRight,
  Bot,
  Code2,
  ExternalLink,
  Gauge,
  Link2,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import "./projects-pixel-perfect.css";

const stats = [
  { icon: Code2, value: "20+", label: "Projects Built" },
  { icon: UsersRound, value: "10+", label: "Happy Clients" },
  { icon: Trophy, value: "1st", label: "Places & Awards" },
  { icon: Zap, value: "10+", label: "Hackathons" },
];

const projects = [
  {
    number: "01",
    title: "Pizzeria Paradiso",
    subtitle: "Restaurant Website",
    description:
      "Modern restaurant website with online reservations, menu management and a seamless customer experience.",
    role: "Full-Stack Developer",
    year: "2024",
    live: "pizzeriaparadiso.li",
    image: "/images/projects/pizzeria-paradiso.jpg",
    tags: ["HTML", "CSS", "JS", "PHP"],
  },
  {
    number: "02",
    title: "Velon.dev",
    subtitle: "Developer Portfolio",
    description:
      "Personal portfolio website to showcase projects, skills and professional experience.",
    role: "Frontend Developer",
    year: "2024",
    live: "velon.dev",
    image: "/images/projects/velon-dev.jpg",
    tags: ["React", "Tailwind", "Vite"],
  },
  {
    number: "03",
    title: "Dashboard System",
    subtitle: "Admin & Analytics",
    description:
      "Analytics dashboard with charts, real-time data, user management and role permissions.",
    role: "Full-Stack Developer",
    year: "2024",
    live: "dashboard.dev",
    image: "/images/projects/dashboard-system.jpg",
    tags: ["React", "Node.js", "MongoDB"],
  },
];

export default function Projects() {
  return (
    <section className="projects-section" id="projects">
      <div className="projects-section__grid" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--left" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--right" aria-hidden="true" />

      <div className="projects-shell">
        <div className="projects-hero">
          <div className="projects-intro">
            <div className="projects-eyebrow">
              <span />
              PROJECTS
            </div>

            <h2 className="projects-title">
              Software projects
              <em>built to make impact.</em>
            </h2>

            <p className="projects-copy">
              Real-world projects with clean code, modern design and measurable
              results. Each solution is crafted to solve problems and deliver
              value.
            </p>

            <div className="projects-actions">
              <a className="projects-btn projects-btn--dark" href="/projects">
                <span>View all projects</span>
                <ArrowUpRight size={16} strokeWidth={2} />
              </a>

              <button className="projects-btn projects-btn--light" type="button">
                <span>See project planner</span>
                <Sparkles size={17} strokeWidth={1.9} />
              </button>
            </div>

            <div className="projects-stats">
              {stats.map(({ icon: Icon, value, label }) => (
                <article className="projects-stat" key={label}>
                  <span className="projects-stat__icon">
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <strong>{value}</strong>
                  <p>{label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="projects-featured">
            <div className="projects-featured__frame">
              <div className="projects-featured__label">FEATURED PROJECT</div>

              <div className="projects-browser">
                <div className="projects-browser__top">
                  <span className="projects-browser__brand">PARADISO</span>
                  <div className="projects-browser__nav">
                    <span>HOME</span>
                    <span>MENU</span>
                    <span>RESERVIEREN</span>
                    <span>ÜBER UNS</span>
                  </div>
                  <span className="projects-browser__pill">TISCH RESERVIEREN</span>
                </div>

                <div className="projects-browser__hero">
                  <img
                    src="/images/projects/pizzeria-paradiso-featured.jpg"
                    alt="Pizzeria Paradiso website"
                  />
                  <div className="projects-browser__overlay" />
                  <div className="projects-browser__content">
                    <h3>Frisch. Authentisch. Italienisch.</h3>
                    <p>
                      Pizza, Pasta, Salate &amp; Desserts — mit frischen Zutaten
                      zubereitet und mit Liebe serviert.
                    </p>
                    <div>
                      <span>TISCH RESERVIEREN</span>
                      <span>MENÜ ANSEHEN</span>
                    </div>
                  </div>
                </div>

                <div className="projects-phone">
                  <div className="projects-phone__bar">
                    <span>PARADISO</span>
                    <i />
                  </div>
                  <img
                    src="/images/projects/pizzeria-paradiso-mobile.jpg"
                    alt=""
                  />
                  <div className="projects-phone__copy">
                    <strong>Echter Genuss.</strong>
                    <strong>Frisch &amp; mit Liebe gemacht.</strong>
                    <p>Moderne italienische Küche und entspannte Atmosphäre.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="projects-topbar">
          <div className="projects-topbar__label">
            <span />
            TOP PROJECTS
          </div>
          <a href="/projects">
            View all projects
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div className="project-card__media">
                <img src={project.image} alt={project.title} />
                <span className="project-card__number">{project.number}</span>
                <a
                  className="project-card__external"
                  href={`https://${project.live}`}
                  aria-label={`Open ${project.title}`}
                >
                  <ExternalLink size={17} strokeWidth={2} />
                </a>
                <div className="project-card__media-copy">
                  <h3>{project.title}</h3>
                  <p>{project.subtitle}</p>
                </div>
              </div>

              <div className="project-card__body">
                <div className="project-card__main">
                  <span className="project-card__featured">FEATURED</span>
                  <p>{project.description}</p>

                  <div className="project-card__tags">
                    {project.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="project-card__meta">
                  <div>
                    <UserRound size={14} />
                    <span>
                      <small>Role</small>
                      {project.role}
                    </span>
                  </div>

                  <div>
                    <Bot size={14} />
                    <span>
                      <small>Year</small>
                      {project.year}
                    </span>
                  </div>

                  <div>
                    <Link2 size={14} />
                    <span>
                      <small>Live</small>
                      {project.live}
                    </span>
                  </div>

                  <a href={`/projects/${project.number}`}>
                    View case study
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="projects-cta">
          <div className="projects-cta__icon">
            <Sparkles size={28} strokeWidth={1.9} />
          </div>

          <div className="projects-cta__copy">
            <strong>Have an idea in mind?</strong>
            <p>Let&apos;s turn it into a powerful digital product.</p>
          </div>

          <div className="projects-cta__actions">
            <a className="projects-btn projects-btn--dark" href="#contact">
              <span>Start a project</span>
              <ArrowUpRight size={16} />
            </a>

            <button className="projects-btn projects-btn--white" type="button">
              <span>AI Project Planner</span>
              <Sparkles size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}