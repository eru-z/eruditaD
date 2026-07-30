import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";
import "./styles/erudita-theme.css";
import "./styles/responsive-final.css";

const rootElement = document.getElementById("root");

function showBootstrapFallback(error) {
  if (!rootElement) return;

  rootElement.innerHTML = `
    <main style="min-height:100vh;background:#020617;color:white;font-family:Inter,system-ui,sans-serif;padding:40px 24px;display:flex;align-items:center;">
      <section style="max-width:760px;margin:0 auto;">
        <div style="display:inline-flex;border:1px solid rgba(103,232,249,.25);background:rgba(103,232,249,.1);color:#cffafe;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Portfolio recovery mode
        </div>
        <h1 style="margin:24px 0 0;font-size:clamp(36px,7vw,68px);line-height:1;letter-spacing:-.04em;">
          The portfolio could not start, but this page will never be blank.
        </h1>
        <p style="margin:20px 0 0;max-width:620px;color:#cbd5e1;line-height:1.7;">
          Refresh the page or open the latest local server URL. The app has kept this fallback visible so there is always something useful on screen.
        </p>
        ${error?.message ? `<pre style="margin-top:24px;max-height:180px;overflow:auto;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);border-radius:18px;padding:16px;color:#ecfeff;font-size:12px;line-height:1.6;">${error.message}</pre>` : ""}
        <button onclick="window.location.reload()" style="margin-top:28px;border:0;border-radius:999px;background:white;color:#020617;padding:13px 20px;font-weight:800;cursor:pointer;">
          Refresh portfolio
        </button>
      </section>
    </main>
  `;
}

window.addEventListener("error", (event) => {
  if (!rootElement?.hasChildNodes()) {
    showBootstrapFallback(event.error || new Error(event.message));
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (!rootElement?.hasChildNodes()) {
    showBootstrapFallback(event.reason);
  }
});

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Portfolio bootstrap error:", error);
  showBootstrapFallback(error);
}
