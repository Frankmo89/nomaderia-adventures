import { useEffect } from "react";
import { CheckCircle2, Mail, MessageCircle, ListChecks } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { PRICING } from "@/config/pricing";

const PURCHASE_SESSION_KEY = "nomaderia_gracias_purchase_fired";

const GRACIAS_WHATSAPP_URL = buildWhatsAppLink(
  "Hola Nomaderia 👋 Acabo de pagar el Itinerario Completo ($49). ¿Me confirman la recepción y los siguientes pasos?",
);

/**
 * Post-pago thank-you page. Stripe Payment Link success URL should point here
 * (Frank sets it in the Stripe Dashboard — see docs/pending-tasks.md).
 */
const Gracias = () => {
  usePageMeta({
    title: "Gracias por tu compra",
    description:
      "Pago recibido. Revisamos tus respuestas y te entregamos el itinerario por WhatsApp en 24–48 horas.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.sessionStorage.getItem(PURCHASE_SESSION_KEY)) return;
      if (typeof window.fbq === "function") {
        window.fbq("track", "Purchase", {
          value: PRICING.itinerarioCompleto,
          currency: "USD",
        });
        window.sessionStorage.setItem(PURCHASE_SESSION_KEY, "1");
      }
    } catch {
      // analytics must never break the page
    }
  }, []);

  return (
    <main className="bg-cloud min-h-screen">
      <Navbar />
      <section className="container mx-auto px-4 pt-28 pb-16 max-w-lg">
        <div className="rounded-2xl border border-green/20 bg-white p-6 sm:p-8 shadow-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-wash">
            <CheckCircle2 className="h-8 w-8 text-green" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink mb-3">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-slate leading-relaxed mb-8">
            Recibimos tu pago de{" "}
            <strong className="text-ink">${PRICING.itinerarioCompleto} USD</strong>.
            Ya eres parte de Nomaderia — aquí van los siguientes pasos.
          </p>

          <ol className="text-left space-y-4 mb-8">
            <li className="flex gap-3 items-start">
              <ListChecks className="h-5 w-5 text-green shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink text-sm">Revisamos tus respuestas</p>
                <p className="text-sm text-slate leading-relaxed">
                  Si completaste el quiz, usamos esas respuestas para armar tu plan.
                  Si no, te pediremos unos datos por WhatsApp.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <MessageCircle className="h-5 w-5 text-green shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink text-sm">
                  Entrega del itinerario en 24–48 h
                </p>
                <p className="text-sm text-slate leading-relaxed">
                  Te enviamos el itinerario completo por WhatsApp (PDF + mapas + checklist).
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <Mail className="h-5 w-5 text-green shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink text-sm">Revisa tu correo</p>
                <p className="text-sm text-slate leading-relaxed">
                  Stripe también te manda el recibo. Si no lo ves, revisa spam o promociones.
                </p>
              </div>
            </li>
          </ol>

          <Button
            asChild
            size="lg"
            className="w-full h-12 bg-green hover:bg-green-dark text-white"
          >
            <a
              href={GRACIAS_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
              Escríbenos por WhatsApp
            </a>
          </Button>
          <p className="mt-4 text-xs text-sage">
            Respuesta humana · +1 (858) 899-6802
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default Gracias;
