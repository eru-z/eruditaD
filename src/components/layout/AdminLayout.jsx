import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  FileBadge,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MonitorUp,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  User,
  Wrench,
  X,
} from "lucide-react";

import { fetchMessages, logout, updateMessage, useData, validateAdminSession } from "../../utils/storage.js";
import "../../styles/adminsidebar.css";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { to: "/admin/dashboard/projects", label: "Projects", icon: Briefcase },
      { to: "/admin/dashboard/experience", label: "Experience", icon: User },
      { to: "/admin/dashboard/achievements", label: "Achievements", icon: Star },
      { to: "/admin/dashboard/certificates", label: "Certificates", icon: FileBadge },
      { to: "/admin/dashboard/skills", label: "Skills", icon: Sparkles },
      { to: '/admin/dashboard/services', label: 'Services', icon: Wrench },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/dashboard/homepage", label: "Homepage", icon: Home },
      { to: "/admin/dashboard/resume", label: "Resume", icon: FileText },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: '/admin/dashboard/contact', label: 'Contact details', icon: Mail },
      { to: "/admin/dashboard/messages", label: "Messages", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/dashboard/settings", label: "Settings", icon: Settings },
      { to: "/admin/dashboard/account", label: "Account", icon: Shield },
    ],
  },
];
const navItems = navGroups.flatMap((group) => group.items);
const COLLAPSED_KEY = "erudita_admin_sidebar_collapsed";

function adminText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return `${value}`;
  if (!value || typeof value !== "object") return fallback;
  const candidate = value.value ?? value.text ?? value.label ?? value.title ?? value.name;
  return candidate === value ? fallback : adminText(candidate, fallback);
}

export default function AdminLayout({
  title = "Dashboard",
  subtitle,
  actions,
  pageClassName = "",
  children,
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");
  const [saveError, setSaveError] = useState('');
  const [data] = useData();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("vx-admin-route");

    return () => {
      document.body.classList.remove("vx-admin-route");
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;
    const goToLogin = () => {
      if (!alive) return;
      navigate("/admin", { replace: true, state: { from: location } });
    };

    validateAdminSession().then((valid) => {
      if (!valid) goToLogin();
    });

    window.addEventListener("erudita:auth-required", goToLogin);
    return () => {
      alive = false;
      window.removeEventListener("erudita:auth-required", goToLogin);
    };
  }, [location, navigate]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadNotifications = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setMessagesLoading(true);
    setMessagesError("");
    try {
      setMessages(await fetchMessages());
    } catch (error) {
      setMessagesError(error?.message || "Could not load notifications.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const onSaveError = (event) => setSaveError(event.detail || 'Your last change could not be saved and was rolled back.');
    const onOnline = () => setSaveError('');
    const onOffline = () => setSaveError('You are offline. Changes cannot be published until the connection returns.');
    window.addEventListener('erudita:save-error', onSaveError);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (!navigator.onLine) onOffline();
    return () => {
      window.removeEventListener('erudita:save-error', onSaveError);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
    const refresh = () => loadNotifications({ quiet: true });
    const timer = window.setInterval(() => document.visibilityState === "visible" && refresh(), 30000);
    window.addEventListener("erudita:messages", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("erudita:messages", refresh);
    };
  }, [loadNotifications, location.pathname]);

  const currentSection = useMemo(
    () =>
      navItems.find((item) =>
        item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)
      ) || navItems[0],
    [location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate("/admin", { replace: true });
  };

  const unreadMessages = messages.filter((message) => message.status === "Unread");
  const searchResults = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = [
      ...(data?.projects || []).map((item) => ({ group: "Projects", title: item.title, text: item.description || item.category, to: "/admin/dashboard/projects" })),
      ...(data?.skills || []).map((item) => ({ group: "Technologies", title: item.name, text: item.group, to: "/admin/dashboard/skills" })),
      ...(data?.experience || []).map((item) => ({ group: "Experience", title: item.role || item.title, text: item.company || item.description, to: "/admin/dashboard/experience" })),
      ...(data?.achievements?.recognitions || []).map((item) => ({ group: "Achievements", title: item.title, text: item.subtitle, to: "/admin/dashboard/achievements" })),
      ...(data?.achievements?.certificates || []).map((item) => ({ group: "Certificates", title: item.title, text: item.issuer, to: "/admin/dashboard/certificates" })),
      ...(data?.services || []).map((item) => ({ group: "Services", title: item.title || item.name, text: item.description, to: "/admin/dashboard/services" })),
      ...messages.map((item) => ({ group: "Messages", title: item.subject, text: `${item.name} ${item.email}`, to: "/admin/dashboard/messages" })),
    ].map((item) => ({ ...item, title: adminText(item.title), text: adminText(item.text) })).filter((item) => item.title);
    if (!needle) return rows.slice(0, 10);
    return rows
      .filter((item) => `${item.group} ${item.title} ${item.text || ""}`.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [data, messages, search]);

  const markNotificationsRead = async () => {
    setMessagesError("");
    try {
      const next = await Promise.all(unreadMessages.slice(0, 8).map((message) => updateMessage(message.id, { status: "Read" })));
      setMessages((current) => current.map((message) => next.find((item) => item.id === message.id) || message));
    } catch (error) {
      setMessagesError(error?.message || "Could not mark notifications as read.");
    }
  };

  return (
    <div className={`vx-shell${collapsed ? " is-collapsed" : ""}`}>
      <button
        type="button"
        className={`vx-overlay${open ? " is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
      />

      <aside className={`vx-sidebar${open ? " is-open" : ""}`}>
        <div className="vx-sb-top">
          <div className="vx-sb-brand-row">
            <Link to="/" className="vx-sb-brand" aria-label="Go to portfolio">
              <span className="vx-sb-mark">E</span>

              <span className="vx-sb-brand-text">
                <strong>Erudita</strong>
                <small>Admin Studio</small>
              </span>
            </Link>

            <button
              type="button"
              className="vx-sb-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
            <button
              type="button"
              className="vx-sb-collapse"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
            </button>
          </div>

          <div className="vx-sb-status">
            <span className="vx-sb-live-dot" />

            <span>
              <strong>Workspace online</strong>
              <small>Portfolio system active</small>
            </span>
          </div>

          <nav className="vx-sb-nav" aria-label="Admin navigation">
            {navGroups.map((group) => (
              <div className="vx-sb-group" key={group.label}>
                <p className="vx-sb-nav-label">{group.label}</p>
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `vx-sb-item${isActive ? " active" : ""}`
                    }
                  >
                    <span className="vx-sb-icon">
                      <Icon size={17} strokeWidth={1.9} />
                    </span>

                    <span className="vx-sb-item-label">{label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="vx-sb-bottom">
          <div className="vx-sb-quick">
            <span className="vx-sb-quick-kicker">Quick action</span>

            <strong>Publish a new case study</strong>

            <p>
              Add project media, details, technology, category, and live links.
            </p>

            <Link
              to="/admin/dashboard/projects?new=1"
              className="vx-sb-quick-btn"
            >
              <Plus size={14} strokeWidth={2.2} />
              New project
            </Link>
          </div>

          <div className="vx-sb-user">
            <span className="vx-sb-user-avatar">E</span>

            <span className="vx-sb-user-meta">
              <strong>Erudita Admin</strong>
              <small>eruadmin</small>
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="vx-sb-logout"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="vx-main">
        {saveError && <div className='vx-global-save-error' role='alert'><span>{saveError}</span><button type='button' onClick={() => setSaveError('')}>Dismiss</button></div>}
        <header className="vx-topbar">
          <button
            type="button"
            className="vx-topbar-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="vx-topbar-heading">
            <span>{currentSection.label}</span>
            <strong>{title}</strong>
          </div>

          <button type="button" className="vx-topbar-search" onClick={() => setSearchOpen(true)}>
            <Search size={16} strokeWidth={1.9} />
            <span>Search projects, content, messages...</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="vx-topbar-end">
            <button
              type="button"
              className="vx-topbar-icon-btn vx-notification-btn"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={17} strokeWidth={1.9} />
              {unreadMessages.length > 0 && <span>{unreadMessages.length}</span>}
            </button>
            {notificationsOpen && (
              <div className="vx-dropdown vx-notifications">
                <div className="vx-dropdown-head">
                  <strong>Notifications</strong>
                  <button type="button" onClick={markNotificationsRead}>Mark read</button>
                </div>
                {messagesLoading ? <p className="vx-dropdown-empty">Loading notifications...</p> : messagesError ? <div className="vx-notification-error"><p>{messagesError}</p><button type="button" onClick={() => loadNotifications()}>Retry</button></div> : messages.slice(0, 5).length ? messages.slice(0, 5).map((message) => (
                  <Link key={message.id} to="/admin/dashboard/messages" className="vx-notification-row">
                    <span className={message.status === "Unread" ? "is-unread" : ""} />
                    <div>
                      <strong>{message.subject || "New message"}</strong>
                      <small>{message.name || message.email}</small>
                    </div>
                  </Link>
                )) : <p className="vx-dropdown-empty">No messages yet.</p>}
              </div>
            )}

            <a className="vx-topbar-icon-btn" href="/" target="_blank" rel="noreferrer" aria-label="Preview public portfolio">
              <MonitorUp size={17} strokeWidth={1.9} />
            </a>

            <button
              type="button"
              className="vx-topbar-profile"
              onClick={() => setProfileOpen((value) => !value)}
              title="Admin profile"
            >
              <span className="vx-topbar-avatar">E</span>
              <strong>Admin</strong>
            </button>
            {profileOpen && (
              <div className="vx-dropdown vx-profile-menu">
                <Link to="/admin/dashboard/account">Account</Link>
                <a href="/" target="_blank" rel="noreferrer">View portfolio</a>
                <button type="button" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        <main
          className={`vx-content${pageClassName ? ` ${pageClassName}` : ""}`}
        >
          <section className="vx-page-head">
            <div className="vx-page-head-left">
              <span className="vx-eyebrow">
                <span className="vx-eyebrow-dot" />
                Erudita Studio
              </span>

              <h1>{title}</h1>

              {subtitle && <p className="vx-page-subtitle">{subtitle}</p>}
            </div>

            {actions && <div className="vx-page-actions">{actions}</div>}
          </section>

          <div className="vx-page-body">{children}</div>
        </main>
      </div>
      {searchOpen && (
        <div className="vx-command" role="dialog" aria-modal="true" aria-label="Command palette" onClick={() => setSearchOpen(false)}>
          <div className="vx-command-card" onClick={(event) => event.stopPropagation()}>
            <label className="vx-command-search">
              <Search size={17} />
              <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search real portfolio content..." />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={16} /></button>
            </label>
            <div className="vx-command-results">
              {searchResults.length ? searchResults.map((item, index) => (
                <Link key={`${item.group}-${item.title}-${index}`} to={item.to} onClick={() => setSearchOpen(false)} className="vx-command-row">
                  <span>{item.group}</span>
                  <strong>{item.title}</strong>
                  {item.text && <small>{item.text}</small>}
                </Link>
              )) : <p className="vx-dropdown-empty">No matching content.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
