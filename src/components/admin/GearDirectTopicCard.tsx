import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParkSelect } from "@/components/admin/ParkSelect";

/**
 * Card "Desarrollar mi propio tema" para gear — bypassa discover-trending-gear
 * por completo. Reusa el mismo pipeline candidate -> AdminGearArticleForm
 * autofill que "Desarrollar este" (TrendingGearCard). A diferencia del
 * equivalente de blog, generate-gear-draft requiere category (no es opcional),
 * así que el card pide título y categoría.
 */
export function GearDirectTopicCard() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [destinationId, setDestinationId] = useState<string | undefined>(undefined);

  const handleDevelop = () => {
    const trimmedTopic = topic.trim();
    const trimmedCategory = category.trim();
    if (!trimmedTopic || !trimmedCategory) return;

    const candidatePayload = encodeURIComponent(
      JSON.stringify({
        title: trimmedTopic,
        category: trimmedCategory,
        destination_id: destinationId,
      }),
    );

    navigate(`/admin/gear-articles/new?candidate=${candidatePayload}`);
  };

  return (
    <section className="mb-6 rounded-xl border border-border bg-card/40 p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-2xl text-foreground">Desarrollar mi propio tema</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 sm:items-end">
        <div className="space-y-2">
          <Label className="text-foreground">Tema</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Escribe tu idea de tema…"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Categoría</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej. botas, mochilas…"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Parque (opcional)</Label>
          <ParkSelect value={destinationId} onChange={setDestinationId} className="sm:w-56" />
        </div>
        <Button
          type="button"
          disabled={!topic.trim() || !category.trim()}
          onClick={handleDevelop}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Desarrollar →
        </Button>
      </div>
    </section>
  );
}
