import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import Home from "./pages/Home.jsx";
import { isAuthed, trackVisit, useData } from "./utils/storage.js";

const ProjectsIndex = lazy(() => import("./pages/ProjectsIndex.jsx"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AiAssistant = lazy(() => import("./components/os/AiAssistant.jsx"));
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
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("portfolio-theme") || "light";
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

  return (
    <div className={`public-portfolio-shell ${isDark ? "is-galaxy-dark" : "is-light-mode"} flex min-h-screen flex-col bg-[var(--background)] text-[var(--text-primary)]`}>
      <HashScroll />
      <Navbar
        name={profile.name}
        title={profile.title || "Full-Stack Developer"}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <button
        type="button"
        onClick={() => setAiOpen(true)}
        aria-label="Open AI portfolio assistant"
        className="fixed bottom-5 right-5 z-[60] group inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#2563EB] shadow-[0_20px_50px_-18px_rgba(37,99,235,0.55)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/85"
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2563EB]/15 via-transparent to-[#38BDF8]/20" />
        <Sparkles size={22} className="relative" />
        <span className="pointer-events-none absolute -inset-1 rounded-full ring-1 ring-white/40" />
      </button>
      <Suspense fallback={null}>
        {aiOpen && <AiAssistant open={aiOpen} onOpenChange={setAiOpen} showLauncher={false} />}
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
      <Route path="/projects" element={<PublicShell><Suspense fallback={null}><ProjectsIndex /></Suspense></PublicShell>} />
      <Route path="/projects/:projectId" element={<PublicShell><Suspense fallback={null}><ProjectDetail /></Suspense></PublicShell>} />
      <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      <Route path="/admin" element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
      <Route
        path="/admin/dashboard/*"
        element={
          <Protected>
            <Suspense fallback={null}><AdminDashboard /></Suspense>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
