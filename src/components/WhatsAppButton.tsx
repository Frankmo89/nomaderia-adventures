import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
const WHATSAPP_MESSAGE =
  "Hola Frank, me interesa un itinerario personalizado";
const WHATSAPP_URL = whatsappNumber
  ? `https://wa.me/${encodeURIComponent(
      whatsappNumber
    )}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
  : null;

const WhatsAppButton = () => {
  const { pathname } = useLocation();

  // Ocultar si no hay número de WhatsApp configurado
  if (!WHATSAPP_URL) return null;
  // Ocultar en rutas de admin
  if (pathname.startsWith("/admin")) return null;

  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Plática conmigo"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 md:h-[60px] md:w-[60px] group"
      style={{ backgroundColor: "#25D366" }}
    >
      {/* Tooltip visible solo en desktop */}
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-stone-800 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
        Plática conmigo
      </span>

      {/* Hover overlay */}
      <span className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />

      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 175.216 175.552"
        className="relative h-8 w-8 md:h-9 md:w-9"
        fill="white"
      >
        <path d="M87.882 14.093c-40.626 0-73.678 33.052-73.678 73.678 0 13.013 3.386 25.263 9.322 35.89L14.093 161.46l39.197-10.283a73.345 73.345 0 0 0 34.592 8.593c40.626 0 73.678-33.052 73.678-73.678S128.508 14.093 87.882 14.093zm0 134.98a61.33 61.33 0 0 1-31.265-8.559l-2.24-1.33-23.2 6.088 6.195-22.622-1.46-2.322a61.212 61.212 0 0 1-9.388-32.65c0-33.88 27.57-61.45 61.45-61.45 33.88 0 61.45 27.57 61.45 61.45-.093 33.88-27.662 61.395-61.542 61.395z" />
        <path d="M126.145 101.393c-2.1-1.05-12.425-6.132-14.35-6.832-1.925-.7-3.325-1.05-4.725 1.05s-5.425 6.832-6.65 8.232c-1.225 1.4-2.45 1.575-4.55.525-2.1-1.05-8.862-3.266-16.879-10.414-6.24-5.564-10.452-12.432-11.677-14.532-1.225-2.1-.131-3.237 .92-4.282.944-.94 2.1-2.45 3.15-3.675 1.05-1.225 1.4-2.1 2.1-3.5.7-1.4.35-2.625-.175-3.675s-4.725-11.392-6.475-15.592c-1.706-4.094-3.44-3.54-4.725-3.607-1.225-.062-2.625-.075-4.025-.075s-3.675.525-5.6 2.625c-1.925 2.1-7.35 7.182-7.35 17.518s7.525 20.318 8.575 21.718c1.05 1.4 14.8 22.6 35.862 31.693 5.012 2.162 8.925 3.456 11.975 4.422 5.031 1.6 9.607 1.374 13.222.832 4.034-.6 12.425-5.082 14.175-9.99 1.75-4.91 1.75-9.113 1.225-9.988-.525-.875-1.925-1.4-4.025-2.45z" />
      </svg>
    </motion.a>
  );
};

export default WhatsAppButton;
