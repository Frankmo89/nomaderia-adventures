import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ContentV1 } from "@/types/itinerary";
import type { ClientItinerary } from "@/hooks/use-itinerary";
import ClientItineraryLayout, { ItinerarySkeleton } from "@/components/itinerary/ClientItineraryLayout";
import { STATUS_CONFIG } from "@/pages/admin/AdminClientItineraryDetail";

type Row = Tables<"client_itineraries">;

// Misma lógica de public.get_itinerary_by_token cuando show_costs = false:
// quita precio_usd/precio_nota de cada bloque, para que la vista previa
// muestre exactamente lo que el cliente verá una vez compartida.
function stripCosts(content: ContentV1): ContentV1 {
  return {
    ...content,
    dias: content.dias.map((d) => ({
      ...d,
      bloques: d.bloques.map((b) => ({ ...b, precio_usd: null, precio_nota: null })),
    })),
  };
}

function PreviewBanner({ status, onBack }: { status: string; onBack: () => void }) {
  const label = STATUS_CONFIG[status]?.label ?? status;
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-100 border-b border-amber-300">
      <span className="text-[12.5px] font-medium text-amber-900">
        👁️ Vista previa — {label} · así lo verá el cliente cuando se comparta
      </span>
      <Button size="sm" variant="outline" className="h-7 shrink-0 border-amber-400 bg-white/70 text-amber-900 hover:bg-white" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Volver al editor
      </Button>
    </div>
  );
}

const AdminClientItineraryPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("client_itineraries")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        setRow(data as Row);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <ItinerarySkeleton />;

  if (!row) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Itinerario no encontrado.
      </div>
    );
  }

  const raw = row.content as unknown as ContentV1;
  const content: ContentV1 =
    raw?.version === 1 && Array.isArray(raw.dias) ? raw : { version: 1, dias: [] };

  const itinerary: ClientItinerary = {
    client_name: row.client_name,
    trip_start: row.trip_start,
    trip_end: row.trip_end,
    content: row.show_costs ? content : stripCosts(content),
    status: row.status,
    updated_at: row.updated_at,
    title: row.title,
  };

  return (
    <ClientItineraryLayout
      itinerary={itinerary}
      banner={
        <PreviewBanner
          status={row.status}
          onBack={() => navigate(`/admin/client-itineraries/${row.id}`)}
        />
      }
    />
  );
};

export default AdminClientItineraryPreview;
