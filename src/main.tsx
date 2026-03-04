import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

try {
  createRoot(container).render(<App />);
} catch (err) {
  // Catches synchronous module-init errors (e.g. missing dependencies).
  // React render-phase errors are handled by ErrorBoundary in App.tsx.
  console.error("[Nomaderia] Fatal render error:", err);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "padding:2rem;font-family:sans-serif;max-width:600px;margin:auto";
  const heading = document.createElement("h1");
  heading.style.color = "#b91c1c";
  heading.textContent = "Error de inicialización";
  const msg = document.createElement("p");
  msg.textContent = err instanceof Error ? err.message : String(err);
  wrapper.appendChild(heading);
  wrapper.appendChild(msg);
  container.appendChild(wrapper);
}
