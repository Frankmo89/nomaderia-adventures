import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerifyFieldBadge } from "@/components/admin/VerifyFieldBadge";
import type { PermitWindowDraft } from "@/types/ai-permits";
import { PARK_NAMES } from "@/lib/parks";

interface PermitWindowDraftEditorProps {
  item: PermitWindowDraft;
  index: number;
  onChange: (index: number, next: PermitWindowDraft) => void;
  onSave: (index: number) => void;
  saving: boolean;
}

const inputCls = "bg-background border-border text-foreground";

function formatForDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function PermitWindowDraftEditor({ item, index, onChange, onSave, saving }: PermitWindowDraftEditorProps) {
  const setField = <K extends keyof PermitWindowDraft>(key: K, value: PermitWindowDraft[K]) => {
    onChange(index, { ...item, [key]: value });
  };

  const parkOptions = (() => {
    const options = [...PARK_NAMES] as string[];
    if (item.park && !options.includes(item.park)) {
      options.push(item.park);
    }
    return options;
  })();

  return (
    <article className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl text-card-foreground">Ventana propuesta #{index + 1}</h3>
        <Button type="button" onClick={() => onSave(index)} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-card-foreground mb-2">Parque</Label>
          <Select value={item.park} onValueChange={(value) => setField("park", value)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              {parkOptions.map((park) => (
                <SelectItem key={park} value={park}>{park}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-card-foreground mb-2">Permiso</Label>
          <Input className={inputCls} value={item.permit_name} onChange={(e) => setField("permit_name", e.target.value)} />
        </div>

        <div>
          <Label className="text-card-foreground mb-2">Tipo de ventana</Label>
          <Select value={item.window_type} onValueChange={(value) => setField("window_type", value as PermitWindowDraft["window_type"])}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lottery">Lotería</SelectItem>
              <SelectItem value="reservation_release">Liberación de reservas</SelectItem>
              <SelectItem value="first_come">Primero en llegar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-card-foreground mb-2">Año</Label>
          <Input type="number" className={inputCls} value={item.year} onChange={(e) => setField("year", Number(e.target.value) || new Date().getFullYear())} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-card-foreground">Abre en</Label>
            <VerifyFieldBadge />
          </div>
          <Input
            type="datetime-local"
            className={inputCls}
            value={formatForDateTimeLocal(item.opens_at)}
            onChange={(e) => setField("opens_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-card-foreground">Cierra en</Label>
            <VerifyFieldBadge />
          </div>
          <Input
            type="datetime-local"
            className={inputCls}
            value={formatForDateTimeLocal(item.closes_at)}
            onChange={(e) => setField("closes_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>

        <div>
          <Label className="text-card-foreground mb-2">URL para aplicar</Label>
          <Input className={inputCls} value={item.how_to_apply_url ?? ""} onChange={(e) => setField("how_to_apply_url", e.target.value || null)} placeholder="https://..." />
        </div>

        <div>
          <Label className="text-card-foreground mb-2">URL fuente oficial</Label>
          <Input className={inputCls} value={item.source_url ?? ""} onChange={(e) => setField("source_url", e.target.value || null)} placeholder="https://..." />
        </div>
      </div>

      <div>
        <Label className="text-card-foreground mb-2">Notas</Label>
        <Textarea className={inputCls} rows={3} value={item.notes ?? ""} onChange={(e) => setField("notes", e.target.value || null)} />
      </div>
    </article>
  );
}
