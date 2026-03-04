import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

try {
  createRoot(container).render(<App />);
} catch (err) {
  // Show the runtime error on screen so it can be diagnosed in production
  console.error("[Nomaderia] Fatal render error:", err);
  container.innerHTML = `
    <div style="padding:2rem;font-family:sans-serif;max-width:600px;margin:auto">
      <h1 style="color:#b91c1c">Error de inicialización</h1>
      <p>${err instanceof Error ? err.message : String(err)}</p>
    </div>`;
}
