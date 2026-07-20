import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Compass } from "lucide-react";
import { useClientItinerary } from "@/hooks/use-itinerary";
import { trackEvent } from "@/lib/analytics";
import { usePageMeta } from "@/hooks/use-seo";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import ClientItineraryLayout, { ItinerarySkeleton } from "@/components/itinerary/ClientItineraryLayout";

function EmptyState() {
  const msg = encodeURIComponent("Hola, no puedo ver mi itinerario. ¿Pueden ayudarme?");
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: "#EAF3DE" }}
      >
        <Compass size={24} style={{ color: "#166534" }} />
      </div>
      <h1 className="font-serif text-xl mb-2" style={{ color: "#1C1917" }}>
        Este itinerario no está disponible
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        El link puede haber vencido o no ser válido. Escríbenos y te ayudamos.
      </p>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white no-underline"
        style={{ backgroundColor: "#166534" }}
      >
        Escríbenos por WhatsApp
      </a>
    </div>
  );
}

export default function ClientItineraryView() {
  const { token = "" } = useParams<{ token: string }>();
  const { data: itinerary, isLoading, isError } = useClientItinerary(token);

  const parque = itinerary?.content?.parque ?? null;

  usePageMeta({
    title: itinerary ? (parque ? `Tu ${parque} — Nomaderia` : "Tu itinerario — Nomaderia") : "Itinerario — Nomaderia",
    description: "Tu itinerario personalizado de Nomaderia.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    if (itinerary) {
      trackEvent("client_itinerary_view", { token });
    }
  }, [itinerary, token]);

  if (isLoading) return <ItinerarySkeleton />;
  if (isError || !itinerary) return <EmptyState />;

  return <ClientItineraryLayout itinerary={itinerary} />;
}
