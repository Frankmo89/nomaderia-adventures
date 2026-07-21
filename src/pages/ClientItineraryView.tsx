import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useClientItinerary } from "@/hooks/use-itinerary";
import { trackEvent } from "@/lib/analytics";
import { usePageMeta } from "@/hooks/use-seo";
import ClientItineraryLayout, { ItinerarySkeleton, ItineraryUnavailable } from "@/components/itinerary/ClientItineraryLayout";

export default function ClientItineraryView() {
  const { token = "" } = useParams<{ token: string }>();
  const { data: itinerary, isLoading, isError } = useClientItinerary(token);

  const parque = itinerary?.content?.parque ?? null;
  const title = itinerary?.title?.trim() || parque;

  usePageMeta({
    title: itinerary ? (title ? `Tu ${title} — Nomaderia` : "Tu itinerario — Nomaderia") : "Itinerario — Nomaderia",
    description: "Tu itinerario personalizado de Nomaderia.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    if (itinerary) {
      trackEvent("client_itinerary_view", { token });
    }
  }, [itinerary, token]);

  if (isLoading) return <ItinerarySkeleton />;
  if (isError || !itinerary) return <ItineraryUnavailable />;

  return <ClientItineraryLayout itinerary={itinerary} token={token} />;
}
