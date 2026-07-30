import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Eye,
  Grid2X2,
  Image,
  Layers3,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Star,
  StarOff,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { savePortfolioData, uploadMediaFiles, useData } from "../utils/storage.js";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import "../styles/adminprojects.css";

const CURRENT_YEAR = new Date().getFullYear();

const emptyProject = {
  id: "",
  title: "",
  category: "",
  description: "",
  problem: "",
  solution: "",
  results: "",
  projectRole: "",
  techDecisions: "",
  impactDetails: "",
  tags: [],
  filters: [],
  technologies: "",
  year: CURRENT_YEAR,
  status: "Published",
  featured: false,
  liveUrl: "",
  githubUrl: "",
  coverImage: "",
  images: [],
  videoUrl: "",
  videoFile: null,
};

const pageAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
};

export default function ProjectsManager() {
  const [data] = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [modal, setModal] = useState(null);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const projects = useMemo(() => (data?.projects || []).map(normalizeProject), [data?.projects]);

  const categories = useMemo(() => {
    const unique = new Set(projects.map((project) => project.category).filter(Boolean));
    return ["All", ...Array.from(unique).sort()];
  }, [projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const published = projects.filter((project) => project.status === "Published").length;
    const drafts = projects.filter((project) => project.status === "Draft").length;
    const featured = projects.filter((project) => project.featured).length;

    return {
      total,
      published,
      drafts,
      featured,
      categories: Math.max(categories.length - 1, 0),
      publishRate: total ? Math.round((published / total) * 100) : 0,
    };
  }, [categories.length, projects]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...projects]
      .filter((project) => {
        const haystack = [
          project.title,
          project.category,
          project.year,
          project.description,
          project.technologies,
          project.tags?.join(" "),
          project.status,
          project.liveUrl,
          project.githubUrl,
          project.videoUrl,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!search || haystack.includes(search)) &&
          (statusFilter === "All" || project.status === statusFilter) &&
          (categoryFilter === "All" || project.category === categoryFilter)
        );
      })
      .sort((a, b) => sortProjects(a, b, sort));
  }, [categoryFilter, projects, query, sort, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("new") !== "1") return;
    openCreate();
    params.delete("new");
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navigate]);

  function openCreate() {
    setForm({ ...emptyProject, id: `p_${Date.now()}` });
    setTagInput("");
    setActive(null);
    setError("");
    setModal("edit");
  }

  function openEdit(project) {
    setForm({ ...emptyProject, ...project, images: project.images || [] });
    setTagInput((project.tags || []).join(", "));
    setActive(project);
    setError("");
    setModal("edit");
  }

  function openView(project) {
    setActive(project);
    setModal("view");
  }

  function openDelete(project) {
    setActive(project);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setActive(null);
    setError("");
  }

  async function saveProject(event) {
    event?.preventDefault();
    setSaving(true);
    setError("");

    const tags = splitList(tagInput);
    const filters = splitList(form.filters);
    const cleanImages = uniqueImagesByUrl((form.images || []).filter((image) => image?.url));
    const imageUrls = cleanImages.map((image) => image.url);
    const videoUrl = form.videoUrl || form.videoFile?.url || "";
    const title = String(form.title || "").trim() || "Untitled project";
    const category = String(form.category || "").trim();
    const payload = normalizeForSave({
      ...form,
      title,
      category,
      tags,
      filters,
      technologies: form.technologies || tags.join(", "),
      problem: String(form.problem || "").trim(),
      solution: String(form.solution || "").trim(),
      results: String(form.results || "").trim(),
      projectRole: String(form.projectRole || "").trim(),
      techDecisions: splitList(form.techDecisions),
      impactDetails: splitList(form.impactDetails),
      year: Number(form.year) || CURRENT_YEAR,
      status: form.status === "Draft" ? "Draft" : "Published",
      coverImage: form.coverImage || imageUrls[0] || "",
      images: cleanImages,
      screenshots: imageUrls,
      videoUrl,
      video: videoUrl,
      live: form.liveUrl || "",
      github: form.githubUrl || "",
      image: form.coverImage || imageUrls[0] || "",
      type: category || "Project",
      tech: tags,
    });

    const currentProjects = Array.isArray(data?.projects) ? data.projects : [];
    const featuredCount = currentProjects.filter((project) => project.featured && project.id !== payload.id).length;

    if (payload.featured && featuredCount >= 3) {
      setError("Only 3 projects can be featured on the main portfolio. Unfeature another project first.");
      setSaving(false);
      return;
    }

    try {
      const exists = currentProjects.some((project) => project.id === payload.id);
      const nextData = {
        ...data,
        projects: exists
          ? currentProjects.map((project) => (project.id === payload.id ? payload : project))
          : [payload, ...currentProjects],
      };

      await savePortfolioData(nextData);
      closeModal();
    } catch (err) {
      setError(projectSaveError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!active) return;
    setSaving(true);
    setError("");

    try {
      await savePortfolioData({
        ...data,
        projects: (data?.projects || []).filter((project) => project.id !== active.id),
      });
      closeModal();
    } catch (err) {
      setError(err?.message || "Could not delete project from the backend.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(project) {
    setError("");
    const willFeature = !project.featured;
    const featuredCount = (data?.projects || []).filter((item) => item.featured && item.id !== project.id).length;

    if (willFeature && featuredCount >= 3) {
      setError("Only 3 projects can be featured on the main portfolio. Unfeature another project first.");
      return;
    }

    try {
      await savePortfolioData({
        ...data,
        projects: (data?.projects || []).map((item) =>
          item.id === project.id ? { ...item, featured: !item.featured } : item
        ),
      });
    } catch (err) {
      setError(err?.message || "Could not update featured status.");
    }
  }

  async function addImageFiles(files) {
    const selected = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) return;
    setUploading(true);
    setError("");

    try {
      const images = await uploadMediaFiles(selected);
      setForm((current) => {
        const nextImages = uniqueImagesByUrl([...(current.images || []), ...images]);
        return {
          ...current,
          images: nextImages,
          coverImage: current.coverImage || nextImages[0]?.url || "",
        };
      });
    } catch (err) {
      setError(projectSaveError(err, "Could not upload images."));
    } finally {
      setUploading(false);
    }
  }

  async function addVideoFile(files) {
    const selected = Array.from(files || []).filter((file) => file.type === "video/mp4");
    if (!selected.length) {
      setError("Please upload a .mp4 video file.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const [video] = await uploadMediaFiles(selected.slice(0, 1));
      if (!video) return;
      setForm((current) => ({ ...current, videoFile: video, videoUrl: video.url }));
    } catch (err) {
      setError(projectSaveError(err, "Could not upload video."));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(id) {
    setForm((current) => {
      const images = (current.images || []).filter((image) => image.id !== id);
      return {
        ...current,
        images,
        coverImage: images.some((image) => image.url === current.coverImage) ? current.coverImage : images[0]?.url || "",
      };
    });
  }

  const hasFilters = Boolean(query || statusFilter !== "All" || categoryFilter !== "All");

  useEffect(() => {
    if (modal !== "edit") return;
    const onPaste = (event) => {
      const files = Array.from(event.clipboardData?.files || []);
      if (!files.length) return;
      const images = files.filter((file) => file.type.startsWith("image/"));
      const videos = files.filter((file) => file.type === "video/mp4");
      if (images.length) addImageFiles(images);
      if (videos.length) addVideoFile(videos);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [modal]);

  return (
    <AdminLayout
      title="Projects"
      pageClassName="ap-projects-page"
    >
      <motion.section {...pageAnim} className="ap-projects">
        <section className="ap-intro">
          <div className="ap-intro-copy">
            <span className="ap-eyebrow">Erudita Studio / Projects</span>
            <h2>Projects</h2>
            <p>Manage, publish and organize your portfolio work.</p>
          </div>

          <div className="ap-intro-actions">
            <div className="ap-view-toggle" role="tablist" aria-label="View mode">
              <button type="button" onClick={() => setView("grid")} className={view === "grid" ? "active" : ""} aria-label="Grid view">
                <Grid2X2 size={15} />
              </button>
              <button type="button" onClick={() => setView("list")} className={view === "list" ? "active" : ""} aria-label="List view">
                <List size={15} />
              </button>
            </div>
            <a href="/#projects" target="_blank" rel="noreferrer" className="ap-btn ap-btn-secondary">
              <Eye size={15} />
              Preview portfolio
            </a>
            <button type="button" onClick={openCreate} className="ap-btn ap-btn-primary">
              <Plus size={15} />
              New project
            </button>
          </div>
        </section>

        <section className="ap-stats" aria-label="Project statistics">
          <MiniStat icon={Briefcase} tone="blue" label="Total" value={stats.total} note="Portfolio entries" />
          <MiniStat icon={CheckCircle2} tone="violet" label="Published" value={stats.published} note={`${stats.publishRate}% ready`} />
          <MiniStat icon={Pencil} tone="green" label="Drafts" value={stats.drafts} note="Work in progress" />
          <MiniStat icon={Star} tone="orange" label="Featured" value={stats.featured} note="Homepage picks" />
          <MiniStat icon={Layers3} tone="blue" label="Categories" value={stats.categories} note="Project groups" />
        </section>

        <section className="ap-toolbar">
          <label className="ap-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search projects, technology or category..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <Select value={statusFilter} onChange={setStatusFilter} options={["All", "Published", "Draft"]} label="Filter by status" />
          <Select value={categoryFilter} onChange={setCategoryFilter} options={categories} label="Filter by category" />
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="ap-select" aria-label="Sort projects">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A-Z</option>
            <option value="featured">Featured first</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              className="ap-reset"
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
                setCategoryFilter("All");
              }}
              aria-label="Clear filters"
            >
              <X size={15} />
            </button>
          )}

          <div className="ap-results">
            Showing <strong>{filtered.length}</strong> of <strong>{projects.length}</strong> projects
          </div>
        </section>

        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onCreate={openCreate} onClear={() => {
            setQuery("");
            setStatusFilter("All");
            setCategoryFilter("All");
          }} />
        ) : view === "grid" ? (
          <GridView items={filtered} onEdit={openEdit} onDelete={openDelete} onView={openView} onToggleFeatured={toggleFeatured} />
        ) : (
          <ListView items={filtered} onEdit={openEdit} onDelete={openDelete} onView={openView} onToggleFeatured={toggleFeatured} />
        )}
      </motion.section>

      <ProjectModal
        open={modal === "edit"}
        active={active}
        form={form}
        setForm={setForm}
        tagInput={tagInput}
        setTagInput={setTagInput}
        onClose={closeModal}
        onSave={saveProject}
        onAddImages={addImageFiles}
        onAddVideo={addVideoFile}
        onRemoveImage={removeImage}
        saving={saving}
        uploading={uploading}
        error={error}
      />

      <ConfirmDeleteModal open={modal === "delete"} project={active} onClose={closeModal} onDelete={deleteProject} saving={saving} error={error} />
      <PreviewModal open={modal === "view"} project={active} onClose={closeModal} onEdit={openEdit} />
    </AdminLayout>
  );
}

function GridView({ items, onEdit, onDelete, onView, onToggleFeatured }) {
  return (
    <div className="ap-grid">
      {items.map((project, index) => (
        <motion.article
          key={project.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.018, duration: 0.22 }}
          whileHover={{ y: -2 }}
          className="ap-card"
        >
          <div className="ap-card-media">
            <SafeImage src={project.coverImage} alt={project.title} fallback={<MediaFallback title={project.title} />} />
            <div className="ap-card-badges">
              <StatusBadge status={project.status} />
              <button type="button" onClick={() => onToggleFeatured(project)} className={`ap-feature-toggle${project.featured ? " active" : ""}`} aria-label={project.featured ? "Remove from featured" : "Mark as featured"} title="Toggle featured">
                <Star size={13} />
              </button>
            </div>
            <span className="ap-year-pill">{project.year || "No year"}</span>
          </div>

          <div className="ap-card-body">
            <span className="ap-meta">{project.category || "Uncategorized"}</span>
            <h3>{project.title || "Untitled project"}</h3>
            <p>{project.description || "No description added yet."}</p>
            <TechRow items={project.tags?.length ? project.tags : splitList(project.technologies)} />
          </div>

          <div className="ap-card-footer">
            <span>{project.status === "Draft" ? "Draft saved" : "Visible online"}</span>
            <div className="ap-card-actions">
              <IconButton onClick={() => onView(project)} label="Preview project"><Eye size={15} /></IconButton>
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="ap-icon-action" aria-label="Open live project" title="Open live project">
                  <ExternalLink size={15} />
                </a>
              )}
              <IconButton onClick={() => onEdit(project)} label="Edit project"><Pencil size={15} /></IconButton>
              <IconButton danger onClick={() => onDelete(project)} label="Delete project"><MoreHorizontal size={15} /></IconButton>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

function ListView({ items, onEdit, onDelete, onView, onToggleFeatured }) {
  return (
    <div className="ap-table-wrap">
      <div className="ap-table-scroll">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Category</th>
              <th>Featured</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((project) => (
              <tr key={project.id}>
                <td>
                  <div className="ap-row-project">
                    <div className="ap-row-thumb">
                      {project.coverImage ? <img src={project.coverImage} alt="" /> : String(project.title || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{project.title || "Untitled project"}</strong>
                      <span>{project.category || "Uncategorized"}</span>
                    </div>
                  </div>
                </td>
                <td><StatusBadge status={project.status} /></td>
                <td>{project.category || "Uncategorized"}</td>
                <td>
                  <IconButton onClick={() => onToggleFeatured(project)} label="Toggle featured">
                    {project.featured ? <Star size={15} /> : <StarOff size={15} />}
                  </IconButton>
                </td>
                <td>{project.year || "Recently"}</td>
                <td>
                  <div className="ap-row-actions">
                    <IconButton onClick={() => onView(project)} label="View"><Eye size={15} /></IconButton>
                    <IconButton onClick={() => onEdit(project)} label="Edit"><Pencil size={15} /></IconButton>
                    <IconButton danger onClick={() => onDelete(project)} label="Delete"><MoreHorizontal size={15} /></IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectModal({ open, active, form, setForm, tagInput, setTagInput, onClose, onSave, onAddImages, onAddVideo, onRemoveImage, saving, uploading, error }) {
  const submitForm = () => document.getElementById("project-form")?.requestSubmit();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={active ? "Edit project" : "Create project"}
      subtitle={active ? "Refine this project entry and keep the portfolio sharp." : "Add a clean case study to the portfolio."}
      size="lg"
      footer={
        <>
          {error && <span className="mr-auto self-center text-sm font-bold text-red-600">{error}</span>}
          <button type="button" onClick={onClose} disabled={saving || uploading} className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-100 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={submitForm} disabled={saving || uploading} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : active ? "Save changes" : "Create project"}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={onSave} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {uploading && (
          <div className="rounded-2xl border border-blue-500/15 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
            Uploading media to backend...
          </div>
        )}

        <div className="flex items-center gap-4 rounded-[1.5rem] border border-black/10 bg-zinc-50 p-4">
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-200">
            <SafeImage src={form.coverImage} alt="" fallback={<MediaFallback compact />} />
          </div>
          <div>
            <strong className="block text-lg font-black text-black">{form.title || "Untitled project"}</strong>
            <span className="text-sm font-semibold text-zinc-500">{form.category || "Category"} • {form.year || CURRENT_YEAR}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Project title">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Untitled project" />
          </Field>
          <Field label="Category">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Year">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400 min-h-32 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>

        <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
          <div className="mb-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Case study</span>
            <h4 className="mt-1 text-xl font-black tracking-[-0.03em] text-black">Problem, solution, and results</h4>
            <p className="mt-1 text-sm text-zinc-500">These appear on the project case-study page. Leave a field empty to hide that card.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Problem">
              <textarea className="min-h-36 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={form.problem || ""} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="What challenge did this project solve?" />
            </Field>
            <Field label="Solution">
              <textarea className="min-h-36 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={form.solution || ""} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="What did you build or design?" />
            </Field>
            <Field label="Results">
              <textarea className="min-h-36 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={form.results || ""} onChange={(e) => setForm({ ...form, results: e.target.value })} placeholder="What changed after the project?" />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Your role">
              <textarea className="min-h-28 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={form.projectRole || ""} onChange={(e) => setForm({ ...form, projectRole: e.target.value })} placeholder="Example: I led the UI design, frontend architecture, admin workflow, and deployment." />
            </Field>
            <Field label="Tech decisions">
              <textarea className="min-h-28 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={toTextList(form.techDecisions)} onChange={(e) => setForm({ ...form, techDecisions: e.target.value })} placeholder="One per line or comma-separated: React for UI state, Node.js API, PostgreSQL data model" />
            </Field>
          </div>

          <Field label="Impact details">
            <textarea className="min-h-28 w-full resize-y rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-white" value={toTextList(form.impactDetails)} onChange={(e) => setForm({ ...form, impactDetails: e.target.value })} placeholder="One per line or comma-separated: faster booking flow, clearer admin operations, stronger client trust" />
          </Field>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Live URL">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.liveUrl || ""} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Repository URL">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.githubUrl || ""} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tags">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="React, Tailwind, PHP" />
          </Field>
          <Field label="Technologies">
            <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.technologies || ""} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, Tailwind" />
          </Field>
        </div>

        <Field label="Public filters">
          <input
            className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400"
            value={Array.isArray(form.filters) ? form.filters.join(", ") : form.filters || ""}
            onChange={(e) => setForm({ ...form, filters: e.target.value })}
            placeholder="Web, Mobile, Dashboard, AI, Client Work"
          />
          <p className="mt-2 text-xs font-semibold text-zinc-500">
            These are the exact filter chips shown on the public /projects page.
          </p>
        </Field>

        <section className="rounded-[1.5rem] border border-black/10 bg-white p-4">
          <div className="mb-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Media</span>
            <h4 className="mt-1 text-xl font-black tracking-[-0.03em] text-black">Screenshots, cover, and video</h4>
            <p className="mt-1 text-sm text-zinc-500">Upload screenshots, choose a cover image, or attach a short demo video.</p>
          </div>

          <DropZone title="Project images" text="Drop, paste with Ctrl+V, or choose image files" accept="image/*" multiple onFiles={onAddImages} icon={UploadCloud} disabled={uploading || saving} />

          {(form.images || []).length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {form.images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-black/10 bg-zinc-50 p-2">
                  <img src={image.url} alt={image.name} className="h-32 w-full rounded-xl object-cover" />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => setForm({ ...form, coverImage: image.url })} className={`rounded-full px-3 py-1.5 text-xs font-black ${form.coverImage === image.url ? "bg-black text-white" : "bg-white text-black ring-1 ring-black/10"}`}>
                      Cover
                    </button>
                    <button type="button" onClick={() => onRemoveImage(image.id)} className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Video URL">
              <input className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm font-semibold text-black outline-none transition focus:border-black focus:bg-white w-full placeholder:text-zinc-400" value={form.videoUrl || ""} onChange={(e) => setForm({ ...form, videoUrl: e.target.value, videoFile: e.target.value ? null : form.videoFile })} placeholder="https://..." />
            </Field>
            <DropZone title="Video file" text="Drop or choose .mp4 video" accept="video/mp4" onFiles={onAddVideo} icon={Video} disabled={uploading || saving} />
          </div>

          {(form.videoFile?.url || form.videoUrl) && <video src={form.videoFile?.url || form.videoUrl} controls playsInline className="mt-4 max-h-72 w-full rounded-2xl bg-black" />}
        </section>

        <label className="flex cursor-pointer items-center gap-4 rounded-[1.5rem] border border-black/10 bg-zinc-50 p-4">
          <input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-5 w-5 accent-black" />
          <span>
            <strong className="block text-sm font-black text-black">Feature this project</strong>
            <span className="text-sm text-zinc-500">Show it on the main portfolio. Only 3 projects can be featured.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}

function ConfirmDeleteModal({ open, project, onClose, onDelete, saving, error }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete project"
      subtitle="This action cannot be undone."
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-100 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onDelete} disabled={saving} className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50">{saving ? "Deleting..." : "Delete project"}</button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/15 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}
      <p className="text-sm leading-7 text-zinc-600">
        You are about to permanently delete <strong className="text-black">{project?.title || "this project"}</strong>.
      </p>
    </Modal>
  );
}

function PreviewModal({ open, project, onClose, onEdit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project?.title || "Project preview"}
      subtitle={project ? `${project.category || "Uncategorized"} • ${project.year || "No year"}` : ""}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-100">Close</button>
          {project && (
            <button type="button" onClick={() => onEdit(project)} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-xl shadow-black/15">
              <Pencil size={16} />
              Edit project
            </button>
          )}
        </>
      }
    >
      {project && <ProjectPreview project={project} />}
    </Modal>
  );
}

function ProjectPreview({ project }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-[1.5rem] bg-zinc-100">
        <SafeImage src={project.coverImage} alt={project.title} fallback={<MediaFallback />} />
      </div>
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge status={project.status} />
          {project.featured && <FeaturedBadge />}
        </div>
        <p className="text-sm leading-7 text-zinc-600">{project.description || "No description has been added yet."}</p>
        {(project.problem || project.solution || project.results) && (
          <div className="mt-5 grid gap-3">
            {project.problem && <CaseStudyPreview label="Problem" text={project.problem} />}
            {project.solution && <CaseStudyPreview label="Solution" text={project.solution} />}
            {project.results && <CaseStudyPreview label="Results" text={project.results} />}
          </div>
        )}
        {(project.projectRole || project.techDecisions?.length || project.impactDetails?.length) && (
          <div className="mt-5 grid gap-3">
            {project.projectRole && <CaseStudyPreview label="Your role" text={project.projectRole} />}
            {!!project.techDecisions?.length && <CaseStudyPreview label="Tech decisions" text={project.techDecisions.join(" / ")} />}
            {!!project.impactDetails?.length && <CaseStudyPreview label="Impact details" text={project.impactDetails.join(" / ")} />}
          </div>
        )}
        <TechRow items={(project.tags?.length ? project.tags : splitList(project.technologies))} />
        <div className="mt-5 flex flex-wrap gap-3">
          {project.liveUrl && <ProjectLink href={project.liveUrl} label="Live project" />}
          {project.githubUrl && <ProjectLink href={project.githubUrl} label="Repository" />}
          {project.videoUrl && <ProjectLink href={project.videoUrl} label="Video demo" />}
        </div>
        {project.videoFile?.url && <video src={project.videoFile.url} controls playsInline className="mt-5 max-h-72 w-full rounded-2xl bg-black" />}
      </div>
    </div>
  );
}

function CaseStudyPreview({ label, text }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <strong className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">{label}</strong>
      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{text}</p>
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] grid place-items-center bg-black/45 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className={`max-h-[90vh] w-full overflow-hidden rounded-[2rem] border border-white/25 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] ${size === "lg" ? "max-w-5xl" : size === "sm" ? "max-w-md" : "max-w-2xl"}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-2xl font-black tracking-[-0.04em] text-black">{title}</h3>
                {subtitle && <p className="mt-1 text-sm leading-6 text-zinc-500">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 bg-zinc-50 px-5 py-4 sm:px-6">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniStat({ label, value, note, icon: Icon, tone = "blue" }) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={`ap-stat tone-${tone}`}
    >
      <div>
        <span>{label}</span>
        {Icon && <em><Icon size={16} /></em>}
      </div>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </motion.article>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="ap-select">
      {options.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}

function EmptyState({ hasFilters, onCreate, onClear }) {
  return (
    <div className="ap-empty">
      <div className="ap-empty-icon">{hasFilters ? <SearchX size={22} /> : <Briefcase size={22} />}</div>
      <h4>{hasFilters ? "No matching projects" : "No projects yet"}</h4>
      <p>{hasFilters ? "Try a different search or clear the current filters." : "Create your first portfolio project to start building your CMS."}</p>
      <button type="button" onClick={hasFilters ? onClear : onCreate} className="ap-btn ap-btn-primary">
        {hasFilters ? <X size={15} /> : <Plus size={15} />}
        {hasFilters ? "Clear filters" : "Create project"}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status === "Draft" ? "Draft" : "Published";
  return (
    <span className={`ap-status ${normalized === "Draft" ? "is-draft" : "is-published"}`}>
      {normalized}
    </span>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-black text-white">
      <Star size={11} />
      Favorite
    </span>
  );
}

function TechRow({ items }) {
  const all = (items || []).filter(Boolean);
  const visible = all.slice(0, 3);
  if (!visible.length) return null;

  return (
    <div className="ap-tech-row">
      {visible.map((item) => (
        <span key={item}>
          {item}
        </span>
      ))}
      {all.length > visible.length && <span>+{all.length - visible.length}</span>}
    </div>
  );
}

function IconButton({ children, onClick, label, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`ap-icon-action${danger ? " danger" : ""}`}
    >
      {children}
    </button>
  );
}

function SafeImage({ src, alt, fallback }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return fallback;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

function MediaFallback({ compact = false, title = "" }) {
  const initial = String(title || "P").charAt(0).toUpperCase();
  return (
    <div className={`ap-media-fallback${compact ? " compact" : ""}`}>
      <div>
        <Image size={compact ? 20 : 28} />
        {!compact && <strong>{initial}</strong>}
        {!compact && <span>No preview</span>}
      </div>
    </div>
  );
}

function DropZone({ title, text, accept, multiple = false, onFiles, icon: Icon, disabled = false }) {
  const [dragging, setDragging] = useState(false);

  function pickFiles(files) {
    if (disabled) return;
    onFiles(Array.from(files || []));
  }

  return (
    <label
      className={`flex cursor-pointer flex-col justify-center rounded-2xl border border-dashed p-4 transition ${disabled ? "pointer-events-none opacity-55" : dragging ? "border-black bg-zinc-100" : "border-black/20 bg-zinc-50 hover:bg-zinc-100"}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        pickFiles(event.dataTransfer.files);
      }}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData?.files || []);
        if (files.length) {
          event.preventDefault();
          pickFiles(files);
        }
      }}
    >
      <input type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={(event) => { pickFiles(event.target.files); event.target.value = ""; }} className="sr-only" />
      <strong className="flex items-center gap-2 text-sm font-black text-black"><Icon size={16} /> {title}</strong>
      <span className="mt-1 text-xs font-semibold text-zinc-500">{text}</span>
    </label>
  );
}

function ProjectLink({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-black hover:text-white">
      {label}
      <ArrowUpRight size={15} />
    </a>
  );
}

function normalizeProject(project) {
  const tags = project.tags || splitList(project.technologies);
  const cover = project.coverImage || project.image || "";
  const images = project.images || (Array.isArray(project.screenshots) ? project.screenshots.map((url, index) => ({ id: `shot_${index}`, name: `Screenshot ${index + 1}`, url })) : []);
  const videoUrl = project.videoUrl || (typeof project.video === "string" ? project.video : "");

  return {
    ...emptyProject,
    ...project,
    tags,
    filters: splitList(project.filters),
    technologies: project.technologies || tags.join(", "),
    status: project.status === "Draft" ? "Draft" : "Published",
    featured: Boolean(project.featured),
    projectRole: project.projectRole || project.role || "",
    techDecisions: splitList(project.techDecisions),
    impactDetails: splitList(project.impactDetails || project.impact || project.outcomes),
    coverImage: cover,
    images: images.length ? images : (cover ? [{ id: "cover", name: "Cover", url: cover }] : []),
    videoUrl,
    videoFile: videoUrl && videoUrl.startsWith("/uploads/") ? { id: "video", name: "Video", type: "video/mp4", url: videoUrl } : null,
  };
}

function normalizeForSave(project) {
  const { videoFile, ...clean } = project;
  return clean;
}

function uniqueImagesByUrl(images = []) {
  const seen = new Set();
  return images.filter((image) => {
    const url = image?.url;
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function toTextList(value) {
  return Array.isArray(value) ? value.join("\n") : value || "";
}

function projectSaveError(error, fallback = "Could not save project to the backend.") {
  const message = error?.message || "";
  if (/session expired|sign in|unauthorized/i.test(message)) {
    return "Your admin session expired. Sign in again, then retry this action.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Backend is not running. Start it with npm run dev:full, then try Create project again.";
  }
  return message || fallback;
}

function sortProjects(a, b, sort) {
  if (sort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
  if (sort === "featured") return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(b.year || 0) - Number(a.year || 0);
  if (sort === "oldest") return Number(a.year || 0) - Number(b.year || 0);
  return Number(b.year || 0) - Number(a.year || 0);
}
