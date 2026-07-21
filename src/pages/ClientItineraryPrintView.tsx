import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { useClientItinerary } from "@/hooks/use-itinerary";
import { usePageMeta } from "@/hooks/use-seo";
import ClientItineraryLayout, { ItinerarySkeleton, ItineraryUnavailable } from "@/components/itinerary/ClientItineraryLayout";

function DownloadBar() {
  return (
    <div className="print:hidden sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-forest-dark">
      <p className="text-[12px] text-mist/85">
        Elige <strong className="text-white">"Guardar como PDF"</strong> en el diálogo de impresión.
      </p>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-1.5 text-[13px] font-medium text-white hover:bg-green-dark"
      >
        <Printer size={14} />
        Descargar PDF
      </button>
    </div>
  );
}

export default function ClientItineraryPrintView() {
  const { token = "" } = useParams<{ token: string }>();
  const { data: itinerary, isLoading, isError } = useClientItinerary(token);

  usePageMeta({
    title: "Itinerario — Nomaderia",
    description: "Versión imprimible de tu itinerario personalizado de Nomaderia.",
    robots: "noindex, nofollow",
  });

  if (isLoading) return <ItinerarySkeleton />;
  if (isError || !itinerary) return <ItineraryUnavailable />;

  return <ClientItineraryLayout itinerary={itinerary} variant="print" banner={<DownloadBar />} />;
}
