import { motion } from "framer-motion";
import { openConcierge } from "@/lib/open-concierge";
import { CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import {
  BUY_CTA_LABEL,
  CONCIERGE_QUESTION_LABEL,
    buildStripePaymentLink,
} from "@/config/pricing";

interface ArticleWhatsAppCTAProps {
  title: string;
  /** @deprecated Buy path is Stripe; prop kept so call sites compile. */
  whatsappMessage?: string;
}

const ArticleWhatsAppCTA = ({ title }: ArticleWhatsAppCTAProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-4xl mx-auto px-4 pb-8"
    >
      <div className="rounded-xl border border-border bg-[#F5F0EB] py-10 px-6 text-center">
        <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
          ¿Listo para vivir esta aventura?
        </h3>
        <p className="text-muted-foreground text-lg mb-6">
          Paga con tarjeta aquí (Stripe). Después te entregamos el itinerario de{" "}
          {title} por WhatsApp en 24–48 horas.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-green hover:bg-green-dark text-white"
        >
          <a
            href={buildStripePaymentLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("cta_itinerario_stripe_click", { source: "destination_detail" })}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {BUY_CTA_LABEL}
          </a>
        </Button>
        <p className="mt-4">
          <button
            type="button"
            className="text-sm text-green hover:text-green-dark font-medium"
            onClick={() => openConcierge("article_dudas")}
          >
            <MessageCircle className="inline h-4 w-4 mr-1 align-text-bottom" />
            {CONCIERGE_QUESTION_LABEL}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default ArticleWhatsAppCTA;
