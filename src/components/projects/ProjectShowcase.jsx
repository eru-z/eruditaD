import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Clapperboard,
  ExternalLink,
  Gauge,
  Github,
  Images,
  Layers3,
  Play,
  X,
} from "lucide-react";

import { assetUrl } from "../../utils/assets.js";
import Modal from "../ui/Modal.jsx";

export function ScreenshotFrame({ project, screenshot, compact = false }) {
  const isMobile = screenshot.type === "mobile";
  const isTablet = screenshot.type === "tablet";
  const isDashboard = screenshot.type === "dashboard";
  const coverImage = assetUrl(screenshot.url || (isMobile && project.mobileCoverImage ? project.mobileCoverImage : project.coverImage));
  const hasCover = coverImage?.startsWith("/");
  const frameClass = isMobile
    ? "mx-auto aspect-[9/16] max-h-[360px] w-[42%] min-w-[150px] rounded-[26px] border-[7px] border-[#07111F] bg-[#07111F] p-1.5"
    : isTablet
      ? "mx-auto aspect-[4/3] w-[78%] rounded-[24px] border-[8px] border-[#07111F] bg-[#07111F] p-2"
      : "aspect-[16/10] w-full rounded-[22px] border border-white/80 bg-white p-2 shadow-[0_28px_70px_-45px_rgba(37,99,235,.8)]";

  return (
    <div className={`relative overflow-hidden ${frameClass}`}>
      <div className="relative h-full overflow-hidden rounded-[16px] bg-[#F8FBFF]">
        {hasCover && !isDashboard && (
          <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: hasCover && !isDashboard
              ? undefined
              :
              project.tone === "restaurant"
                ? "radial-gradient(circle at 72% 34%, rgba(245,158,11,.34), transparent 28%), linear-gradient(135deg,#060403,#2A1008 52%,#050505)"
                : project.tone === "dark"
                  ? "radial-gradient(circle at 72% 32%, rgba(99,102,241,.34), transparent 30%), linear-gradient(135deg,#07111F,#15264A)"
                  : "radial-gradient(circle at 72% 28%, rgba(37,99,235,.20), transparent 30%), linear-gradient(135deg,#F8FBFF,#EAF3FF)",
          }}
        />
        {(!hasCover || isDashboard) && (
        <div className="relative z-10 flex h-full flex-col p-4 text-[#07111F]">
          {!isMobile && (
            <div className="mb-4 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-auto rounded-full bg-white/75 px-3 py-1 text-[8px] font-black text-[#2563EB]">
                {screenshot.label}
              </span>
            </div>
          )}
          <div className={`${isDashboard ? "grid flex-1 grid-cols-[.85fr_1.15fr] gap-3" : "flex flex-1 flex-col justify-end"}`}>
            {isDashboard ? (
              <>
                <div className="space-y-2">
                  {[74, 56, 88].map((width) => (
                    <div key={width} className="rounded-xl bg-white/88 p-3">
                      <span className="block h-2 w-12 rounded-full bg-[#BFDBFE]" />
                      <span className="mt-3 block h-4 rounded-lg bg-[#DBEAFE]" style={{ width: `${width}%` }} />
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-white/88 p-4">
                  <div className="h-2 w-20 rounded-full bg-[#BFDBFE]" />
                  <div className="mt-8 flex h-24 items-end gap-2">
                    {[44, 74, 52, 92, 66, 100].map((height) => (
                      <span key={height} className="flex-1 rounded-t-md bg-[#60A5FA]" style={{ height }} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className={`${compact ? "text-[9px]" : "text-[10px]"} font-black uppercase tracking-[0.16em] ${project.tone === "restaurant" || project.tone === "dark" ? "text-white/70" : "text-[#2563EB]"}`}>
                  {project.title}
                </p>
                <h3 className={`${compact ? "text-[22px]" : "text-[36px]"} mt-2 max-w-[360px] font-display font-black leading-[0.95] tracking-[-0.055em] ${project.tone === "restaurant" || project.tone === "dark" ? "text-white" : "text-[#07111F]"}`}>
                  {screenshot.title}
                </h3>
                <span
                  className="mt-4 w-fit rounded-full px-4 py-2 text-[9px] font-black text-white"
                  style={{ backgroundColor: project.accent }}
                >
                  {project.status}
                </span>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export function ProjectActionButtons({ project, onWatch, onCaseStudy, largeWatch = false }) {
  const hasVideo = Boolean(project.video);

  return (
    <div className="flex flex-wrap gap-2.5">
      {hasVideo && (
        <button
          type="button"
          onClick={onWatch}
          className={`inline-flex items-center gap-2 rounded-full bg-[#07111F] font-black text-white shadow-[0_20px_45px_-28px_rgba(2,6,23,.8)] transition hover:-translate-y-0.5 ${
            largeWatch ? "px-6 py-3.5 text-[12px]" : "px-4 py-2.5 text-[10px]"
          }`}
        >
          <Play size={largeWatch ? 15 : 13} fill="currentColor" />
          Watch Showcase
        </button>
      )}
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_16px_34px_-24px_rgba(37,99,235,.8)] transition hover:-translate-y-0.5"
        >
          <ExternalLink size={13} />
          Live Website
        </a>
      )}
      {project.githubUrl && (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2.5 text-[10px] font-black text-[#07111F] shadow-[0_14px_34px_-28px_rgba(2,6,23,.6)] transition hover:-translate-y-0.5"
        >
          <Github size={13} />
          GitHub Repository
        </a>
      )}
      {project.caseStudyUrl && (
        onCaseStudy ? (
          <button
            type="button"
            onClick={onCaseStudy}
            className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2.5 text-[10px] font-black text-[#07111F] shadow-[0_14px_34px_-28px_rgba(2,6,23,.6)] transition hover:-translate-y-0.5"
          >
            <Layers3 size={13} />
            Case Study
          </button>
        ) : (
          <Link
            to={project.caseStudyUrl}
            className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2.5 text-[10px] font-black text-[#07111F] shadow-[0_14px_34px_-28px_rgba(2,6,23,.6)] transition hover:-translate-y-0.5"
          >
            <Layers3 size={13} />
            Case Study
          </Link>
        )
      )}
    </div>
  );
}

export function ShowcaseModal({ project, open, onClose }) {
  const videoSrc = assetUrl(typeof project.video === "string" ? project.video : project.video?.url);
  const poster = assetUrl(project.coverImage);

  return (
    <Modal open={open} onClose={onClose} title={project.video?.title || `${project.title} Showcase`} size="xl">
      <div className="overflow-hidden rounded-[28px] border border-[#E2EAF6] bg-[#07111F] p-3 text-white">
        <div className="relative aspect-video overflow-hidden rounded-[22px]">
          {videoSrc ? (
            <video className="h-full w-full bg-black object-contain" controls playsInline preload="metadata" poster={poster}>
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(37,99,235,.48),transparent_30%),linear-gradient(135deg,#020617,#0F172A_45%,#1D4ED8)]" />
              <motion.div
                className="absolute inset-y-0 w-24 rotate-12 bg-white/15 blur-2xl"
                animate={{ x: ["-30%", "860%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <Clapperboard size={14} />
                Cinematic Showcase
              </span>
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black">{project.video?.duration}</span>
            </div>
            <div>
              <h3 className="max-w-[680px] font-display text-[42px] font-black leading-[0.95] tracking-[-0.055em]">
                {project.title}
              </h3>
              <p className="mt-3 max-w-[580px] text-[13px] font-semibold leading-6 text-white/72">{project.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#07111F]">
                <Play size={18} fill="currentColor" />
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/18">
                <motion.span
                  className="block h-full rounded-full bg-white"
                  animate={{ width: ["8%", "78%", "8%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function ScreenshotCarousel({ project, compact = false }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const active = project.screenshots[index] || project.screenshots[0];

  const go = (direction) => {
    setIndex((current) => (current + direction + project.screenshots.length) % project.screenshots.length);
  };

  return (
    <>
      <div className="rounded-[24px] border border-white/75 bg-white/58 p-3 shadow-[0_24px_70px_-55px_rgba(37,99,235,.75)] backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF1FF] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-[#2563EB]">
            <Images size={12} />
            Screenshot Gallery
          </span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => go(-1)} className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-[#07111F]">
              <ArrowLeft size={13} />
            </button>
            <button type="button" onClick={() => go(1)} className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-[#07111F]">
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setLightbox(true)} className="block w-full text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${project.id}-${active.label}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.24 }}
            >
              <ScreenshotFrame project={project} screenshot={active} compact={compact} />
            </motion.div>
          </AnimatePresence>
        </button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.screenshots.map((shot, shotIndex) => (
            <button
              key={shot.label}
              type="button"
              onClick={() => setIndex(shotIndex)}
              className={`rounded-full px-3 py-1.5 text-[9px] font-black transition ${
                index === shotIndex ? "bg-[#07111F] text-white" : "bg-white/72 text-[#475569] hover:text-[#07111F]"
              }`}
            >
              {shot.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-[#020617]/80 p-4 backdrop-blur-md"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-[#07111F]"
              aria-label="Close screenshot"
            >
              <X size={16} />
            </button>
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-5xl"
            >
              <ScreenshotFrame project={project} screenshot={active} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ProjectBadges({ project }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {project.liveUrl && <span className="rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[8px] font-black text-[#1D4ED8]">Live</span>}
      {project.githubUrl && <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-[#07111F]">GitHub</span>}
      {project.video && <span className="rounded-full bg-[#07111F] px-2.5 py-1 text-[8px] font-black text-white">Video</span>}
      {project.screenshots?.length > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-[#2563EB]">Screenshots</span>}
      {project.featured && <span className="rounded-full bg-[#2563EB] px-2.5 py-1 text-[8px] font-black text-white">Featured</span>}
    </div>
  );
}

export function ProjectCard({ project }) {
  return (
    <div className="group rounded-[24px] border border-white/75 bg-white/58 p-3 shadow-[0_22px_58px_-48px_rgba(37,99,235,.8)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/72">
      <ScreenshotFrame project={project} screenshot={project.screenshots[0]} compact />
      <div className="mt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#2563EB]">{project.category}</p>
            <h3 className="mt-1 font-display text-[20px] font-black tracking-[-0.04em] text-[#07111F]">{project.title}</h3>
          </div>
          <ArrowUpRight size={15} className="mt-1 text-[#94A3B8] transition group-hover:text-[#2563EB]" />
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-5 text-[#475569]">{project.description}</p>
        <div className="mt-3">
          <ProjectBadges project={project} />
        </div>

        <div className="mt-4 grid gap-2">
          {[
            ["Problem", project.problem],
            ["Solution", project.solution],
            ["Result", project.results],
          ].map(([label, text]) => (
            <div key={label} className="rounded-[14px] border border-white/75 bg-white/68 p-3">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#2563EB]">
                <BrainCircuit size={12} />
                {label}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-4 text-[#475569]">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[14px] border border-white/75 bg-white/68 p-3">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
              <Layers3 size={12} />
              Architecture
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.architecture.slice(0, 3).map((item) => (
                <span key={item} className="rounded-full bg-[#EAF1FF] px-2 py-1 text-[8px] font-black text-[#1D4ED8]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-white/75 bg-white/68 p-3">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
              <Gauge size={12} />
              Lighthouse
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                ["Perf", project.metrics.performance],
                ["SEO", project.metrics.seo],
                ["A11y", project.metrics.accessibility],
              ].map(([label, value]) => (
                <span key={label} className="rounded-xl bg-white/88 px-2 py-1.5 text-center">
                  <span className="block text-[13px] font-black leading-none text-[#07111F]">{value}</span>
                  <span className="mt-1 block text-[7px] font-black uppercase text-[#64748B]">{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[14px] border border-white/75 bg-white/68 p-3">
          <div className="text-[8px] font-black uppercase tracking-[0.14em] text-[#2563EB]">
            Tech Decisions
          </div>
          <ul className="mt-2 space-y-1.5">
            {project.techDecisions.slice(0, 2).map((decision) => (
              <li key={decision} className="flex gap-2 text-[10px] font-semibold leading-4 text-[#475569]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                {decision}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={project.caseStudyUrl}
            className="inline-flex items-center gap-2 rounded-full bg-[#07111F] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_16px_34px_-24px_rgba(2,6,23,.8)] transition hover:-translate-y-0.5"
          >
            <Layers3 size={13} />
            Case Study
          </Link>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_16px_34px_-24px_rgba(37,99,235,.8)] transition hover:-translate-y-0.5"
            >
              <ExternalLink size={13} />
              Live Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
