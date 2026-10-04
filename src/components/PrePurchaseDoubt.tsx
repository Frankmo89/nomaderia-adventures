import type { LucideIcon } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { isConciergeEnabled } from "@/lib/concierge-flag";
import { openConcierge } from "@/lib/open-concierge";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  CONCIERGE_QUESTION_LABEL,
  QUESTIONS_WHATSAPP_LABEL,
  QUESTIONS_WHATSAPP_URL,
} from "@/config/pricing";

type Common = {
  source: string;
  enabledLabel?: string;
  disabledLabel?: string;
  /** Overrides the default pre-purchase WhatsApp message when the flag is off. */
  whatsappMessage?: string;
  whatsappHref?: string;
};

function doubtHref(props: Omit<Common, "source">): string {
  if (props.whatsappHref) return props.whatsappHref;
  if (props.whatsappMessage) return buildWhatsAppLink(props.whatsappMessage);
  return QUESTIONS_WHATSAPP_URL;
}

function doubtLabel(props: Omit<Common, "source">): string {
  if (isConciergeEnabled()) return props.enabledLabel ?? CONCIERGE_QUESTION_LABEL;
  return props.disabledLabel ?? QUESTIONS_WHATSAPP_LABEL;
}

/** Text link: WhatsApp anchor while the flag is off, concierge button when on. */
export function PrePurchaseDoubtLink({
  source,
  className,
  icon: Icon = MessageCircle,
  iconClassName = "inline h-4 w-4 mr-1 align-text-bottom",
  ...rest
}: Common & {
  className?: string;
  icon?: LucideIcon | null;
  iconClassName?: string;
}) {
  const label = doubtLabel(rest);
  const glyph = Icon ? <Icon className={iconClassName} aria-hidden="true" /> : null;
  if (isConciergeEnabled()) {
    return (
      <button type="button" className={className} onClick={() => openConcierge(source)}>
        {glyph}
        {label}
      </button>
    );
  }
  return (
    <a
      href={doubtHref(rest)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("cta_itinerario_whatsapp_click", { source })}
    >
      {glyph}
      {label}
    </a>
  );
}

/** shadcn Button: asChild WhatsApp link while off, button that opens the chat when on. */
export function PrePurchaseDoubtButton({
  source,
  className,
  size,
  icon: Icon = MessageCircle,
  iconClassName = "h-5 w-5 mr-2",
  ...rest
}: Common & {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  icon?: LucideIcon | null;
  iconClassName?: string;
}) {
  const label = doubtLabel(rest);
  const glyph = Icon ? <Icon className={iconClassName} aria-hidden="true" /> : null;
  if (isConciergeEnabled()) {
    return (
      <Button type="button" size={size} className={className} onClick={() => openConcierge(source)}>
        {glyph}
        {label}
      </Button>
    );
  }
  return (
    <Button asChild size={size} className={className}>
      <a
        href={doubtHref(rest)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("cta_itinerario_whatsapp_click", { source })}
      >
        {glyph}
        {label}
      </a>
    </Button>
  );
}
