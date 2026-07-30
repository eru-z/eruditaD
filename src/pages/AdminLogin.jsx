import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Files,
  Folder,
  LockKeyhole,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { login, isAuthed } from "../utils/storage.js";
import "../styles/adminlogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthed()) {
    return <Navigate to={from} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const ok = await login(username.trim(), password);
      if (!ok) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <main className="vx-login">
      <aside className="vx-login-aside" aria-label="Erudita admin workspace">
        <div className="vx-login-aside-brand">
          <span className="vx-sb-mark">E</span>
          <span>
            <strong>Erudita Studio</strong>
            <small>Private Workspace</small>
          </span>
        </div>

        <div className="vx-login-aside-quote">
          <h1>
            Build. Review. <span>Ship.</span>
          </h1>
          <p>
            This is your command center. Manage projects, content, and everything that powers your portfolio.
          </p>
        </div>

        <dl className="vx-login-stats" aria-label="Workspace highlights">
          <div>
            <span><Folder size={16} /></span>
            <dt>Projects</dt>
            <dd><strong>32</strong> Active</dd>
          </div>
          <div>
            <span><MessageSquare size={16} /></span>
            <dt>Messages</dt>
            <dd><strong>18</strong> Unread</dd>
          </div>
          <div>
            <span><Files size={16} /></span>
            <dt>Media</dt>
            <dd><strong>241</strong> Assets</dd>
          </div>
          <div>
            <span><BarChart3 size={16} /></span>
            <dt>Analytics</dt>
            <dd><strong>Live</strong> Realtime</dd>
          </div>
        </dl>

        <div className="vx-workspace-visual" aria-hidden="true">
          <div className="vx-orbit-line vx-orbit-line--one" />
          <div className="vx-orbit-line vx-orbit-line--two" />
          <span className="vx-orbit-dot vx-orbit-dot--one" />
          <span className="vx-orbit-dot vx-orbit-dot--two" />
          <span className="vx-orbit-dot vx-orbit-dot--three" />

          <article className="vx-mini-card vx-mini-card--deploy">
            <span><CheckCircle2 size={18} /></span>
            <div>
              <strong>Deployment Successful</strong>
              <small>Portfolio website</small>
              <i><b /></i>
            </div>
            <em>Live</em>
          </article>

          <article className="vx-mini-card vx-mini-card--contact">
            <span><UserRound size={17} /></span>
            <div>
              <strong>New Contact Request</strong>
              <small>from Switzerland</small>
              <small>2m ago</small>
            </div>
          </article>

          <article className="vx-mini-card vx-mini-card--project">
            <span><Files size={17} /></span>
            <div>
              <strong>New Project Added</strong>
              <small>Marica Beauty Academy</small>
              <small>1h ago</small>
            </div>
          </article>

          <div className="vx-platform">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="vx-login-aside-foot">
          <span><Clock3 size={14} /> Last deployment</span>
          <strong>3 hours ago</strong>
          <ArrowRight size={14} />
        </div>
      </aside>

      <section className="vx-login-main" aria-label="Admin sign in">
        <div className="vx-login-version">• v3.2</div>

        <div className="vx-login-card vx-fade-in">
          <div className="vx-login-mobile-brand">
            <span className="vx-brand-mark">E</span>
            <strong>Erudita Studio</strong>
          </div>

          <span className="vx-eyebrow"><i /> Verified owner</span>
          <h2>Welcome back.</h2>
          <p className="sub">Continue to your secure workspace to manage your portfolio.</p>

          {error && (
            <div className="vx-login-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="vx-login-form">
            <div className="vx-field">
              <label className="vx-label" htmlFor="admin-username">Username</label>
              <div className="vx-input-wrap">
                <UserRound aria-hidden="true" size={18} />
                <input
                  id="admin-username"
                  className="vx-input"
                  type="text"
                  placeholder="eruadmin"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            <div className="vx-field">
              <label className="vx-label" htmlFor="admin-password">Password</label>
              <div className="vx-input-wrap">
                <LockKeyhole aria-hidden="true" size={18} />
                <input
                  id="admin-password"
                  className="vx-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="vx-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="vx-btn vx-btn-primary">
              {loading ? (
                <span className="vx-spinner light" aria-label="Signing in" />
              ) : (
                <>
                  Continue to Workspace
                  <ArrowRight aria-hidden="true" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="vx-login-help">
            <ShieldCheck aria-hidden="true" size={18} />
            <span><strong>Encrypted owner workspace</strong>256-bit encrypted • Secure session</span>
          </div>
        </div>

        <p className="vx-login-credit">
          Engineering by <strong>Erudita</strong>
          <i />
        </p>
      </section>
    </main>
  );
}
