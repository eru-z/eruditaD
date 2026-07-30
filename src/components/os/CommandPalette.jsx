import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, AtSign, Command, Home, Info, Mail, Search, Sparkles, Wrench } from "lucide-react";

export default function CommandPalette({ open, onOpenChange, onOpenAssistant, email }) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const actions = useMemo(
    () => [
      { id: "home", label: "Go to Home", hint: "Landing", icon: Home, run: () => go("#home") },
      { id: "about", label: "Go to About", hint: "Story & skills", icon: Info, run: () => go("#about") },
      { id: "projects", label: "Go to Projects", hint: "Case studies", icon: Wrench, run: () => go("#projects") },
      { id: "contact", label: "Go to Contact", hint: "Get in touch", icon: Mail, run: () => go("#contact") },
      { id: "ai", label: "Open AI Assistant", hint: "Ask anything", icon: Sparkles, run: () => onOpenAssistant() },
      {
        id: "copy",
        label: "Copy Email",
        hint: email || "hello@erudita.pro",
        icon: AtSign,
        run: () => {
          try {
            navigator.clipboard?.writeText(email || "hello@erudita.pro");
          } catch {}
        },
      },
    ],
    [email, onOpenAssistant]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return actions;
    return actions.filter((a) => (a.label + " " + a.hint).toLowerCase().includes(q));
  }, [actions, query]);

  function go(hash) {
    if (hash.startsWith("#")) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.hash = hash;
    }
  }

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function runIndex(i) {
    const action = filtered[i];
    if (!action) return;
    onOpenChange(false);
    setTimeout(() => action.run(), 50);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[14vh]"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => onOpenChange(false)}
        >
          <div className="absolute inset-0 bg-[#0B1220]/25 backdrop-blur-md" />
          <motion.div
            role="dialog"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[560px] overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_50px_100px_-30px_rgba(15,23,42,0.4)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/60 px-4 py-3">
              <Search size={16} className="text-[#64748B]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    runIndex(active);
                  }
                }}
                placeholder="Search actions or navigate…"
                className="flex-1 bg-transparent text-[14px] font-medium text-[#07111F] outline-none placeholder:text-[#94A3B8]"
              />
              <span className="hidden items-center gap-1 rounded-md border border-[#E2E8F0] bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-[#64748B] sm:inline-flex">
                <Command size={10} /> K
              </span>
            </div>
            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-[12px] text-[#64748B]">No matching actions.</li>
              ) : (
                filtered.map((a, i) => {
                  const Icon = a.icon;
                  const isActive = i === active;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => runIndex(i)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          isActive ? "bg-[#2563EB]/10 text-[#07111F]" : "text-[#334155] hover:bg-white/70"
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-lg ${
                            isActive ? "bg-[#2563EB] text-white" : "bg-white/80 text-[#2563EB]"
                          }`}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="flex-1">
                          <p className="text-[12.5px] font-bold">{a.label}</p>
                          <p className="text-[10.5px] font-semibold text-[#64748B]">{a.hint}</p>
                        </div>
                        <ArrowRight size={13} className={isActive ? "text-[#2563EB]" : "text-[#94A3B8]"} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="flex items-center justify-between border-t border-white/60 bg-white/50 px-4 py-2 text-[10px] font-bold text-[#64748B]">
              <span>↑↓ Navigate · ↵ Select · Esc Close</span>
              <span className="text-[#2563EB]">Erudita OS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
