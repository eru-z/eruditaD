import { assetUrl } from "./assets.js";

const FALLBACK_IMAGE = "/images/ez-logo-blue.png";

export function listFromBackend(projects = []) {
  return projects
    .filter((project) => project.status !== "Draft")
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(b.year || 0) - Number(a.year || 0))
    .map(normalizePublicProject);
}

export function normalizePublicProject(project = {}) {
  const tags = splitList(project.tags?.length ? project.tags : project.technologies || project.tech);
  const images = imageUrls(project).map(assetUrl);
  const coverImage = assetUrl(project.coverImage || project.image || images[0] || FALLBACK_IMAGE);
  const screenshots = images.length ? images : [coverImage];
  const rawVideoUrl = project.videoUrl || (typeof project.video === "string" ? project.video : project.video?.url || "");
  const videoUrl = assetUrl(rawVideoUrl);
  const category = project.category || project.type || "Project";
  const type = project.type || project.category || "Project";
  const filters = splitList(project.filters);

  return {
    ...project,
    id: project.id || slugify(project.title || "project"),
    title: project.title || "Untitled Project",
    category,
    type,
    description: project.description || "A portfolio project managed from the Erudita admin dashboard.",
    status: project.status || "Published",
    year: project.year || new Date().getFullYear(),
    featured: Boolean(project.featured),
    coverImage,
    image: coverImage,
    mobileCoverImage: project.mobileCoverImage || screenshots[1] || coverImage,
    liveUrl: project.liveUrl || project.live || "",
    githubUrl: project.githubUrl || project.github || "",
    caseStudyUrl: `/projects/${project.id || slugify(project.title || "project")}`,
    tech: tags,
    tags,
    technologies: tags.join(", "),
    filters: filters.length ? filters : buildProjectFilters({ category, type, tags }),
    video: videoUrl ? { title: `${project.title || "Project"} video`, duration: project.videoDuration || "", url: videoUrl } : null,
    videoUrl,
    screenshots: screenshots.map((url, index) => ({
      label: index === 0 ? "Cover" : `Screen ${index + 1}`,
      title: project.title || "Project preview",
      type: "desktop",
      url,
    })),
    problem: project.problem || "",
    solution: project.solution || "",
    results: project.results || "",
    projectRole: project.projectRole || project.role || "",
    impactDetails: splitList(project.impactDetails || project.impact || project.outcomes),
    architecture: splitList(project.architecture),
    techDecisions: splitList(project.techDecisions),
    metrics: {
      impact: project.metrics?.impact || "A",
      performance: project.metrics?.performance || "95",
      accessibility: project.metrics?.accessibility || "95",
      seo: project.metrics?.seo || "95",
    },
    accent: project.accent || "#2563EB",
    tone: project.tone || "light",
    timeline: project.timeline || `${project.year || new Date().getFullYear()} project sprint.`,
  };
}

function buildProjectFilters({ category = "", type = "", tags = [] }) {
  const haystack = `${category} ${type} ${tags.join(" ")}`.toLowerCase();
  const filters = [];
  if (/web|site|react|vite|next|frontend|full-stack|dashboard|admin/i.test(haystack)) filters.push("Web");
  if (/mobile|react native|expo|app/i.test(haystack)) filters.push("Mobile");
  if (/\bai\b|artificial|machine|model/i.test(haystack)) filters.push("AI");
  if (/dashboard|admin|crm|panel|analytics|operations/i.test(haystack)) filters.push("Dashboard");
  if (/client|restaurant|agency|freelance|business/i.test(haystack)) filters.push("Client Work");
  return filters.length ? filters : ["Web"];
}

export function screenshotUrl(screenshot) {
  return typeof screenshot === "string" ? screenshot : screenshot?.url;
}

function imageUrls(project) {
  const fromImages = Array.isArray(project.images)
    ? project.images.map((image) => (typeof image === "string" ? image : image?.url))
    : [];
  const fromScreenshots = Array.isArray(project.screenshots)
    ? project.screenshots.map((shot) => (typeof shot === "string" ? shot : shot?.url))
    : [];
  return [...fromImages, ...fromScreenshots, project.coverImage, project.image]
    .filter(Boolean)
    .filter((url, index, all) => all.indexOf(url) === index);
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `project-${Date.now()}`;
}
