import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Gauge,
  LayoutDashboard,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react";

const PROJECT_TYPES = [
  { id: "website", label: "Premium Website", base: 850, weeks: 2, icon: Sparkles },
  { id: "webapp", label: "Web App", base: 1650, weeks: 4, icon: Rocket },
  { id: "dashboard", label: "Dashboard", base: 1900, weeks: 5, icon: LayoutDashboard },
];

const SCOPE = [
  { id: "lean", label: "Lean", multiplier: 0.85, weekDelta: -1 },
  { id: "standard", label: "Standard", multiplier: 1, weekDelta: 0 },
  { id: "premium", label: "Premium", multiplier: 1.35, weekDelta: 2 },
];

const ADDONS = [
  { id: "cms", label: "CMS/Admin", price: 420, weeks: 1 },
  { id: "booking", label: "Booking flow", price: 360, weeks: 1 },
  { id: "seo", label: "SEO setup", price: 220, weeks: 0 },
  { id: "analytics", label: "Analytics", price: 180, weeks: 0 },
];

function formatChf(value) {
  return `CHF ${Math.round(value).toLocaleString("en-US")}`;
}

export default function ProjectMatchmaker() {
  const reduced = useReducedMotion();
  const [type, setType] = useState("website");
  const [scope, setScope] = useState("standard");
  const [pages, setPages] = useState(6);
  const [addons, setAddons] = useState(["seo"]);

  const estimate = useMemo(() => {
    const selectedType = PROJECT_TYPES.find((item) => item.id === type) || PROJECT_TYPES[0];
    const selectedScope = SCOPE.find((item) => item.id === scope) || SCOPE[1];
    const selectedAddons = ADDONS.filter((addon) => addons.includes(addon.id));
    const pageCost = Math.max(0, pages - 4) * 95;
    const addonCost = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const low = (selectedType.base + pageCost + addonCost) * selectedScope.multiplier;
    const high = low * 1.22;
    const weeks = Math.max(
      1,
      selectedType.weeks +
        selectedScope.weekDelta +
        Math.ceil(Math.max(0, pages - 5) / 4) +
        selectedAddons.reduce((sum, addon) => sum + addon.weeks, 0)
    );

    return {
      selectedType,
      low,
      high,
      weeks,
      summary:
        selectedScope.id === "premium"
          ? "Best for a polished launch with stronger UX, animations, and conversion details."
          : selectedScope.id === "lean"
            ? "Best when you need a tight, fast first version with the essentials done well."
            : "Balanced scope for a professional build with room for quality and speed.",
    };
  }, [addons, pages, scope, type]);

  function toggleAddon(id) {
    setAddons((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label="AI project estimator"
      className="relative z-10 mx-auto mt-3 max-w-[1360px] px-5"
    >
      <div className="overflow-hidden rounded-[28px] border border-white/75 bg-white/58 p-5 shadow-[0_28px_80px_-54px_rgba(37,99,235,0.7)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-stretch">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#07111F] text-white shadow-[0_18px_38px_-24px_rgba(2,6,23,0.9)]">
                  <Calculator size={17} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#2563EB]">
                    AI Project Estimator
                  </p>
                  <h3 className="mt-0.5 font-display text-[22px] font-black tracking-[-0.03em] text-[#07111F]">
                    Get an instant price and timeline
                  </h3>
                </div>
              </div>
              <p className="max-w-[360px] text-[12px] font-semibold leading-5 text-[#475569]">
                Tune the scope and see a realistic starting range before you send a brief.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PROJECT_TYPES.map((item) => {
                const Icon = item.icon;
                const active = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      active
                        ? "border-[#2563EB] bg-white shadow-[0_18px_45px_-34px_rgba(37,99,235,.85)]"
                        : "border-white/75 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-[#2563EB]" : "text-[#64748B]"} />
                    <span className="mt-3 block text-[13px] font-black text-[#07111F]">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-[#475569]">
                      From {formatChf(item.base)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">Scope</p>
                <div className="mt-3 flex rounded-2xl border border-white/75 bg-white/60 p-1">
                  {SCOPE.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScope(item.id)}
                      className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black transition ${
                        scope === item.id ? "bg-[#07111F] text-white" : "text-[#475569] hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <label className="mt-5 block">
                  <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">
                    Pages / screens <strong className="text-[#07111F]">{pages}</strong>
                  </span>
                  <input
                    type="range"
                    min="3"
                    max="16"
                    value={pages}
                    onChange={(event) => setPages(Number(event.target.value))}
                    className="mt-3 w-full accent-[#2563EB]"
                  />
                </label>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">Add-ons</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ADDONS.map((addon) => {
                    const active = addons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition hover:-translate-y-0.5 ${
                          active
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#07111F]"
                            : "border-white/75 bg-white/60 text-[#475569] hover:bg-white"
                        }`}
                      >
                        {addon.label}
                        {active && <CheckCircle2 size={14} className="text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <motion.div
            key={`${type}-${scope}-${pages}-${addons.join("-")}`}
            initial={reduced ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/76 p-6 shadow-[0_24px_70px_-48px_rgba(37,99,235,0.75)]"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#DBEAFE] blur-3xl" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#2563EB]">
                Estimated range
              </p>
              <div className="mt-3 font-display text-[32px] font-black tracking-[-0.06em] text-[#07111F]">
                {formatChf(estimate.low)} - {formatChf(estimate.high)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#E2EAF6] bg-white/80 p-4">
                  <Gauge size={17} className="text-[#2563EB]" />
                  <p className="mt-3 text-[20px] font-black text-[#07111F]">{estimate.weeks}-{estimate.weeks + 2}w</p>
                  <p className="text-[10px] font-bold text-[#475569]">Timeline</p>
                </div>
                <div className="rounded-2xl border border-[#E2EAF6] bg-white/80 p-4">
                  <Shield size={17} className="text-[#2563EB]" />
                  <p className="mt-3 text-[20px] font-black text-[#07111F]">Fixed</p>
                  <p className="text-[10px] font-bold text-[#475569]">Clear scope</p>
                </div>
              </div>
              <p className="mt-4 text-[12px] font-semibold leading-6 text-[#475569]">{estimate.summary}</p>
              <a
                href="#contact"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07111F] px-5 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-white shadow-[0_20px_42px_-28px_rgba(2,6,23,.8)] transition hover:-translate-y-0.5 hover:bg-[#2563EB]"
              >
                Send this estimate <ArrowUpRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
