import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Code2,
  Edit,
  Eye,
  FileText,
  FolderKanban,
  Layers3,
  Mail,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchAnalytics, fetchMessages, useData } from "../utils/storage.js";
import "../styles/adminhome.css";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminMessages from "./AdminMessages.jsx";
import AdminAnalytics from "./AdminAnalytics.jsx";
import AdminSettings from "./AdminSettings.jsx";
import ProjectsManager from "../admin/ProjectsManager.jsx";
import SkillsManager from "../admin/SkillsManager.jsx";
import ServicesManager from "../admin/ServicesManager.jsx";
import ExperienceManager from "../admin/ExperienceManager.jsx";
import ContactManager from "../admin/ContactManager.jsx";
import {
  AccountManager,
  AchievementsManager,
  HomepageManager,
  ResumeManager,
} from "../admin/CmsManagers.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const glass =
  "border border-white/80 bg-white/58 backdrop-blur-2xl shadow-[0_12px_34px_rgba(30,41,59,0.055),inset_0_1px_0_rgba(255,255,255,0.96)]";

function Overview() {
  const [data] = useData();
  const [analytics, setAnalytics] = useState(null);
  const [messages, setMessages] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const projects = useMemo(() => data?.projects || [], [data?.projects]);
  const skills = data?.skills || [];
  const services = data?.services || [];
  const experience = data?.experience || [];

  const published = projects.filter((project) => project.status !== "Draft").length;
  const featured = projects.filter((project) => project.featured).length;
  const drafts = projects.filter((project) => project.status === "Draft").slice(0, 4);
  const recent = useMemo(() => projects.slice(0, 8), [projects]);
  const messageCount = messages.length;
  const unreadCount = messages.filter((message) => message.status === "Unread").length;
  const trendPoints = analytics?.dailyTrend?.map((item) => item.visits) || Array(14).fill(0);
  const categories = new Set(projects.map((project) => project.category).filter(Boolean)).size;
  const publishRate = projects.length ? Math.round((published / projects.length) * 100) : 0;
  const coverage = Math.min(100, Math.round(((skills.length + services.length + experience.length) / 18) * 100));

  const loadRemoteData = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setRemoteLoading(true);
    setRemoteError("");
    const [analyticsResult, messagesResult] = await Promise.allSettled([fetchAnalytics(), fetchMessages()]);
    if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);
    if (messagesResult.status === "fulfilled") setMessages(messagesResult.value);
    const failures = [analyticsResult, messagesResult].filter((result) => result.status === "rejected");
    if (failures.length) setRemoteError(failures.map((result) => result.reason?.message).filter(Boolean).join(" ") || "Some dashboard data could not be loaded.");
    setRemoteLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadRemoteData();
    const refresh = () => loadRemoteData({ quiet: true });
    const timer = window.setInterval(() => document.visibilityState === "visible" && refresh(), 30000);
    window.addEventListener("erudita:data", refresh);
    window.addEventListener("erudita:messages", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("erudita:data", refresh);
      window.removeEventListener("erudita:messages", refresh);
    };
  }, [loadRemoteData]);

  const metrics = [
    {
      label: "Visitors",
      value: analytics?.uniqueVisitors ?? 0,
      note: `${analytics?.totalVisits ?? 0} total visits`,
      icon: UserRound,
      tone: "blue",
      points: trendPoints,
    },
    {
      label: "Today",
      value: analytics?.todayVisits ?? 0,
      note: `${analytics?.weekVisits ?? 0} this week`,
      icon: TrendingUp,
      tone: "green",
      points: analytics?.hourlyTrend?.map((item) => item.visits) || Array(24).fill(0),
    },
    {
      label: "Projects",
      value: projects.length,
      note: `${published} published`,
      icon: Briefcase,
      tone: "blue",
      points: [10, 17, 14, 20, 15, 21, 17, 22, 19, 31, 22, 26],
    },
    {
      label: "Published",
      value: published,
      note: `${publishRate}% ready`,
      icon: Eye,
      tone: "violet",
      points: [12, 16, 14, 19, 15, 18, 22, 17, 24, 18, 27, 23],
    },
    {
      label: "Messages",
      value: messageCount,
      note: `${unreadCount} unread`,
      icon: Mail,
      tone: "orange",
      points: [6, 8, 12, 9, 14, 12, 15, 18, 16, 21, 19, 23],
    },
    {
      label: "Services",
      value: services.length,
      note: `${categories} categories`,
      icon: Layers3,
      tone: "orange",
      points: [11, 12, 18, 10, 16, 19, 14, 20, 24, 17, 22, 22],
    },
    {
      label: "Featured",
      value: featured,
      note: "Homepage selected",
      icon: Star,
      tone: "blue",
      points: [10, 18, 14, 20, 16, 19, 16, 21, 19, 29, 20, 25],
    },
  ];

  const quickActions = [
    { to: "/admin/dashboard/projects?new=1", title: "Add New Project", note: "Create a new project", icon: Plus, tone: "blue" },
    { to: "/admin/dashboard/projects", title: "Manage Projects", note: "Edit portfolio work", icon: Edit, tone: "violet" },
    { to: "/admin/dashboard/experience", title: "Edit Experience", note: "Update timeline details", icon: UserRound, tone: "green" },
    { to: "/admin/dashboard/skills", title: "Manage Skills", note: "Add or update your skills", icon: Code2, tone: "orange" },
    { to: "/admin/dashboard/analytics", title: "View Analytics", note: "Live traffic and sources", icon: BarChart3, tone: "blue" },
    { to: "/admin/dashboard/settings", title: "Site Settings", note: "General configuration", icon: Settings, tone: "slate" },
  ];

  return (
    <AdminLayout
      title="Welcome back, Erudita!"
      subtitle="Here’s what’s happening with your portfolio."
      pageClassName="bg-[#f7f9fd]"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadRemoteData({ quiet: true })}
            disabled={refreshing}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/80 bg-white/60 text-slate-500 shadow-sm backdrop-blur-xl transition hover:bg-white/90 hover:text-slate-900"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
          <Link
            to="/admin/dashboard/projects?new=1"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/90 bg-white/68 px-3 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white"
          >
            <Plus size={14} className="text-[#4d7df3]" />
            New project
          </Link>
        </div>
      }
    >
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.38 }}
        className="relative space-y-4 pb-2"
      >
        <div className="pointer-events-none absolute -left-20 top-4 h-64 w-64 rounded-full bg-[#dce8ff]/35 blur-[90px]" />
        <div className="pointer-events-none absolute right-0 top-20 h-56 w-56 rounded-full bg-[#eee8ff]/35 blur-[90px]" />

        {remoteError && (
          <div className="vx-dashboard-error" role="alert">
            <span>{remoteError}</span>
            <button type="button" onClick={() => loadRemoteData()}>Retry</button>
          </div>
        )}

        {remoteLoading ? <DashboardSkeleton /> : null}

        <section className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="relative grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel title="Portfolio Projects" action={<Link to="/admin/dashboard/projects">Manage all</Link>}>
            <div className="overflow-hidden rounded-xl border border-slate-200/55 bg-white/34">
              <div className="hidden grid-cols-[1.45fr_0.65fr_0.55fr_0.75fr_0.45fr] border-b border-slate-200/50 bg-white/36 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.13em] text-slate-400 md:grid">
                <span>Project</span>
                <span>Status</span>
                <span>Featured</span>
                <span>Updated</span>
                <span className="text-right">Actions</span>
              </div>

              {recent.length === 0 ? (
                <EmptyBlock title="No projects yet" text="Create your first project to populate the dashboard." />
              ) : (
                recent.map((project) => <ProjectRow key={project.id} project={project} />)
              )}

              <Link
                to="/admin/dashboard/projects"
                className="flex items-center justify-center gap-2 border-t border-slate-200/50 py-2.5 text-[10px] font-semibold text-[#4d7df3] transition hover:bg-white/55"
              >
                <FolderKanban size={13} />
                Manage all projects
              </Link>
            </div>
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-2">
              {quickActions.map((action) => (
                <QuickAction key={action.title} {...action} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="relative grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Panel title="Content Overview" subtitle="Track your portfolio content coverage">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <OverviewCard icon={FileText} label="Experience" value={experience.length} note="Entries" tone="blue" />
              <OverviewCard icon={FolderKanban} label="Projects" value={projects.length} note="Published" tone="green" />
              <OverviewCard icon={Code2} label="Skills" value={skills.length} note="Added" tone="orange" />
              <OverviewCard icon={Layers3} label="Services" value={services.length} note="Available" tone="violet" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/55">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6d94f5] to-[#4d7df3] transition-all duration-700"
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-[#4d7df3]">{coverage}%</span>
            </div>
          </Panel>

          <Panel title="Recent Activity" action={<Link to="/admin/dashboard/projects">View all</Link>}>
            <div className="space-y-2.5">
              <Activity icon={UserRound} tone="blue" text={`${analytics?.uniqueVisitors ?? 0} unique visitors detected`} time={remoteLoading ? "Loading" : "Live"} />
              <Activity icon={FolderKanban} tone="green" text={recent[0]?.title ? `Project “${recent[0].title}” is in your portfolio` : "Portfolio workspace is ready"} time="Recently" />
              <Activity icon={Code2} tone="orange" text={`${skills.length} skills currently listed`} time="Current" />
              <Activity icon={Mail} tone="violet" text={`${messageCount} contact messages saved in your backend inbox`} time="Inbox" />
              <Activity icon={CheckCircle2} tone="blue" text={`${publishRate}% of projects are published`} time="Status" />
            </div>
          </Panel>
        </section>

        {drafts.length > 0 && (
          <section className={`relative rounded-2xl p-3.5 ${glass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50/80 text-amber-600 ring-1 ring-amber-100">
                  <Wrench size={14} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-slate-700">{drafts.length} draft project{drafts.length === 1 ? "" : "s"} need attention</p>
                  <p className="text-[9px] text-slate-400">Review and publish when ready.</p>
                </div>
              </div>
              <Link to="/admin/dashboard/projects" className="text-[10px] font-semibold text-[#4d7df3]">Review drafts</Link>
            </div>
          </section>
        )}
      </motion.section>
    </AdminLayout>
  );
}

function Wrapped({ title, subtitle, children }) {
  return (
    <AdminLayout title={title} subtitle={subtitle} pageClassName="bg-[#f7f9fd]">
      <div className={`rounded-2xl p-4 sm:p-5 ${glass}`}>{children}</div>
    </AdminLayout>
  );
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="projects" element={<ProjectsManager />} />
      <Route path="skills" element={<Wrapped title="Skills" subtitle="Manage technical skills and proficiency levels."><SkillsManager /></Wrapped>} />
      <Route path="services" element={<Wrapped title="Services" subtitle="Manage service cards shown on the public page."><ServicesManager /></Wrapped>} />
      <Route path="experience" element={<Wrapped title="Experience" subtitle="Manage roles and timeline entries."><ExperienceManager /></Wrapped>} />
      <Route path="achievements" element={<Wrapped title="Achievements" subtitle="Manage public recognition cards."><AchievementsManager /></Wrapped>} />
      <Route path="tech-stack" element={<Navigate to="/admin/dashboard/skills" replace />} />
      <Route path="homepage" element={<Wrapped title="Homepage" subtitle="Edit high-impact public portfolio copy and profile content."><HomepageManager /></Wrapped>} />
      <Route path="testimonials" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="resume" element={<Wrapped title="Resume" subtitle="Replace and review your public resume."><ResumeManager /></Wrapped>} />
      <Route path="media" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="contact" element={<Wrapped title="Contact" subtitle="Manage public contact information."><ContactManager /></Wrapped>} />
      <Route path="messages" element={<AdminMessages />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="account" element={<Wrapped title="Account" subtitle="Review admin account and security status."><AccountManager /></Wrapped>} />
      <Route path="profile" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="analytics" element={<AdminAnalytics />} />
    </Routes>
  );
}

function toneClasses(tone) {
  const tones = {
    blue: "bg-[#edf3ff]/85 text-[#4d7df3] ring-[#dce8ff]",
    violet: "bg-[#f4efff]/85 text-[#8059ef] ring-[#e9ddff]",
    green: "bg-[#eafaf4]/85 text-[#1fa977] ring-[#d7f3e8]",
    orange: "bg-[#fff3e9]/88 text-[#f07b35] ring-[#ffe4cf]",
    slate: "bg-slate-100/75 text-slate-500 ring-slate-200/70",
  };
  return tones[tone] || tones.slate;
}

function MetricCard({ label, value, note, icon: Icon, tone, points }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 24 - ((point - min) / Math.max(max - min, 1)) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={`min-h-[132px] rounded-2xl p-3.5 ${glass}`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ${toneClasses(tone)}`}>
          <Icon size={15} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="truncate text-[9px] font-semibold text-slate-600">{label}</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <strong className="text-[21px] font-bold leading-none tracking-[-0.035em] text-slate-900">{value}</strong>
            <span className="text-[8px] font-medium text-slate-400">{note}</span>
          </div>
        </div>
      </div>

      <svg className="mt-4 h-7 w-full overflow-visible" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`fade-${label.replaceAll(" ", "-")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.13" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,26 ${coords} 100,26`} fill={`url(#fade-${label.replaceAll(" ", "-")})`} className={tone === "green" ? "text-emerald-400" : tone === "orange" ? "text-orange-400" : tone === "violet" ? "text-violet-400" : "text-blue-400"} />
        <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={tone === "green" ? "text-emerald-500" : tone === "orange" ? "text-orange-500" : tone === "violet" ? "text-violet-500" : "text-blue-500"} />
      </svg>
    </motion.article>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <article className={`rounded-2xl p-3.5 sm:p-4 ${glass}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[8px] text-slate-400">{subtitle}</p>}
        </div>
        {action && <div className="text-[9px] font-semibold text-[#4d7df3]">{action}</div>}
      </div>
      {children}
    </article>
  );
}

function ProjectRow({ project }) {
  const status = project.status === "Draft" ? "Draft" : "Published";

  return (
    <div className="grid gap-2 border-b border-slate-200/45 px-3 py-2.5 last:border-b-0 md:grid-cols-[1.45fr_0.65fr_0.55fr_0.75fr_0.45fr] md:items-center">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-950 text-[9px] font-bold text-white shadow-sm">
          {project.coverImage ? <img src={project.coverImage} alt="" className="h-full w-full object-cover" /> : (project.title || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <strong className="block truncate text-[9px] font-semibold text-slate-800">{project.title || "Untitled project"}</strong>
          <span className="block truncate text-[8px] text-slate-400">{project.category || "Web"} • {project.year || "No year"}</span>
        </div>
      </div>

      <div><StatusPill status={status} /></div>
      <div><span className="rounded-full bg-slate-100/80 px-2 py-1 text-[7px] font-semibold text-slate-400">{project.featured ? "Yes" : "No"}</span></div>
      <span className="text-[8px] text-slate-400">{project.year || "Recently"}</span>
      <div className="flex justify-end gap-1.5">
        <Link to={`/admin/dashboard/projects?edit=${encodeURIComponent(project.id)}`} aria-label="Edit project" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200/65 bg-white/55 text-slate-500 transition hover:bg-white hover:text-slate-900"><Edit size={11} /></Link>
        <a href="/#projects" target="_blank" rel="noreferrer" aria-label="Preview project" className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200/65 bg-white/55 text-slate-500 transition hover:bg-white hover:text-slate-900"><Eye size={11} /></a>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const draft = status === "Draft";
  return <span className={`rounded-full px-2 py-1 text-[7px] font-semibold ring-1 ${draft ? "bg-amber-50/80 text-amber-600 ring-amber-100" : "bg-emerald-50/80 text-emerald-600 ring-emerald-100"}`}>{status}</span>;
}

function QuickAction({ to, title, note, icon: Icon, tone }) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-xl border border-white/80 bg-white/35 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] transition hover:bg-white/62">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ${toneClasses(tone)}`}><Icon size={14} /></span>
        <span className="min-w-0">
          <strong className="block truncate text-[9px] font-semibold text-slate-700">{title}</strong>
          <small className="block truncate text-[8px] text-slate-400">{note}</small>
        </span>
      </span>
      <ChevronRight size={12} className="text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function OverviewCard({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/36 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.92)]">
      <div className="flex items-start gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${toneClasses(tone)}`}><Icon size={12} /></span>
        <div>
          <p className="text-[8px] font-semibold text-slate-500">{label}</p>
          <strong className="mt-0.5 block text-[15px] font-bold leading-none text-slate-800">{value}</strong>
          <span className="mt-1 block text-[7px] text-slate-400">{note}</span>
        </div>
      </div>
    </div>
  );
}

function Activity({ icon: Icon, tone, text, time }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${toneClasses(tone)}`}><Icon size={12} /></span>
        <span className="truncate text-[8px] font-medium text-slate-500">{text}</span>
      </div>
      <span className="shrink-0 text-[7px] text-slate-400">{time}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="vx-dashboard-skeleton" aria-label="Loading live dashboard data">
      {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
    </div>
  );
}
function EmptyBlock({ title, text }) {
  return (
    <div className="px-4 py-8 text-center">
      <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-white/65 text-slate-400 ring-1 ring-white"><Sparkles size={13} /></span>
      <strong className="mt-2 block text-[10px] text-slate-700">{title}</strong>
      <p className="mt-0.5 text-[8px] text-slate-400">{text}</p>
    </div>
  );
}
