import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminItineraryTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon" aria-label="Volver a plantillas">
          <Link to="/admin/itinerary-templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-serif text-3xl text-foreground">Editor de Plantilla</h1>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-10 flex flex-col items-center justify-center gap-4 text-center min-h-[320px]">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-stone-800/70">
          <Construction className="h-7 w-7 text-stone-400" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <h2 className="font-serif text-xl text-foreground">Editor en construcción</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El editor de bloques de itinerario estará disponible próximamente.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">ID: {id}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminItineraryTemplateEditor;
