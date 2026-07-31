import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import Home from "./pages/Home.jsx";
import { isAuthed, trackVisit, useData } from "./utils/storage.js";

const ProjectsIndex = lazy(() => import("./pages/ProjectsIndex.jsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AiAssistant = lazy(() => import("./components/AIAssistant.jsx"));
const CommandPalette = lazy(() => import("./components/os/CommandPalette.jsx"));

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
    };
    const timeout = window.setTimeout(scrollToTarget, 80);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return null;
}

function PublicShell({ children }) {
  const [data] = useData();
  const location = useLocation();
  const [aiOpen, setAiOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("portfolio-theme") || "dark";
  });
  const email = data?.contact?.email || data?.profile?.email;
  const profile = data?.profile ?? {};
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.portfolioTheme = theme;
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const openAssistant = () => setAiOpen(true);
    window.addEventListener("portfolio:open-assistant", openAssistant);
    return () => window.removeEventListener("portfolio:open-assistant", openAssistant);
  }, []);

  useEffect(() => {
    function onKey(event) {
      const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? event.metaKey : event.ctrlKey;
      if (mod && (event.key === "k" || event.key === "K")) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    trackVisit({ path: `${location.pathname}${location.hash}` });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const updateScrollTop = () => setShowScrollTop(window.scrollY > 560);
    updateScrollTop();
    window.addEventListener("scroll", updateScrollTop, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTop);
  }, []);

  return (
    <div className={`public-portfolio-shell ${isDark ? "is-galaxy-dark" : "is-light-mode"} flex min-h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]`}>
      <HashScroll />
      <Navbar
        name={profile.name}
        title={profile.role || profile.title || "Full-Stack Developer"}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      <main className="flex-1">{children}</main>
      <Footer data={data} />
      <button
        className={`portfolio-scroll-top${showScrollTop ? " is-visible" : ""}`}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="Scroll to top"
        title="Back to top"
      >
        <ChevronUp size={20} strokeWidth={2.4} />
      </button>
      <Suspense fallback={null}>
        <AiAssistant open={aiOpen} onOpenChange={setAiOpen} showLauncher />
        {paletteOpen && (
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            onOpenAssistant={() => setAiOpen(true)}
            email={email}
          />
        )}
      </Suspense>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="grid min-h-[45vh] place-items-center px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-full border border-blue-400/25 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-200">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
        Loading…
      </div>
    </div>
  );
}
function Protected({ children }) {
  const location = useLocation();
  if (!isAuthed()) return <Navigate to="/admin" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicShell><Home /></PublicShell>} />
      <Route path="/about" element={<Navigate to="/#about" replace />} />
      <Route path="/projects" element={<PublicShell><Suspense fallback={<PageLoading />}><ProjectsIndex /></Suspense></PublicShell>} />
      <Route path="/projects/:projectId" element={<PublicShell><Suspense fallback={<PageLoading />}><ProjectDetail /></Suspense></PublicShell>} />
      <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      <Route path="/admin" element={<Suspense fallback={<PageLoading />}><AdminLogin /></Suspense>} />
      <Route
        path="/admin/dashboard/*"
        element={
          <Protected>
            <Suspense fallback={<PageLoading />}><AdminDashboard /></Suspense>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
