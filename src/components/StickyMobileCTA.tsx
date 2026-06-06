import { Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface StickyMobileCTAProps {
  whatsappMessage: string;
  permitAlertUrl?: string | null;
  estimatedBudgetUsd?: number | null;
}

const StickyMobileCTA = ({ whatsappMessage, permitAlertUrl, estimatedBudgetUsd }: StickyMobileCTAProps) => {
  const whatsappUrl = buildWhatsAppLink(whatsappMessage);
  const hasBudget = estimatedBudgetUsd != null;

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 border-t shadow-[0_-8px_24px_rgba(28,25,23,0.08)] md:hidden",
      hasBudget ? "bg-foreground border-foreground" : "bg-background border-border"
    )}>
      <div className="container mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {hasBudget && (
          <p className="mb-2 text-center text-sm">
            <span className="font-semibold text-primary">~${estimatedBudgetUsd!.toLocaleString("en-US")} USD</span>
            <span className="text-white/70"> · Planear por WhatsApp</span>
          </p>
        )}
        <div className={cn("grid gap-3", permitAlertUrl ? "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "grid-cols-1")}>
          <Button asChild size="lg" className="h-auto min-h-12 bg-primary px-4 py-3 text-center text-white whitespace-normal hover:bg-primary/90">
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
            <Button asChild size="lg" variant="outline" className={cn(
              "h-auto min-h-12 px-3 py-3 text-center whitespace-normal",
              hasBudget ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : "border-border"
            )}>
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
