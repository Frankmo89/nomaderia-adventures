import "./index.css";

async function bootstrap() {
  const container = document.getElementById("root") ?? document.body;
  try {
    // Fail fast with a clear message when Supabase env vars are missing
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error(
        `Supabase env vars missing — VITE_SUPABASE_URL: ${url ? "✓" : "✗ undefined"} | VITE_SUPABASE_PUBLISHABLE_KEY: ${key ? "✓" : "✗ undefined"}`,
      );
    }

    // Dynamic imports so module-init errors are caught by this try/catch.
    // React render-phase errors are handled by ErrorBoundary in App.tsx.
    const [{ createRoot }, { default: App }] = await Promise.all([
      import("react-dom/client"),
      import("./App.tsx"),
    ]);

    createRoot(container).render(<App />);
  } catch (err) {
    console.error("[Nomaderia] Fatal error:", err);
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "padding:2rem;font-family:sans-serif;max-width:600px;margin:auto";
    const heading = document.createElement("h1");
    heading.style.color = "#b91c1c";
    heading.textContent = "Error de inicialización";
    const msg = document.createElement("p");
    msg.textContent = err instanceof Error ? err.message : String(err);
    wrapper.appendChild(heading);
    wrapper.appendChild(msg);
    container.appendChild(wrapper);
  }
}

bootstrap();
