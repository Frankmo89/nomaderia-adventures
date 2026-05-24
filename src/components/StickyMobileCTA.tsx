import { Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface StickyMobileCTAProps {
  whatsappMessage: string;
  permitAlertUrl?: string | null;
}

const StickyMobileCTA = ({ whatsappMessage, permitAlertUrl }: StickyMobileCTAProps) => {
  const whatsappUrl = buildWhatsAppLink(whatsappMessage);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background shadow-[0_-8px_24px_rgba(28,25,23,0.08)] md:hidden">
      <div className="container mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className={cn("grid gap-3", permitAlertUrl ? "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "grid-cols-1")}>
          <Button asChild size="lg" className="h-auto min-h-12 px-4 py-3 text-center whitespace-normal">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("cta_itinerario_whatsapp_click", { source: "destination_detail_sticky_mobile" })}
            >
              <MessageCircle className="h-5 w-5" />
              Planear con un experto
            </a>
          </Button>

          {permitAlertUrl && (
            <Button asChild size="lg" variant="outline" className="h-auto min-h-12 border-border px-3 py-3 text-center whitespace-normal">
              <a
                href={permitAlertUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("permit_alert_click", { source: "destination_detail_sticky_mobile" })}
              >
                <Bell className="h-5 w-5" />
                Alerta de permisos
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
