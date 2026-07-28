import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Section from "@/components/editorial/Section";
import Eyebrow from "@/components/editorial/Eyebrow";
import Reveal, { RevealGroup } from "@/components/editorial/Reveal";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

interface ContrastItem {
  number: string;
  title: string;
  description: string;
}

const soloItems: ContrastItem[] = [
  {
    number: "01",
    title: "20 pestañas abiertas",
    description:
      "Permisos, reservas, clima, mapas... todo en inglés y en sitios distintos.",
  },
  {
    number: "02",
    title: "¿Y si me pierdo algo?",
    description:
      "Horas en blogs y YouTube sin saber qué aplica a TU viaje.",
  },
  {
    number: "03",
    title: "Miedo a equivocarte",
    description:
      "¿Necesito permiso? ¿Hay osos? ¿Qué llevo? Nadie te responde en español.",
  },
  {
    number: "04",
    title: "Al final, no vas",
    description:
      "La mayoría pospone su primera aventura por no saber por dónde empezar.",
  },
];

const nomaderiaItems: ContrastItem[] = [
  {
    number: "01",
    title: "Un mensaje de WhatsApp",
    description:
      "Nos cuentas tu fecha, presupuesto y con quién viajas. En español, sin formularios.",
  },
  {
    number: "02",
    title: "Consulta de 5 minutos",
    description:
      "Te hacemos las preguntas correctas para diseñar TU viaje, no uno genérico.",
  },
  {
    number: "03",
    title: "Itinerario completo en 24-48h",
    description:
      "Rutas para principiantes, permisos explicados, qué empacar y plan B si algo falla.",
  },
  {
    number: "04",
    title: "Vas con confianza",
    description:
      "Soporte por WhatsApp durante tu viaje. Nunca estás solo en el parque.",
  },
];

const PainContrast = () => {
  const whatsappUrl = buildWhatsAppLink("Hola, quiero mi Itinerario Completo Nomaderia");

  return (
    <Section className="relative overflow-hidden bg-cloud py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-10 text-center sm:mb-14">
          <Eyebrow as="p" className="mb-3 block">
            La diferencia Nomaderia
          </Eyebrow>
          <h2 className="font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            Planear tu primer parque no debería sentirse así
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {/* Por tu cuenta — muted, stacks first on mobile */}
          <RevealGroup className="flex flex-col gap-4" stagger>
            <span className="font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-sage">
              Por tu cuenta
            </span>
            {soloItems.map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-stone bg-white/60 p-5 sm:p-6"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-condensed text-xs font-semibold text-sage">
                    {item.number}
                  </span>
                  <h3 className="font-sans text-base font-semibold text-slate">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-sage">{item.description}</p>
              </div>
            ))}
          </RevealGroup>

          {/* Con Nomaderia — primary green accent */}
          <RevealGroup className="flex flex-col gap-4" stagger>
            <span className="font-condensed text-xs font-semibold uppercase tracking-[0.08em] text-green">
              Con Nomaderia
            </span>
            {nomaderiaItems.map((item) => (
              <div
                key={item.number}
                className="card-depth rounded-2xl border border-green/30 bg-white p-5 sm:p-6"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-wash font-condensed text-xs font-semibold text-green">
                    {item.number}
                  </span>
                  <h3 className="font-sans text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-slate">{item.description}</p>
              </div>
            ))}
          </RevealGroup>
        </div>

        <Reveal className="mt-10 text-center sm:mt-14" delay={0.1}>
          <Button asChild size="lg">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("cta_itinerario_whatsapp_click", { source: "pain_contrast" })
              }
            >
              <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
              Diseña mi aventura por WhatsApp
            </a>
          </Button>
        </Reveal>
      </div>
    </Section>
  );
};

export default PainContrast;
