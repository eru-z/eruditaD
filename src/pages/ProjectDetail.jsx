import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Images,
  Rocket,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { fadeUp, stagger } from "../utils/animations.js";
import { useData } from "../utils/storage.js";
import { listFromBackend } from "../utils/projects.js";

function GlassPanel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[22px] border border-white/90 bg-white/70 shadow-[0_24px_70px_-52px_rgba(37,99,235,.6)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function InfoBlock({ title, text, icon: Icon }) {
  if (!text) return null;

  return (
    <article className="group rounded-[20px] border border-white/90 bg-white/72 p-4 shadow-[0_22px_60px_-48px_rgba(37,99,235,.58)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-[#BFDBFE]">
      <div className="flex items-center gap-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
        <span className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/90 bg-[#EAF3FF]">
          <Icon size={15} />
        </span>
        {title}
      </div>

      <p className="mt-3 line-clamp-5 text-[11px] font-semibold leading-5 text-[#526174]">
        {text}
      </p>

      <span className="mt-4 block h-[2px] w-7 rounded-full bg-[#2563EB] transition-all duration-300 group-hover:w-12" />
    </article>
  );
}

function EvidencePanel({ title, items = [], text = "", icon: Icon }) {
  const visibleItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!text && !visibleItems.length) return null;

  return (
    <article className="rounded-[22px] border border-white/90 bg-white/72 p-5 shadow-[0_24px_70px_-54px_rgba(37,99,235,.72)] backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/90 bg-[#EAF3FF] text-[#2563EB]">
          <Icon size={16} />
        </span>
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
          {title}
        </h2>
      </div>

      {text && (
        <p className="mt-4 text-[12px] font-semibold leading-6 text-[#526174]">
          {text}
        </p>
      )}

      {!!visibleItems.length && (
        <ul className="mt-4 grid gap-2.5">
          {visibleItems.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 rounded-[14px] border border-[#DCE8F8]/80 bg-white/62 px-3 py-2.5 text-[11px] font-bold leading-5 text-[#526174]"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB] shadow-[0_0_0_4px_rgba(37,99,235,.08)]" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function CompactRelatedCard({ project }) {
  const screenshots = getScreenshots(project);
  const cover =
    project.coverImage ||
    project.image ||
    project.thumbnail ||
    screenshots[0] ||
    "";

  return (
    <Link
      to={`/projects/${project.slug || project.id}`}
      className="group overflow-hidden rounded-[20px] border border-white/90 bg-white/72 p-2.5 shadow-[0_22px_60px_-48px_rgba(37,99,235,.55)] backdrop-blur-2xl transition hover:-translate-y-1"
    >
      <div className="h-[126px] overflow-hidden rounded-[15px] bg-[#EAF3FF]">
        {cover ? (
          <img
            src={cover}
            alt={`${project.title} preview`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.2),transparent_55%),linear-gradient(135deg,#F7FAFF,#E6F0FF)]">
            <Sparkles size={22} className="text-[#2563EB]/50" />
          </div>
        )}
      </div>

      <div className="px-1 pb-1 pt-3">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#2563EB]">
          {getProjectType(project)}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <h3 className="line-clamp-1 text-[15px] font-black tracking-[-0.03em] text-[#07111F]">
            {project.title}
          </h3>
          <ArrowUpRight
            size={13}
            className="shrink-0 text-[#2563EB] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [data] = useData();
  const [mediaModal, setMediaModal] = useState(null);

  const backendProjects = useMemo(
    () => listFromBackend(data?.projects || []),
    [data?.projects]
  );

  const project =
    backendProjects.find(
      (item) =>
        String(item.id) === String(projectId) ||
        String(item.slug) === String(projectId)
    );

  if (!project) return <Navigate to="/projects" replace />;

  const screenshots = getScreenshots(project);
  const videoUrl = getVideoUrl(project);
  const tech = project.tech || project.tags || [];
  const hasCaseStudy =
    Boolean(project.problem) || Boolean(project.solution) || Boolean(project.results);
  const hasEvidence =
    Boolean(project.projectRole) ||
    Boolean(project.techDecisions?.length) ||
    Boolean(project.impactDetails?.length);

  const related = backendProjects
    .filter((item) => String(item.id) !== String(project.id))
    .slice(0, 3);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F9FF] px-4 pb-14 pt-6 text-[#07111F] sm:px-6 lg:px-8">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(96,165,250,0.20),transparent_30rem),radial-gradient(circle_at_6%_34%,rgba(37,99,235,0.09),transparent_28rem),linear-gradient(180deg,#FCFDFF_0%,#EEF5FF_48%,#F8FBFF_100%)]" />
        <div className="absolute inset-x-4 bottom-4 top-4 rounded-[32px] border border-white/80" />
        <div className="absolute left-[5%] top-[18%] h-[90px] w-[110px] opacity-25 [background-image:radial-gradient(#2563EB_1px,transparent_1.2px)] [background-size:11px_11px]" />
      </div>

      <motion.article
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1320px]"
      >
        <motion.div variants={fadeUp} className="pt-3">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/76 px-4 py-2 text-[8px] font-black uppercase tracking-[0.08em] text-[#07111F] shadow-[0_14px_34px_-28px_rgba(2,6,23,.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-[#2563EB]"
          >
            <ArrowLeft size={12} />
            Back to Projects
          </Link>
        </motion.div>

        <motion.section
          variants={fadeUp}
          className="mt-5 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/72 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#2563EB] shadow-sm backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              {getProjectType(project)}
              {project.status ? ` / ${project.status}` : ""}
              {project.year ? ` / ${project.year}` : ""}
            </div>

            <h1 className="mt-4 max-w-[620px] font-display text-[42px] font-black leading-[0.95] tracking-[-0.06em] sm:text-[54px] xl:text-[62px]">
              {project.title}
            </h1>

            <p className="mt-4 max-w-[610px] text-[12px] font-semibold leading-6 text-[#526174] sm:text-[13px]">
              {project.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 text-[9px] font-black uppercase tracking-[0.06em] text-white transition hover:-translate-y-0.5"
                >
                  Live project
                  <ExternalLink size={12} />
                </a>
              )}

              {videoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setMediaModal({
                      type: "video",
                      videoUrl,
                    })
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#DCE8F8] bg-white/84 px-5 text-[9px] font-black uppercase tracking-[0.06em] text-[#2563EB] transition hover:-translate-y-0.5 hover:bg-[#EEF4FF]"
                >
                  <Film size={12} />
                  Demo video
                </button>
              )}

              {!!screenshots.length && (
                <button
                  type="button"
                  onClick={() =>
                    setMediaModal({
                      type: "screenshots",
                      screenshots,
                    })
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#DCE8F8] bg-white/84 px-5 text-[9px] font-black uppercase tracking-[0.06em] text-[#2563EB] transition hover:-translate-y-0.5 hover:bg-[#EEF4FF]"
                >
                  <Images size={12} />
                  Screenshots
                </button>
              )}
            </div>

            {!!tech.length && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tech.slice(0, 7).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#DCE8F8] bg-white/80 px-3 py-1.5 text-[8px] font-black text-[#2563EB] shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[#60A5FA]/14 blur-3xl" />

            <ProjectCover
              project={project}
              screenshot={screenshots[0]}
              onOpen={() =>
                screenshots.length &&
                setMediaModal({
                  type: "screenshots",
                  screenshots,
                })
              }
            />
          </div>
        </motion.section>

        {hasCaseStudy && (
          <motion.section
            variants={fadeUp}
            className="mt-5 grid gap-4 md:grid-cols-3"
          >
            <InfoBlock
              title="Problem"
              text={project.problem}
              icon={BrainCircuit}
            />
            <InfoBlock title="Solution" text={project.solution} icon={Rocket} />
            <InfoBlock title="Results" text={project.results} icon={Trophy} />
          </motion.section>
        )}

        {hasEvidence && (
          <motion.section
            variants={fadeUp}
            className="mt-4 grid gap-4 lg:grid-cols-3"
          >
            <EvidencePanel
              title="My role"
              text={project.projectRole}
              icon={Sparkles}
            />
            <EvidencePanel
              title="Tech decisions"
              items={project.techDecisions}
              icon={Rocket}
            />
            <EvidencePanel
              title="Impact details"
              items={project.impactDetails}
              icon={Trophy}
            />
          </motion.section>
        )}

        {!!related.length && (
          <motion.section variants={fadeUp} className="mt-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-[23px] font-black tracking-[-0.05em]">
                Related Projects
              </h2>

              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#2563EB]"
              >
                View all
                <ArrowUpRight size={11} />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <CompactRelatedCard key={item.id} project={item} />
              ))}
            </div>
          </motion.section>
        )}
      </motion.article>

      <AnimatePresence>
        {mediaModal && (
          <ProjectMediaModal
            project={project}
            modal={mediaModal}
            onClose={() => setMediaModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectCover({ project, screenshot, onOpen }) {
  const cover =
    project.coverImage ||
    project.image ||
    project.thumbnail ||
    screenshot ||
    "";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!screenshot}
      className="group relative block w-full overflow-hidden rounded-[24px] border border-white/90 bg-white/72 p-2.5 text-left shadow-[0_30px_90px_-55px_rgba(37,99,235,.8)] backdrop-blur-2xl disabled:cursor-default"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-[#EAF3FF]">
        {cover ? (
          <img
            src={cover}
            alt={`${project.title} interface`}
            className="h-full w-full object-cover transition duration-500 group-enabled:group-hover:scale-[1.025]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.22),transparent_55%),linear-gradient(135deg,#F7FAFF,#E6F0FF)]">
            <Sparkles size={28} className="text-[#2563EB]/50" />
          </div>
        )}

        {screenshot && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-[#07111F]/60 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.07em] text-white backdrop-blur-xl">
            <Images size={11} />
            View screenshots
          </div>
        )}
      </div>
    </button>
  );
}

function ProjectMediaModal({ project, modal, onClose }) {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const screenshots = modal.screenshots || [];

  const previousScreenshot = () => {
    setActiveScreenshot((current) =>
      current === 0 ? screenshots.length - 1 : current - 1
    );
  };

  const nextScreenshot = () => {
    setActiveScreenshot((current) =>
      current === screenshots.length - 1 ? 0 : current + 1
    );
  };

  if (modal.type === "screenshots") {
    return (
      <motion.div
        className="fixed inset-0 z-[100] grid place-items-center bg-[#07111F]/55 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative flex w-full max-w-[min(1180px,calc(100vw-32px))] items-center justify-center"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 z-20 grid h-11 w-11 -translate-y-3 translate-x-1 place-items-center rounded-full border border-white/75 bg-white/90 text-[#526174] shadow-[0_18px_46px_-22px_rgba(2,6,23,.55)] backdrop-blur-xl transition hover:bg-[#07111F] hover:text-white sm:-translate-y-5 sm:translate-x-5"
            aria-label="Close media modal"
          >
            <X size={18} />
          </button>

          <img
            src={screenshots[activeScreenshot]}
            alt={`${project.title} screenshot ${activeScreenshot + 1}`}
            className="block max-h-[84vh] max-w-full rounded-[18px] object-contain shadow-[0_34px_100px_-42px_rgba(2,6,23,.85)]"
            loading="eager"
            decoding="async"
          />

          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousScreenshot}
                className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#07111F]/52 text-white shadow-[0_16px_42px_-22px_rgba(2,6,23,.8)] backdrop-blur-xl transition hover:bg-[#07111F]/82 sm:-left-14"
                aria-label="Previous screenshot"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={nextScreenshot}
                className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#07111F]/52 text-white shadow-[0_16px_42px_-22px_rgba(2,6,23,.8)] backdrop-blur-xl transition hover:bg-[#07111F]/82 sm:-right-14"
                aria-label="Next screenshot"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#07111F]/45 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white/88 p-3 shadow-[0_40px_120px_-40px_rgba(2,6,23,.65)] backdrop-blur-3xl"
      >
        <div className="flex items-center justify-between gap-4 px-2 pb-3 pt-1">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#2563EB]">
              {modal.type === "video" ? "Demo video" : "Project screenshots"}
            </p>
            <h3 className="mt-1 text-[18px] font-black tracking-[-0.03em]">
              {project.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#DCE8F8] bg-white text-[#526174] transition hover:bg-[#07111F] hover:text-white"
            aria-label="Close media modal"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-[22px] bg-[#07111F]">
          {modal.type === "video" ? (
            isEmbedVideo(modal.videoUrl) ? (
              <iframe
                src={toEmbedUrl(modal.videoUrl)}
                title={`${project.title} demo video`}
                className="aspect-video w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={modal.videoUrl}
                className="aspect-video w-full bg-black object-contain"
                controls
                autoPlay
                playsInline
              />
            )
          ) : (
            <div className="relative">
              <img
                src={screenshots[activeScreenshot]}
                alt={`${project.title} screenshot ${activeScreenshot + 1}`}
                className="max-h-[74vh] w-full object-contain"
              />

              {screenshots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousScreenshot}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-[#07111F]/55 text-white backdrop-blur-xl transition hover:bg-[#07111F]"
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={nextScreenshot}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-[#07111F]/55 text-white backdrop-blur-xl transition hover:bg-[#07111F]"
                    aria-label="Next screenshot"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#07111F]/65 px-3 py-1.5 text-[9px] font-black text-white backdrop-blur-xl">
                    {activeScreenshot + 1} / {screenshots.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function getProjectType(project) {
  return isMobileProject(project) ? "Mobile App" : "Web App";
}

function isMobileProject(project) {
  const values = [
    project.type,
    project.category,
    ...(project.filters || []),
    ...(project.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isMobile =
    values.includes("mobile") ||
    values.includes("react native") ||
    values.includes("expo") ||
    values.includes("ios") ||
    values.includes("android");

  return isMobile;
}

function getScreenshots(project) {
  const primaryScreenshots = project.screenshots?.length
    ? project.screenshots
    : project.gallery?.length
      ? project.gallery
      : project.images || [];

  return primaryScreenshots
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.url || item?.src || item?.image || null
    )
    .filter(Boolean)
    .filter((url, index, all) => all.indexOf(url) === index);
}

function getVideoUrl(project) {
  if (typeof project.video === "string") return project.video;

  return (
    project.demoVideo ||
    project.videoUrl ||
    project.video?.url ||
    project.video?.src ||
    project.demoUrl ||
    ""
  );
}

function isEmbedVideo(url = "") {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function toEmbedUrl(url = "") {
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${id}`;
  }

  return url;
}
