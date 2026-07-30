import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import { resetData } from "../utils/storage.js";

export default function AdminSettings() {
  return (
    <AdminLayout
      title="Settings"
      subtitle="Manage portfolio data and admin operations."
      pageClassName="bg-[#f5f6f8]"
    >
      <section className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white/65 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-black/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-black/[0.06] bg-white/75 text-zinc-700 shadow-sm">
              <ShieldCheck size={19} strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-[17px] font-black tracking-[-0.025em] text-black">
                Admin operations
              </h3>

              <p className="mt-0.5 text-sm text-zinc-500">
                Manage sensitive portfolio data actions.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Portfolio active
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="relative overflow-hidden rounded-[22px] border border-red-500/[0.14] bg-red-50/55 p-5 backdrop-blur-xl sm:p-6">
            {/* Subtle glass highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/55 to-transparent" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex max-w-2xl items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-500/15 bg-white/70 text-red-600 shadow-sm">
                  <AlertTriangle size={19} strokeWidth={1.9} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[17px] font-black tracking-[-0.025em] text-red-950">
                      Reset portfolio content
                    </h4>

                    <span className="rounded-full border border-red-500/15 bg-white/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-600">
                      Destructive action
                    </span>
                  </div>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-red-900/65">
                    Restore all portfolio content to the built-in defaults.
                    Your currently saved portfolio data will be replaced.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => resetData()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(220,38,38,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/15"
              >
                <RotateCcw size={16} strokeWidth={2.2} />
                Reset data
              </button>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}