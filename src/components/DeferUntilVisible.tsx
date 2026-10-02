import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferUntilVisibleProps = {
  children: ReactNode;
  /** Expand the observe box so chunks start a bit before the user scrolls. */
  rootMargin?: string;
  /** Optional min-height placeholder to reduce layout jump. */
  minHeight?: number | string;
};

/**
 * Mounts children only once the placeholder nears the viewport.
 * Used on the homepage so below-fold section chunks/images do not compete
 * with hero LCP on first paint.
 */
const DeferUntilVisible = ({
  children,
  rootMargin = "400px 0px",
  minHeight,
}: DeferUntilVisibleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() =>
    typeof window !== "undefined" ? Boolean(window.location.hash) : false,
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={ref} style={minHeight !== undefined ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
};

export default DeferUntilVisible;
