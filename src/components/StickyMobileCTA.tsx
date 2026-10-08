import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { PrePurchaseDoubtLink } from "@/components/PrePurchaseDoubt";
import {
  BUY_CTA_LABEL,
  buildStripePaymentLink,
} from "@/config/pricing";
import { cn } from "@/lib/utils";

interface StickyMobileCTAProps {
  /** Kept for call-site compatibility; buy path is Stripe (WhatsApp = doubts only). */
  whatsappMessage: string;
  permitAlertUrl?: string | null;
  estimatedBudgetUsd?: number | null;
}

const StickyMobileCTA = ({ whatsappMessage: _whatsappMessage, estimatedBudgetUsd }: StickyMobileCTAProps) => {
  const hasBudget = estimatedBudgetUsd != null;

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 border-t shadow-[0_-8px_24px_rgba(28,25,23,0.08)] md:hidden",
      hasBudget ? "bg-foreground border-foreground" : "bg-background border-border"
    )}>
      <div className="container mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {hasBudget && (
          <p className="mb-2 text-center text-sm">
            <span className="font-semibold text-green">~${estimatedBudgetUsd!.toLocaleString("en-US")} USD</span>
            <span className="text-white/70"> · Itinerario $49</span>
          </p>
        )}
        <div className="grid gap-2 grid-cols-1">
          <Button asChild size="lg" className="h-auto min-h-12 bg-green px-4 py-3 text-center text-white whitespace-normal hover:bg-green-dark">
            <a
              href={buildStripePaymentLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("cta_itinerario_stripe_click", { source: "destination_detail_sticky_mobile" })}
            >
              <CreditCard className="h-5 w-5" />
              {BUY_CTA_LABEL}
            </a>
          </Button>
          <PrePurchaseDoubtLink
            source="destination_detail_sticky_mobile_dudas"
            className={cn(
              "text-center text-sm font-medium",
              hasBudget ? "text-white/80 hover:text-white" : "text-green hover:text-green-dark",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
