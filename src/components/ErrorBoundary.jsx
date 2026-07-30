import React from "react";

function AppFallback({ error }) {
  return (
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
          Portfolio recovery mode
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.04em] md:text-6xl">
          The portfolio hit a loading issue, but it is not blank.
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          Please refresh the page. If this keeps happening, the error details
          below can help fix the exact file quickly.
        </p>

        {error?.message && (
          <pre className="mt-6 max-h-48 overflow-auto rounded-2xl border border-white/10 bg-white/10 p-4 text-xs leading-6 text-cyan-50">
            {error.message}
          </pre>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#020617] transition hover:-translate-y-0.5"
          >
            Refresh portfolio
          </button>
          <a
            href="mailto:hello@erudita.pro"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Contact Erudita
          </a>
        </div>
      </div>
    </main>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Portfolio render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return <AppFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
