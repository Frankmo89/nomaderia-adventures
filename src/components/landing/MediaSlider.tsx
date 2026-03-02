import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaSlider, type MediaItem } from "@/hooks/use-media";

const INTERVAL_MS = 6000;

const MediaSlider = () => {
  const { data: items } = useMediaSlider();
  const [index, setIndex] = useState(0);

  const activeItems: MediaItem[] = items ?? [];

  const advance = useCallback(() => {
    setIndex((prev) => (activeItems.length > 0 ? (prev + 1) % activeItems.length : 0));
  }, [activeItems.length]);

  useEffect(() => {
    if (activeItems.length <= 1) return;
    const id = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(id);
  }, [advance, activeItems.length]);

  // Reset index if items change
  useEffect(() => {
    if (activeItems.length > 0 && index >= activeItems.length) {
      setIndex(0);
    }
  }, [activeItems.length, index]);

  if (activeItems.length === 0) {
    // Fallback: plain dark background (matches original HeroSection)
    return <div className="absolute inset-0 bg-neutral-800" />;
  }

  const current = activeItems[index];

  return (
    <>
      {/* Media layer */}
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
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={current.public_url}
              alt=""
              role="presentation"
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/30" />
    </>
  );
};

export default MediaSlider;
