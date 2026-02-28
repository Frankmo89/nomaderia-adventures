import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear chunk reload flag on successful app boot
sessionStorage.removeItem("chunk-reload");

createRoot(document.getElementById("root")!).render(<App />);
