import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

const EXIT_INTENT_SESSION_KEY = "exit_intent_shown";
const MOBILE_SCROLL_THRESHOLD = 0.6;

const ExitIntentModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const isExcludedRoute = useMemo(
    () =>
      location.pathname === "/sentinel" ||
      location.pathname === "/gracias" ||
      location.pathname.startsWith("/admin"),
    [location.pathname],
  );

  useEffect(() => {
    if (isExcludedRoute) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(EXIT_INTENT_SESSION_KEY)) return;

    const showModal = () => {
      if (sessionStorage.getItem(EXIT_INTENT_SESSION_KEY)) return;
      sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, "true");
      setIsOpen(true);
      trackEvent("exit_intent_shown");
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (event.clientY > 10) return;
      if (event.relatedTarget) return;
      showModal();
    };

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const scrollDepth = window.scrollY / scrollableHeight;
      if (scrollDepth >= MOBILE_SCROLL_THRESHOLD) {
        showModal();
      }
    };

    if (isMobile) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }

    document.addEventListener("mouseout", handleMouseOut);
    return () => document.removeEventListener("mouseout", handleMouseOut);
  }, [isExcludedRoute, isMobile]);

  const handleCtaClick = () => {
    trackEvent("exit_intent_cta_click");
    setIsOpen(false);
    navigate("/sentinel");
  };

  if (isExcludedRoute) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿No quieres perder tu lugar en Yosemite?</DialogTitle>
          <DialogDescription>
            Los permisos se agotan rápido; nosotros monitoreamos aperturas por ti para que no tengas que estar revisando todo el día.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Ahora no
          </Button>
          <Button onClick={handleCtaClick}>
            Quiero mi alerta gratis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentModal;
