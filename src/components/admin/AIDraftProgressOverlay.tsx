import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIDraftProgressOverlayProps {
  open: boolean;
  message: string;
  onCancel: () => void;
}

export function AIDraftProgressOverlay({ open, message, onCancel }: AIDraftProgressOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-card-foreground">Generando borrador IA</h2>
            <p className="text-sm text-muted-foreground">Progreso por etapas en cliente; no es streaming real.</p>
          </div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary font-medium">
          {message}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="outline" className="border-border text-foreground" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
