import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMediaSlider } from "@/hooks/use-media";
import BackgroundSlideshow from "@/components/shared/BackgroundSlideshow";

const MediaSlider = () => {
  const { data: items } = useMediaSlider();
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const update = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 80]);
  const parallaxEnabled = !isMobile && !prefersReducedMotion;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-x-0 -top-[100px] -bottom-[100px]"
        style={parallaxEnabled ? { y } : undefined}
      >
        <BackgroundSlideshow
          items={items ?? []}
          overlayClassName="bg-gradient-to-t from-[#1C1917]/70 via-[#1C1917]/30 to-transparent"
          prioritizeFirstImage
          fallback={
            <>
              <div className="absolute inset-0 bg-neutral-800" />
              <div className="absolute inset-0 bg-black/50" />
            </>
          }
        />
      </motion.div>
    </div>
  );
};

export default MediaSlider;
