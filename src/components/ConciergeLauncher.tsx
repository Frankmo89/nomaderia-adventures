// src/components/ConciergeLauncher.tsx
// Launcher flotante global del concierge IA — reemplaza el WhatsAppButton flotante
// (docs/pending-tasks.md, julio 2026: funnel de dos capas, hallazgos Mobbin:
// Klook = un solo punto de entrada por página, Deel = saludo de dos capas,
// Zendesk = escalación secundaria persistente, Navan/Pipedrive = el launcher
// reclama la esquina vacía en vez de competir con los CTAs de página).
//
// Mounted una sola vez en App.tsx (fuera de <Routes>): persiste entre rutas,
// por lo que el temporizador del teaser y el estado del panel sobreviven a la
// navegación SPA. Reutiliza ConciergeChat.tsx sin tocar su wiring de RAG.

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useDestinationBySlug } from "@/hooks/use-destinations";
import { ConciergeChat } from "@/components/ConciergeChat";

const DESTINATION_DETAIL_PATTERN = /^\/destinos\/([^/]+)$/;

const TEASER_SESSION_KEY = "concierge-teaser-shown";
const TEASER_DELAY_MS = 9000;

const ConciergeLauncher = () => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const slugMatch = pathname.match(DESTINATION_DETAIL_PATTERN);
  const destinationSlug = slugMatch?.[1];
  const { data: destination } = useDestinationBySlug(destinationSlug);

  // Teaser proactivo (patrón GoDaddy/Chatbase): una sola vez por sesión de
  // navegador, nunca abre el panel solo — solo lo asoma. sessionStorage
  // sobrevive a la navegación SPA y a un refresh dentro de la misma pestaña.
  useEffect(() => {
    if (sessionStorage.getItem(TEASER_SESSION_KEY)) return;
    const timer = setTimeout(() => {
      if (isOpenRef.current) return;
      setShowTeaser(true);
      sessionStorage.setItem(TEASER_SESSION_KEY, "1");
      trackEvent("concierge_teaser_shown");
    }, TEASER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  function openPanel(source: string) {
    setIsOpen(true);
    trackEvent("concierge_launcher_open", { source });
  }

  function dismissTeaser() {
    setShowTeaser(false);
    trackEvent("concierge_teaser_dismissed");
  }

  // Ocultar en /admin (UI propia) y en /i/:token (itinerario de cliente, CTA propio)
  const isHidden = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/i/");

  if (isHidden) return null;

  return (
    <>
      <div
        className={cn(
          // z-[1200]: Leaflet's zoom-control pane (TrailsSection map) renders at
          // z-index 1000 outside its own stacking context, and paints over anything
          // at Tailwind's max z-50 whenever the map scrolls into this screen corner
          // — verified via elementFromPoint, not just a screenshot artifact.
          "fixed z-[1200] flex items-end gap-2",
          "bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-5 right-5"
        )}
      >
        {/* Teaser — nunca abre el panel solo, solo se muestra o se descarta */}
        <AnimatePresence>
          {showTeaser && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative max-w-[210px] bg-white border border-stone-200 rounded-2xl shadow-lg pl-4 pr-7 py-3"
            >
              <button
                onClick={dismissTeaser}
                aria-label="Cerrar aviso"
                className="absolute top-1.5 right-1.5 text-sage hover:text-ink text-base leading-none w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
              <button
                onClick={() => openPanel("teaser")}
                className="text-left text-sm text-ink leading-snug"
              >
                ¿Planeando tu aventura? Pregúntame lo que sea 🏔️
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón flotante — círculo verde con el logomark de montaña en crema */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => (isOpen ? setIsOpen(false) : openPanel("launcher_button"))}
          aria-label={isOpen ? "Cerrar concierge Nomaderia" : "Abrir concierge Nomaderia"}
          title="Concierge Nomaderia"
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green hover:bg-green-dark shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 group"
        >
          <Mountain className="h-6 w-6 sm:h-7 sm:w-7 text-cloud" />
        </motion.button>
      </div>

      <ConciergeChat
        open={isOpen}
        onClose={() => setIsOpen(false)}
        destinationSlug={destinationSlug}
        destinationTitle={destination?.title}
      />
    </>
  );
};

export default ConciergeLauncher;
