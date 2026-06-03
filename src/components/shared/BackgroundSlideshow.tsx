import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaItem } from "@/hooks/use-media";

const DEFAULT_INTERVAL_MS = 6000;

interface BackgroundSlideshowProps {
  items: MediaItem[];
  interval?: number;
  overlayClassName?: string;
  fallback?: React.ReactNode;
  prioritizeFirstImage?: boolean;
}

const BackgroundSlideshow = ({
  items,
  interval = DEFAULT_INTERVAL_MS,
  overlayClassName = "bg-gradient-to-t from-[#1C1917]/70 via-[#1C1917]/30 to-transparent",
  fallback,
  prioritizeFirstImage = false,
}: BackgroundSlideshowProps) => {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(advance, interval);
    return () => clearInterval(id);
  }, [advance, items.length, interval]);

  if (items.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  const safeIndex = items.length ? index % items.length : 0;
  const current = items[safeIndex];

  if (!current) return fallback ? <>{fallback}</> : null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {current.media_type === "video" ? (
            <video
              src={current.public_url}
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              className="w-full h-full object-cover img-warm"
            />
          ) : (
            <img
              src={current.public_url}
              alt=""
              role="presentation"
              loading={prioritizeFirstImage && safeIndex === 0 ? "eager" : "lazy"}
              fetchPriority={prioritizeFirstImage && safeIndex === 0 ? "high" : "auto"}
              className="w-full h-full object-cover img-warm"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay for text legibility */}
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </>
  );
};

export default BackgroundSlideshow;
