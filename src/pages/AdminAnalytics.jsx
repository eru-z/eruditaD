import { useCallback, useEffect, useState } from "react";
import { Activity, BarChart3, Globe2, Monitor, RefreshCw, Smartphone, TrendingUp, Users } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import { fetchAnalytics } from "../utils/storage.js";

const REFRESH_MS = 30000;

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setAnalytics(await fetchAnalytics());
    } catch (err) {
      setError(err?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load({ quiet: true });
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load({ quiet: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const metrics = [
    { label: "Total visits", value: analytics?.totalVisits ?? 0, icon: BarChart3 },
    { label: "Unique visitors", value: analytics?.uniqueVisitors ?? 0, icon: Users },
    { label: "Today", value: analytics?.todayVisits ?? 0, icon: Activity },
    { label: "Last 7 days", value: analytics?.weekVisits ?? 0, icon: TrendingUp },
  ];

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Real portfolio traffic, acquisition, devices, and page performance."
      pageClassName="vx-admin-analytics bg-[#f7f9fd]"
      actions={
        <button type="button" onClick={() => load({ quiet: true })} disabled={refreshing} className="vx-data-refresh">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {error && <StateBanner tone="error" text={error} action={() => load()} />}
      {loading ? <AnalyticsSkeleton /> : (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <article key={label} className="vx-data-card">
                <span className="vx-data-icon"><Icon size={16} /></span>
                <p>{label}</p><strong>{value.toLocaleString()}</strong>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <DataPanel title="Traffic trend" subtitle="Visits and unique visitors over the last 14 days">
              <TrendChart rows={analytics?.dailyTrend || []} />
            </DataPanel>
            <DataPanel title="Top pages" subtitle="Most viewed portfolio routes">
              <RankList rows={analytics?.topPages || []} labelKey="path" empty="No page views recorded yet." />
            </DataPanel>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <DataPanel title="Acquisition" subtitle="Traffic sources"><RankList rows={analytics?.referrers || []} empty="No referrer data yet." /></DataPanel>
            <DataPanel title="Devices" subtitle="Visitor device mix"><DeviceList rows={analytics?.devices || []} /></DataPanel>
            <DataPanel title="Languages" subtitle="Browser language distribution"><RankList rows={analytics?.languages || []} empty="No language data yet." /></DataPanel>
          </section>

          <DataPanel title="Recent visits" subtitle="Live traffic received by the production API">
            <VisitTable rows={analytics?.recentVisits || []} />
          </DataPanel>
          <p className="text-right text-[10px] text-slate-400">Updated {formatDateTime(analytics?.generatedAt)} · auto-refreshes every 30 seconds</p>
        </div>
      )}
    </AdminLayout>
  );
}

function TrendChart({ rows }) {
  const values = rows.map((row) => Number(row.visits) || 0);
  const max = Math.max(...values, 1);
  if (!rows.length || values.every((value) => value === 0)) return <EmptyAnalytics text="Traffic will appear after portfolio visits are recorded." />;
  const points = values.map((value, index) => `${(index / Math.max(rows.length - 1, 1)) * 100},${38 - (value / max) * 32}`).join(" ");
  return <div className="vx-trend-wrap"><svg viewBox="0 0 100 42" preserveAspectRatio="none" aria-label="Fourteen day traffic trend"><defs><linearGradient id="analytics-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d7df3" stopOpacity=".28"/><stop offset="1" stopColor="#4d7df3" stopOpacity="0"/></linearGradient></defs><polygon points={`0,42 ${points} 100,42`} fill="url(#analytics-fill)"/><polyline points={points} fill="none" stroke="#4d7df3" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/></svg><div className="vx-trend-labels">{rows.filter((_, index) => index % 3 === 0 || index === rows.length - 1).map((row) => <span key={row.date}>{row.label}</span>)}</div></div>;
}

function RankList({ rows, labelKey = "label", empty }) {
  const max = Math.max(...rows.map((row) => row.count || 0), 1);
  if (!rows.length) return <EmptyAnalytics text={empty} />;
  return <div className="vx-rank-list">{rows.map((row) => <div key={`${row[labelKey]}-${row.count}`}><span><strong>{row[labelKey]}</strong><small>{row.count.toLocaleString()}</small></span><i><b style={{ width: `${(row.count / max) * 100}%` }} /></i></div>)}</div>;
}

function DeviceList({ rows }) {
  if (!rows.length) return <EmptyAnalytics text="No device data yet." />;
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  return <div className="vx-device-list">{rows.map((row) => { const Icon = row.label === "Mobile" ? Smartphone : Monitor; return <div key={row.label}><span className="vx-data-icon"><Icon size={15}/></span><span><strong>{row.label}</strong><small>{Math.round((row.count / total) * 100)}% · {row.count} visits</small></span></div>; })}</div>;
}

function VisitTable({ rows }) {
  if (!rows.length) return <EmptyAnalytics text="No visits recorded yet." />;
  return <div className="vx-visit-table"><div className="vx-visit-head"><span>Page</span><span>Source</span><span>Device</span><span>Time</span></div>{rows.slice(0, 12).map((visit) => <div className="vx-visit-row" key={visit.id}><strong>{visit.path || "/"}</strong><span>{hostName(visit.referrer)}</span><span>{/mobile|android|iphone/i.test(visit.userAgent || "") ? "Mobile" : "Desktop"}</span><time>{formatDateTime(visit.createdAt)}</time></div>)}</div>;
}

function DataPanel({ title, subtitle, children }) { return <article className="vx-data-panel"><header><div><h3>{title}</h3><p>{subtitle}</p></div></header>{children}</article>; }
function EmptyAnalytics({ text }) { return <div className="vx-data-empty"><Globe2 size={18}/><strong>No data yet</strong><p>{text}</p></div>; }
function StateBanner({ text, action }) { return <div className="vx-data-error"><span>{text}</span><button type="button" onClick={action}>Try again</button></div>; }
function AnalyticsSkeleton() { return <div className="vx-analytics-skeleton" aria-label="Loading analytics">{Array.from({ length: 8 }, (_, index) => <span key={index}/>)}</div>; }
function hostName(value) { if (!value) return "Direct"; try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "Other"; } }
function formatDateTime(value) { if (!value) return "just now"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }
