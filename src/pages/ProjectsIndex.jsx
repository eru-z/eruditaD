import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Code2,
  Globe2,
  Search,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { isAuthed, savePortfolioData, useData } from "../utils/storage.js";
import { listFromBackend } from "../utils/projects.js";
import "./projects-pixel-perfect.css";

const stats = [
  { icon: Code2, value: "20+", label: "Projects Built" },
  { icon: UserRound, value: "10+", label: "Happy Clients" },
  { icon: Star, value: "1st", label: "Science Fair Award" },
  { icon: Globe2, value: "10+", label: "Technologies" },
];

export default function ProjectsIndex() {
  const [data] = useData();
  const location = useLocation();
  const isProjectPage = location.pathname === "/projects";
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [featureError, setFeatureError] = useState("");
  const canManageFeatured = isAuthed();

  const projects = useMemo(() => {
    const backendProjects = listFromBackend(data?.projects || []);
    return backendProjects.slice(0, 10);
  }, [data?.projects]);

  const filters = useMemo(() => buildFilters(projects), [projects]);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const filterText = getFilterText(project);
      const matchesFilter = activeFilter === "All" || filterText.includes(activeFilter.toLowerCase());
      const searchable = [
        project.title,
        project.category,
        project.type,
        project.description,
        project.shortDescription,
        project.year,
        ...(project.tech || []),
        ...(project.tags || []),
        ...(project.filters || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, projects, query]);

  const homeProjects = useMemo(
    () => projects.filter((project) => project.featured).slice(0, 3),
    [projects]
  );

  const defaultFeatured = homeProjects[0] || projects[0] || null;

  async function toggleFeatured(project) {
    if (!canManageFeatured) return;
    setFeatureError("");

    const currentProjects = Array.isArray(data?.projects) ? data.projects : [];
    const rawProject = currentProjects.find((item) => String(item.id) === String(project.id));
    if (!rawProject) return;

    const willFeature = !Boolean(rawProject.featured);
    const featuredCount = currentProjects.filter((item) => item.featured && String(item.id) !== String(project.id)).length;

    if (willFeature && featuredCount >= 3) {
      setFeatureError("Only 3 projects can be featured on the main portfolio.");
      return;
    }

    await savePortfolioData({
      ...data,
      projects: currentProjects.map((item) =>
        String(item.id) === String(project.id)
          ? { ...item, featured: willFeature }
          : item
      ),
    });
  }

  if (isProjectPage) {
    return (
      <ProjectLibraryPage
        projects={projects}
        visibleProjects={visibleProjects}
        filters={filters}
        activeFilter={activeFilter}
        query={query}
        canManageFeatured={canManageFeatured}
        featureError={featureError}
        onFilterChange={setActiveFilter}
        onQueryChange={setQuery}
        onToggleFeatured={toggleFeatured}
        onClear={() => {
          setQuery("");
          setActiveFilter("All");
        }}
      />
    );
  }

  const cards = homeProjects.map((project, index) => ({
    ...project,
    number: project.number || String(index + 1).padStart(2, "0"),
  }));

  const featured =
    cards.find((project) => (project.id || project.title) === selectedId) ||
    defaultFeatured;

  return (
    <section className="projects-section" id="projects">
      <div className="projects-section__grid" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--left" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--right" aria-hidden="true" />

      <div className="projects-shell">
        <div className="projects-hero-grid">
          <div className="projects-intro">
            <div className="projects-eyebrow">
              <span />
              Projects
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
              <Link className="projects-btn projects-btn--dark" to="/projects">
                View all projects
                <ArrowUpRight size={13} />
              </Link>
              <a className="projects-btn projects-btn--light" href="#contact">
                See project planner
                <Sparkles size={13} />
              </a>
            </div>

            <div className="projects-stats" aria-label="Project statistics">
              {stats.map(({ icon: Icon, value, label }) => (
                <article className="projects-stat" key={label}>
                  <span className="projects-stat__icon">
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <strong>{value}</strong>
                  <p>{label}</p>
                </article>
              ))}
            </div>
          </div>

          {featured && (
            <div className="projects-featured" aria-label="Selected project mockup">
              <div className="projects-featured__frame">
                <ProjectBrowser project={featured} />
              </div>
            </div>
          )}
        </div>

        <div className="projects-topbar" id="project-list">
          <p className="projects-featured__label">
            <span />
            {isProjectPage ? "All projects" : "Top projects"}
          </p>
          <Link to="/projects">
            View all projects
            <ArrowUpRight size={12} />
          </Link>
        </div>

        {cards.length ? (
          <div className="projects-grid">
            {cards.map((project, index) => (
              <ProjectCard
                key={project.id || project.title}
                project={project}
                index={index}
                selected={(project.id || project.title) === (featured?.id || featured?.title)}
                onSelect={() => setSelectedId(project.id || project.title)}
              />
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <Sparkles size={20} />
            <strong>No homepage projects selected</strong>
            <p>Open the admin Projects panel and feature up to 3 projects.</p>
          </div>
        )}

        <div className="projects-cta">
          <span className="projects-cta__icon">
            <Sparkles size={22} />
          </span>
          <div className="projects-cta__copy">
            <strong>Have an idea in mind?</strong>
            <p>Let&apos;s turn it into a real, elegant digital product.</p>
          </div>
          <div className="projects-cta__actions">
            <a className="projects-btn projects-btn--dark" href="#contact">
              Start a project
              <ArrowUpRight size={13} />
            </a>
            <a className="projects-btn projects-btn--white" href="#contact">
              AI Project Planner
              <Sparkles size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectLibraryPage({
  projects,
  visibleProjects,
  filters,
  activeFilter,
  query,
  canManageFeatured,
  featureError,
  onFilterChange,
  onQueryChange,
  onToggleFeatured,
  onClear,
}) {
  return (
    <section className="projects-library">
      <div className="projects-section__grid" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--left" aria-hidden="true" />
      <div className="projects-section__glow projects-section__glow--right" aria-hidden="true" />

      <div className="projects-library__shell">
        <div className="projects-library__top">
          <Link className="projects-back" to="/#projects">
            <ArrowLeft size={14} />
            Back
          </Link>

          <div>
            <div className="projects-eyebrow">
              <span />
              Project library
            </div>
            <h1 className="projects-library__title">
              All software projects
              <em>ready to explore.</em>
            </h1>
          </div>

          <div className="projects-library__count">
            <strong>{visibleProjects.length}</strong>
            <span>of {projects.length} projects</span>
          </div>
        </div>

        <div className="projects-library__toolbar">
          <label className="projects-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search projects, stack or category..."
            />
            {query && (
              <button type="button" onClick={() => onQueryChange("")} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </label>

          <div className="projects-filters" aria-label="Project filters">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={filter === activeFilter ? "is-active" : ""}
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {featureError && (
          <div className="projects-feature-error">
            {featureError}
          </div>
        )}

        <div className="projects-library__grid">
          {visibleProjects.map((project, index) => (
            <ProjectCard
              key={project.id || project.title}
              project={{
                ...project,
                number: project.number || String(index + 1).padStart(2, "0"),
              }}
              index={index}
              selected={false}
              onSelect={() => {}}
              showMockupButton={false}
              canManageFeatured={canManageFeatured}
              onToggleFeatured={() => onToggleFeatured(project)}
            />
          ))}
        </div>

        {!visibleProjects.length && (
          <div className="projects-empty">
            <Search size={20} />
            <strong>No projects found</strong>
            <p>Try a different search or clear the active filter.</p>
            <button type="button" onClick={onClear}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectBrowser({ project }) {
  return (
    <div className="projects-browser projects-browser--image-only">
      <div className="projects-browser__hero">
        <img src={getImage(project)} alt={`${project.title} preview`} />
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  selected,
  onSelect,
  showMockupButton = true,
  canManageFeatured = false,
  onToggleFeatured,
}) {
  const tags = (project.tech || project.tags || []).slice(0, 3);

  return (
    <article className={`project-card${selected ? " is-selected" : ""}`}>
      <div className="project-card__media">
        <button
          className="project-card__select"
          type="button"
          onClick={onSelect}
          aria-label={`Show ${project.title} in laptop and mobile mockup`}
        />
        <img src={getImage(project)} alt={`${project.title} preview`} />
        <span className="project-card__number">{project.number || `0${index + 1}`}</span>
        {canManageFeatured ? (
          <button
            className={`project-card__feature-star${project.featured ? " is-active" : ""}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFeatured?.();
            }}
            aria-label={project.featured ? "Remove from main portfolio" : "Feature on main portfolio"}
            title={project.featured ? "Remove from main portfolio" : "Feature on main portfolio"}
          >
            <Star size={14} fill={project.featured ? "currentColor" : "none"} />
          </button>
        ) : (
          <a
            className="project-card__external"
            href={project.liveUrl || project.caseStudyUrl || `/projects/${project.id}`}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Open ${project.title}`}
          >
            <ArrowUpRight size={13} />
          </a>
        )}
      </div>

      <div className="project-card__body">
        <div className="project-card__main">
          <span className="project-card__featured">
            {project.category || "Featured"}
          </span>
          <h3>{project.title}</h3>
          <p>{project.shortDescription || project.description || "Project details are managed from the admin panel."}</p>
          <div className="project-card__tags">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div className="project-card__meta">
          <div>
            <CalendarDays size={12} />
            <span>
              <small>Year</small>
              {project.year || "2025"}
            </span>
          </div>
          <div>
            <BadgeCheck size={12} />
            <span>
              <small>Role</small>
              {project.projectRole || project.role || "Developer"}
            </span>
          </div>
          <div>
            <Globe2 size={12} />
            <span>
              <small>Live</small>
              {project.url || project.liveUrl?.replace(/^https?:\/\//, "") || "View project"}
            </span>
          </div>
          {showMockupButton && (
            <button className="project-card__mockup-btn" type="button" onClick={onSelect}>
              Show mockup
              <ArrowUpRight size={11} />
            </button>
          )}
          <Link to={project.caseStudyUrl || `/projects/${project.id}`}>
            View case study
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function buildFilters(projects) {
  const customFilters = projects.flatMap((project) => project.filters || []).filter(Boolean);
  return ["All", ...Array.from(new Set(customFilters)).sort()];
}

function getFilterText(project) {
  return [
    project.category,
    project.type,
    ...(project.filters || []),
    ...(project.tags || []),
    ...(project.tech || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getImage(project) {
  const image =
    project.coverImage ||
    project.image ||
    project.thumbnail ||
    project.screenshots?.[0]?.url ||
    "";

  if (/^(\/|https?:|data:)/i.test(image)) return image;
  return "/images/ez-logo-blue.png";
}
