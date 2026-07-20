import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, AlertCircle, Check, ChevronDown,
  Copy, MoreHorizontal, MoveRight, Pencil, Plane, Plus, Trash2,
  Route, UtensilsCrossed, Tent, Car, TriangleAlert, Ticket, DollarSign, StickyNote,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BlockTipo, BlockExtra, ItBlock, ItDay, ContentV1 } from "@/types/itinerary";
import {
  bloqueFormSchema, bloqueToFormValues, formValuesToBloque,
  type BloqueFormValues,
} from "@/lib/itinerary-schema";
import { useParkTrails, parseDistanceKm, type ParkTrailOption } from "@/hooks/use-park-trails";
import { useCampgrounds, type CampgroundOption } from "@/hooks/use-campgrounds";

// ─── Domain types ─────────────────────────────────────────────────────────────
// Canónicos en @/types/itinerary (ADR-018); re-export para no romper imports.
export type { BlockTipo, BlockExtra, ItBlock, ItDay, ContentV1 };

// ─── Block config ─────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<BlockTipo, string> = {
  ruta: "Ruta",
  comida: "Comida",
  alojamiento: "Alojamiento",
  traslado: "Traslado",
  tip_seguridad: "Tip de Seguridad",
  permiso: "Permiso",
  costo: "Costo",
  nota: "Nota",
};

const TIPO_ICONS: Record<BlockTipo, React.ElementType> = {
  ruta: Route,
  comida: UtensilsCrossed,
  alojamiento: Tent,
  traslado: Car,
  tip_seguridad: TriangleAlert,
  permiso: Ticket,
  costo: DollarSign,
  nota: StickyNote,
};

// Menú de tipos: los 8 tipos v1 + "Vuelo" (atajo: traslado con modo "vuelo" —
// el contrato v1 es canónico, no se agrega un tipo nuevo. ADR-018).
interface AddMenuEntry {
  key: string;
  tipo: BlockTipo;
  label: string;
  icon: React.ElementType;
  modoPreset?: "vuelo";
}

const ADD_MENU: AddMenuEntry[] = [
  { key: "ruta", tipo: "ruta", label: "Ruta", icon: Route },
  { key: "alojamiento", tipo: "alojamiento", label: "Alojamiento", icon: Tent },
  { key: "comida", tipo: "comida", label: "Comida", icon: UtensilsCrossed },
  { key: "traslado", tipo: "traslado", label: "Traslado", icon: Car },
  { key: "vuelo", tipo: "traslado", label: "Vuelo", icon: Plane, modoPreset: "vuelo" },
  { key: "nota", tipo: "nota", label: "Nota", icon: StickyNote },
  { key: "tip_seguridad", tipo: "tip_seguridad", label: "Tip de Seguridad", icon: TriangleAlert },
  { key: "permiso", tipo: "permiso", label: "Permiso", icon: Ticket },
  { key: "costo", tipo: "costo", label: "Costo", icon: DollarSign },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function dayDateLabel(day: ItDay, idx: number, tripStart?: string | null): string | null {
  if (day.fecha) return fmtShortDate(new Date(day.fecha + "T12:00:00"));
  if (tripStart) {
    const d = new Date(tripStart + "T12:00:00");
    d.setDate(d.getDate() + idx);
    return fmtShortDate(d);
  }
  return null;
}

function daySubtotal(day: ItDay): number {
  return day.bloques.reduce(
    (sum, b) => sum + (typeof b.precio_usd === "number" ? b.precio_usd : 0),
    0,
  );
}

function getBlockMeta(block: ItBlock): string {
  const parts: string[] = [];
  if (block.horario) parts.push(block.horario);
  if (block.tipo === "ruta" && block.extra?.distancia_km != null) {
    parts.push(`${block.extra.distancia_km} km`);
  }
  if (block.tipo === "traslado") {
    if (block.extra?.modo) parts.push(block.extra.modo);
    if (block.extra?.origen && block.extra?.destino) {
      parts.push(`${block.extra.origen} → ${block.extra.destino}`);
    }
    if (block.extra?.duracion) parts.push(block.extra.duracion);
  }
  if (block.precio_usd != null) parts.push(`$${block.precio_usd} USD`);
  if (block.verify_flag) parts.push("⚠ verificar");
  return parts.join(" · ");
}

/** Renumera dias 1..N; sincroniza títulos auto ("Día N") con la posición nueva. */
function renumber(dias: ItDay[]): ItDay[] {
  return dias.map((d, i) => ({
    ...d,
    dia: i + 1,
    titulo: /^Día \d+$/.test(d.titulo) ? `Día ${i + 1}` : d.titulo,
  }));
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ─── Campo de título con sugerencias (park_trails / campgrounds) ──────────────
// Combobox ligero sin dependencias nuevas: Input + lista filtrada client-side.

interface Suggestion {
  id: string;
  label: string;
  meta: string;
}

interface SuggestTitleFieldProps {
  value: string;
  onChange: (v: string) => void;
  suggestions: Suggestion[];
  onPick: (id: string) => void;
  placeholder: string;
}

function SuggestTitleField({ value, onChange, suggestions, onPick, placeholder }: SuggestTitleFieldProps) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = (q
    ? suggestions.filter((s) => s.label.toLowerCase().includes(q))
    : suggestions
  ).slice(0, 6);

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-md border border-border bg-white shadow-lg overflow-hidden">
          {matches.map((s) => (
            <button
              key={s.id}
              type="button"
              className="w-full flex items-baseline justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              onMouseDown={(e) => { e.preventDefault(); onPick(s.id); setOpen(false); }}
            >
              <span className="text-[13px] text-foreground truncate">{s.label}</span>
              {s.meta && (
                <span className="text-[11px] text-muted-foreground shrink-0">{s.meta}</span>
              )}
            </button>
          ))}
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground bg-gray-50">
            Datos oficiales del parque — o sigue escribiendo texto libre
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Formulario inline de bloque ──────────────────────────────────────────────

interface BlockFormProps {
  tipo: BlockTipo;
  existing: ItBlock | null;
  modoPreset?: "vuelo";
  trails: ParkTrailOption[];
  campgrounds: CampgroundOption[];
  onCancel: () => void;
  onSubmit: (block: ItBlock) => void;
}

function BlockForm({ tipo, existing, modoPreset, trails, campgrounds, onCancel, onSubmit }: BlockFormProps) {
  const [trailId, setTrailId] = useState<string | null>(existing?.extra?.trail_id ?? null);
  const [campgroundId, setCampgroundId] = useState<string | null>(
    existing?.extra?.campground_id ?? null,
  );

  const form = useForm<BloqueFormValues>({
    resolver: zodResolver(bloqueFormSchema),
    defaultValues: existing
      ? bloqueToFormValues(existing)
      : {
          titulo: "", contenido_md: "", horario: "", precio_usd: "", precio_nota: "",
          fuente_url: "", afiliado_url: "", verify_flag_on: false,
          distancia_km: "", desnivel_m: "", apto_principiante: false,
          duracion: "", modo: modoPreset ?? "", origen: "", destino: "",
          reservado: false, confirmacion_ref: "",
        },
  });

  const pickTrail = (id: string) => {
    const t = trails.find((x) => x.id === id);
    if (!t) return;
    setTrailId(t.id);
    form.setValue("titulo", t.name, { shouldValidate: true });
    const km = parseDistanceKm(t.distance);
    if (km != null) form.setValue("distancia_km", String(km));
    if (t.difficulty) {
      form.setValue("apto_principiante", /easy|f[aá]cil/i.test(t.difficulty));
    }
    if (t.nps_url) form.setValue("fuente_url", t.nps_url);
    if (t.description_es && !form.getValues("contenido_md")) {
      form.setValue("contenido_md", t.description_es);
    }
  };

  const pickCampground = (id: string) => {
    const c = campgrounds.find((x) => x.id === id);
    if (!c) return;
    setCampgroundId(c.id);
    form.setValue("titulo", c.nombre, { shouldValidate: true });
    if (c.precio_usd != null) form.setValue("precio_usd", String(c.precio_usd));
    if (c.precio_nota) form.setValue("precio_nota", c.precio_nota);
    if (c.reserva_url) form.setValue("afiliado_url", c.reserva_url);
  };

  const suggestions: Suggestion[] =
    tipo === "ruta"
      ? trails.map((t) => ({
          id: t.id,
          label: t.name,
          meta: [t.distance, t.difficulty].filter(Boolean).join(" · "),
        }))
      : tipo === "alojamiento"
        ? campgrounds.map((c) => ({
            id: c.id,
            label: c.nombre,
            meta: [
              c.precio_usd != null ? `$${c.precio_usd}` : null,
              c.dentro_del_parque ? "en el parque" : null,
            ].filter(Boolean).join(" · "),
          }))
        : [];

  const handlePick = tipo === "ruta" ? pickTrail : pickCampground;

  const submit = (values: BloqueFormValues) => {
    const overrides: Partial<BlockExtra> = {};
    if (tipo === "ruta") overrides.trail_id = trailId;
    if (tipo === "alojamiento") overrides.campground_id = campgroundId;
    onSubmit(formValuesToBloque(tipo, values, existing, overrides));
  };

  const labelCls = "text-[11px] uppercase tracking-wide text-muted-foreground";

  return (
    <Form {...form}>
      <div className="px-4 py-4 space-y-4 bg-[#F7F9F5] border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          {(() => {
            const Icon = modoPreset === "vuelo" ? Plane : TIPO_ICONS[tipo];
            return <Icon className="h-[15px] w-[15px] text-gray-500" strokeWidth={1.8} />;
          })()}
          <span className="text-[13px] font-medium text-foreground">
            {modoPreset === "vuelo" ? "Vuelo" : TIPO_LABELS[tipo]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {existing ? "· editando" : "· nuevo"}
          </span>
        </div>

        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Título</FormLabel>
              <FormControl>
                {suggestions.length > 0 ? (
                  <SuggestTitleField
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      // Texto libre tras elegir sugerencia ⇒ ya no es ese registro
                      if (tipo === "ruta") setTrailId(null);
                      if (tipo === "alojamiento") setCampgroundId(null);
                    }}
                    suggestions={suggestions}
                    onPick={handlePick}
                    placeholder={tipo === "ruta" ? "Busca un sendero del parque…" : "Busca un campground o escribe un hotel…"}
                  />
                ) : (
                  <Input placeholder="Título del bloque" {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contenido_md"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Descripción en markdown..." className="resize-none" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="horario"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Horario</FormLabel>
                <FormControl>
                  <Input placeholder="8:00–10:00" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="precio_usd"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelCls}>Precio USD</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="precio_nota"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Nota de precio</FormLabel>
              <FormControl>
                <Input placeholder="Ej: por persona · sujeto a cambios" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {tipo === "ruta" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="distancia_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Distancia km</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.1" placeholder="0.0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="desnivel_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Desnivel m</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="apto_principiante"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-1">
                  <FormLabel className="text-[13px] text-foreground font-normal cursor-pointer">
                    Apto para principiantes
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {tipo === "traslado" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Duración</FormLabel>
                    <FormControl>
                      <Input placeholder="45 min" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="modo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Modo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Modo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="shuttle">Shuttle</SelectItem>
                        <SelectItem value="caminar">Caminar</SelectItem>
                        <SelectItem value="vuelo">Vuelo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="origen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Origen</FormLabel>
                    <FormControl>
                      <Input placeholder="San Diego" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelCls}>Destino</FormLabel>
                    <FormControl>
                      <Input placeholder="Joshua Tree" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {tipo === "alojamiento" && (
          <>
            <FormField
              control={form.control}
              name="reservado"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-1">
                  <FormLabel className="text-[13px] text-foreground font-normal cursor-pointer">
                    Reserva confirmada
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmacion_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelCls}>Nº de confirmación</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC123" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="fuente_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Fuente oficial</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://www.nps.gov/..."
                  className="text-[#166534] placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="afiliado_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>
                Link de reserva / afiliado <span className="normal-case">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verify_flag_on"
          render={({ field }) => (
            <FormItem className="rounded-[10px] bg-[#FEF3C7] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#92400E]">Dato volátil</p>
                <p className="text-[11px] text-[#B45309] mt-0.5">Marcar verificación</p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-[#B45309]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={form.handleSubmit(submit)}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Form>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ItineraryBlockEditorProps {
  content: ContentV1;
  title: string;
  subtitle: string;
  backHref: string;
  onSave: (c: ContentV1) => Promise<void>;
  /** Habilita autocompletes de park_trails / campgrounds del parque */
  destinationId?: string | null;
  /** Fecha de inicio del viaje — deriva la fecha mostrada por día */
  tripStart?: string | null;
}

// ─── Main component ───────────────────────────────────────────────────────────

const ItineraryBlockEditor = ({
  content: initialContent,
  title,
  subtitle,
  backHref,
  onSave,
  destinationId,
  tripStart,
}: ItineraryBlockEditorProps) => {
  const { toast } = useToast();

  const [content, setContent] = useState<ContentV1>(initialContent);
  const contentRef = useRef<ContentV1>(initialContent);
  useEffect(() => { contentRef.current = content; }, [content]);

  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Edición inline: blockIdx null ⇒ bloque nuevo (se agrega al guardar)
  const [editing, setEditing] = useState<{
    dayIdx: number; blockIdx: number | null; tipo: BlockTipo; modoPreset?: "vuelo";
  } | null>(null);
  const [addMenuDay, setAddMenuDay] = useState<number | null>(null);
  const [renamingDay, setRenamingDay] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [reorderDay, setReorderDay] = useState<number | null>(null);
  const [reorderTab, setReorderTab] = useState<"bloques" | "dias">("bloques");
  const [moveTarget, setMoveTarget] = useState<{ dayIdx: number; blockIdx: number } | null>(null);
  const [deleteDayTarget, setDeleteDayTarget] = useState<number | null>(null);

  // Undo: snapshot del array de días previo a la operación destructiva
  const undoRef = useRef<ItDay[] | null>(null);

  const { data: trails = [] } = useParkTrails(destinationId);
  const { data: campgrounds = [] } = useCampgrounds(destinationId);

  // ── Persistencia: un UPDATE por acción explícita (sin debounce) ─────────────

  const applyAndSave = useCallback(async (next: ContentV1) => {
    setContent(next);
    contentRef.current = next;
    setSaveStatus("saving");
    try {
      await onSave(next);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      toast({ title: "Error al guardar", description: "Verifica tu conexión.", variant: "destructive" });
    }
  }, [onSave, toast]);

  const updateDias = useCallback((dias: ItDay[]) => {
    applyAndSave({ ...contentRef.current, dias });
  }, [applyAndSave]);

  const handleUndo = useCallback(() => {
    if (!undoRef.current) return;
    const prev = undoRef.current;
    undoRef.current = null;
    updateDias(prev);
  }, [updateDias]);

  const toastWithUndo = useCallback((titleText: string) => {
    toast({
      title: titleText,
      action: (
        <ToastAction altText="Deshacer" onClick={handleUndo}>
          Deshacer
        </ToastAction>
      ),
    });
  }, [toast, handleUndo]);

  const snapshot = useCallback(() => {
    undoRef.current = contentRef.current.dias;
  }, []);

  // ── Operaciones de día ──────────────────────────────────────────────────────

  const insertDayAt = useCallback((idx: number) => {
    const dias = [...contentRef.current.dias];
    dias.splice(idx, 0, { dia: 0, titulo: `Día ${idx + 1}`, bloques: [] });
    updateDias(renumber(dias));
  }, [updateDias]);

  const appendDay = useCallback(() => {
    insertDayAt(contentRef.current.dias.length);
  }, [insertDayAt]);

  const confirmDeleteDay = useCallback((idx: number) => {
    const day = contentRef.current.dias[idx];
    if (!day) return;
    if (day.bloques.length > 0) {
      setDeleteDayTarget(idx);
    } else {
      snapshot();
      updateDias(renumber(contentRef.current.dias.filter((_, i) => i !== idx)));
      toastWithUndo("Día eliminado");
    }
  }, [snapshot, updateDias, toastWithUndo]);

  const deleteDayConfirmed = useCallback(() => {
    if (deleteDayTarget === null) return;
    snapshot();
    updateDias(renumber(contentRef.current.dias.filter((_, i) => i !== deleteDayTarget)));
    setDeleteDayTarget(null);
    toastWithUndo("Día eliminado");
  }, [deleteDayTarget, snapshot, updateDias, toastWithUndo]);

  const startRename = useCallback((idx: number) => {
    setRenamingDay(idx);
    setRenameValue(contentRef.current.dias[idx]?.titulo ?? "");
  }, []);

  const commitRename = useCallback(() => {
    if (renamingDay === null) return;
    const idx = renamingDay;
    setRenamingDay(null);
    const value = renameValue.trim();
    const dias = contentRef.current.dias.map((d, i) =>
      i === idx ? { ...d, titulo: value || `Día ${i + 1}` } : d,
    );
    updateDias(dias);
  }, [renamingDay, renameValue, updateDias]);

  const moveDay = useCallback((idx: number, dir: -1 | 1) => {
    const dias = contentRef.current.dias;
    const j = idx + dir;
    if (j < 0 || j >= dias.length) return;
    updateDias(renumber(swap(dias, idx, j)));
  }, [updateDias]);

  // ── Operaciones de bloque ───────────────────────────────────────────────────

  const saveBlock = useCallback((block: ItBlock) => {
    if (!editing) return;
    const { dayIdx, blockIdx } = editing;
    const dias = contentRef.current.dias.map((d, i) => {
      if (i !== dayIdx) return d;
      const bloques = blockIdx === null
        ? [...d.bloques, block]
        : d.bloques.map((b, j) => (j === blockIdx ? block : b));
      return { ...d, bloques };
    });
    setEditing(null);
    updateDias(dias);
  }, [editing, updateDias]);

  const deleteBlock = useCallback((dayIdx: number, blockIdx: number) => {
    snapshot();
    const dias = contentRef.current.dias.map((d, i) =>
      i === dayIdx ? { ...d, bloques: d.bloques.filter((_, j) => j !== blockIdx) } : d,
    );
    updateDias(dias);
    toastWithUndo("Bloque eliminado");
  }, [snapshot, updateDias, toastWithUndo]);

  const duplicateBlock = useCallback((dayIdx: number, blockIdx: number) => {
    const src = contentRef.current.dias[dayIdx]?.bloques[blockIdx];
    if (!src) return;
    const copy: ItBlock = { ...JSON.parse(JSON.stringify(src)), id: crypto.randomUUID() };
    const dias = contentRef.current.dias.map((d, i) => {
      if (i !== dayIdx) return d;
      const bloques = [...d.bloques];
      bloques.splice(blockIdx + 1, 0, copy);
      return { ...d, bloques };
    });
    updateDias(dias);
    toast({ title: "Bloque duplicado" });
  }, [updateDias, toast]);

  const moveBlockToDay = useCallback((fromDay: number, blockIdx: number, toDay: number) => {
    if (fromDay === toDay) return;
    const block = contentRef.current.dias[fromDay]?.bloques[blockIdx];
    if (!block) return;
    snapshot();
    const dias = contentRef.current.dias.map((d, i) => {
      if (i === fromDay) return { ...d, bloques: d.bloques.filter((_, j) => j !== blockIdx) };
      if (i === toDay) return { ...d, bloques: [...d.bloques, block] };
      return d;
    });
    setMoveTarget(null);
    updateDias(dias);
    toastWithUndo(`Bloque movido al Día ${toDay + 1}`);
  }, [snapshot, updateDias, toastWithUndo]);

  const moveBlockInDay = useCallback((dayIdx: number, blockIdx: number, dir: -1 | 1) => {
    const day = contentRef.current.dias[dayIdx];
    if (!day) return;
    const j = blockIdx + dir;
    if (j < 0 || j >= day.bloques.length) return;
    const dias = contentRef.current.dias.map((d, i) =>
      i === dayIdx ? { ...d, bloques: swap(d.bloques, blockIdx, j) } : d,
    );
    updateDias(dias);
  }, [updateDias]);

  // ── UI helpers ──────────────────────────────────────────────────────────────

  const toggleDay = (idx: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const scrollToDay = (idx: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`builder-dia-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const startAddBlock = (dayIdx: number, entry: AddMenuEntry) => {
    setAddMenuDay(null);
    setEditing({ dayIdx, blockIdx: null, tipo: entry.tipo, modoPreset: entry.modoPreset });
  };

  const saveLabel =
    saveStatus === "error" ? "Error al guardar" :
    saveStatus === "saving" ? "Guardando…" :
    saveStatus === "saved" ? "Guardado" : "";

  const reorderDayObj = reorderDay !== null ? content.dias[reorderDay] : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">

      {/* Header + day chips (sticky juntos) */}
      <div className="sticky top-0 z-20">
        <div className="bg-sidebar text-sidebar-foreground flex items-center gap-3 px-4 py-3 border-b border-sidebar-border">
          <Link
            to={backHref}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-serif text-[17px] font-semibold text-sidebar-foreground truncate leading-tight">
              {title || "Itinerario"}
            </p>
            <p className="text-[11px] text-sidebar-foreground/50 mt-0.5 truncate">{subtitle}</p>
          </div>

          {saveLabel && (
            <span
              className={cn(
                "flex items-center gap-1 text-[11px] shrink-0",
                saveStatus === "error" ? "text-red-400" : "text-sidebar-foreground/50",
              )}
            >
              {saveStatus === "error"
                ? <AlertCircle className="h-3 w-3" />
                : <Check className="h-3 w-3" />}
              {saveLabel}
            </span>
          )}
        </div>

        {/* Day chips */}
        <div className="bg-[#FAFAFA] border-b border-gray-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2 px-4 py-2 w-max">
            {content.dias.map((day, idx) => (
              <button
                key={idx}
                className="flex-none px-3.5 py-1 rounded-full text-[12px] font-medium border border-gray-300 text-gray-600 bg-white hover:border-[#166534] hover:text-[#166534] transition-colors whitespace-nowrap"
                onClick={() => scrollToDay(idx)}
              >
                Día {day.dia}
              </button>
            ))}
            <button
              className="flex-none px-3.5 py-1 rounded-full text-[12px] font-medium bg-[#166534] text-white hover:bg-[#166534]/85 transition-colors"
              onClick={appendDay}
              title="Añadir día"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="px-4 pt-4 space-y-3">
        {content.dias.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            Sin días todavía. Toca "+" para empezar.
          </p>
        )}

        {content.dias.map((day, dayIdx) => {
          const isCollapsed = collapsedDays.has(dayIdx);
          const dateLabel = dayDateLabel(day, dayIdx, tripStart);
          const subtotal = daySubtotal(day);
          return (
            <div
              key={dayIdx}
              id={`builder-dia-${dayIdx}`}
              className="bg-white rounded-[12px] overflow-hidden scroll-mt-28"
              style={{ border: "0.5px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              {/* Day header */}
              <div className="flex items-center gap-1 pl-4 pr-2 py-2.5">
                {renamingDay === dayIdx ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingDay(null); }}
                    className="h-8 text-[14px]"
                    placeholder={`Día ${dayIdx + 1}`}
                  />
                ) : (
                  <button
                    className="flex-1 min-w-0 flex items-baseline gap-2 text-left py-1"
                    onClick={() => toggleDay(dayIdx)}
                  >
                    <span className="font-serif text-[16px] font-semibold text-foreground leading-none shrink-0">
                      Día {day.dia}
                    </span>
                    <span className="text-[12px] text-muted-foreground leading-none truncate">
                      {[
                        !/^Día \d+$/.test(day.titulo) ? day.titulo : null,
                        dateLabel,
                        subtotal > 0 ? `$${Math.round(subtotal)}` : null,
                      ].filter(Boolean).join(" · ") ||
                        `${day.bloques.length} ${day.bloques.length === 1 ? "bloque" : "bloques"}`}
                    </span>
                  </button>
                )}

                <button
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                  onClick={() => { setReorderTab("bloques"); setReorderDay(dayIdx); }}
                  title="Reordenar"
                  aria-label="Reordenar"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                      aria-label="Opciones del día"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => insertDayAt(dayIdx)}>
                      <Plus className="h-4 w-4 mr-2" /> Añadir día antes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => insertDayAt(dayIdx + 1)}>
                      <Plus className="h-4 w-4 mr-2" /> Añadir día después
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => startRename(dayIdx)}>
                      <Pencil className="h-4 w-4 mr-2" /> Renombrar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => confirmDeleteDay(dayIdx)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar día
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  className="h-8 w-8 flex items-center justify-center shrink-0"
                  onClick={() => toggleDay(dayIdx)}
                  aria-label={isCollapsed ? "Expandir día" : "Colapsar día"}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      !isCollapsed && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {/* Day body */}
              {!isCollapsed && (
                <div className="border-t border-gray-100">
                  {day.bloques.length === 0 && !(editing?.dayIdx === dayIdx && editing.blockIdx === null) && (
                    <p className="text-[13px] text-muted-foreground text-center py-4">
                      Sin bloques todavía.
                    </p>
                  )}

                  {day.bloques.map((block, blockIdx) => {
                    const isEditingThis =
                      editing?.dayIdx === dayIdx && editing.blockIdx === blockIdx;
                    if (isEditingThis) {
                      return (
                        <BlockForm
                          key={block.id}
                          tipo={editing.tipo}
                          existing={block}
                          trails={trails}
                          campgrounds={campgrounds}
                          onCancel={() => setEditing(null)}
                          onSubmit={saveBlock}
                        />
                      );
                    }
                    const Icon = TIPO_ICONS[block.tipo];
                    const isTip = block.tipo === "tip_seguridad";
                    const meta = getBlockMeta(block);
                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "flex items-center gap-3 pl-4 pr-1 py-3 border-b border-gray-100 last:border-b-0",
                          isTip ? "bg-[#FEF3C7]" : "bg-white",
                        )}
                      >
                        <Icon
                          className={cn("h-[17px] w-[17px] shrink-0", isTip ? "text-[#854F0B]" : "text-gray-400")}
                          strokeWidth={1.8}
                        />
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => setEditing({ dayIdx, blockIdx, tipo: block.tipo })}
                        >
                          <div className="flex items-center gap-1.5">
                            <p className={cn("text-[13px] font-medium truncate", isTip ? "text-[#633806]" : "text-foreground")}>
                              {block.titulo}
                            </p>
                            {block.tipo === "alojamiento" && block.extra?.reservado && (
                              <span className="text-[10px] font-medium px-1.5 py-px rounded-full bg-green-100 text-green-800 shrink-0">
                                Reservado
                              </span>
                            )}
                          </div>
                          <p className={cn("text-[11px] mt-0.5 truncate", isTip ? "text-[#854F0B]/70" : "text-muted-foreground")}>
                            {TIPO_LABELS[block.tipo]}{meta ? ` · ${meta}` : ""}
                          </p>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                              aria-label="Opciones del bloque"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setMoveTarget({ dayIdx, blockIdx })}>
                              <MoveRight className="h-4 w-4 mr-2" /> Mover a día…
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateBlock(dayIdx, blockIdx)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicar bloque
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => deleteBlock(dayIdx, blockIdx)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}

                  {/* Nuevo bloque en edición */}
                  {editing?.dayIdx === dayIdx && editing.blockIdx === null && (
                    <BlockForm
                      tipo={editing.tipo}
                      existing={null}
                      modoPreset={editing.modoPreset}
                      trails={trails}
                      campgrounds={campgrounds}
                      onCancel={() => setEditing(null)}
                      onSubmit={saveBlock}
                    />
                  )}

                  {/* Añadir bloque */}
                  {addMenuDay === dayIdx ? (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                          Tipo de bloque
                        </p>
                        <button
                          className="text-[12px] text-muted-foreground hover:text-foreground"
                          onClick={() => setAddMenuDay(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ADD_MENU.map((entry) => {
                          const Icon = entry.icon;
                          return (
                            <button
                              key={entry.key}
                              onClick={() => startAddBlock(dayIdx, entry)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-gray-200/80 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <Icon className="h-[16px] w-[16px] text-gray-500 shrink-0" strokeWidth={1.8} />
                              <span className="text-[13px] font-medium text-foreground">{entry.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !(editing?.dayIdx === dayIdx && editing.blockIdx === null) && (
                      <button
                        className="w-full py-2.5 text-[13px] font-medium text-[#166534] hover:bg-[#166534]/5 border-t border-gray-100 transition-colors"
                        onClick={() => { setEditing(null); setAddMenuDay(dayIdx); }}
                      >
                        + Añadir bloque
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}

        {content.dias.length > 0 && (
          <button
            className="w-full py-3 text-[15px] font-medium text-[#166534] hover:text-[#166534]/70 transition-colors"
            onClick={appendDay}
          >
            + Añadir día
          </button>
        )}
      </div>

      {/* ── Sheet: Reordenar (bloques del día / días) ───────────────────────── */}
      <Sheet open={reorderDay !== null} onOpenChange={(open) => { if (!open) setReorderDay(null); }}>
        <SheetContent side="bottom" className="rounded-t-[16px] p-0 flex flex-col border-0 h-[60vh]">
          <SheetTitle className="sr-only">Reordenar</SheetTitle>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="flex gap-1.5 px-5 pt-1 pb-3 shrink-0">
            {(["bloques", "dias"] as const).map((tab) => (
              <button
                key={tab}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  reorderTab === tab
                    ? "bg-[#166534] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
                onClick={() => setReorderTab(tab)}
              >
                {tab === "bloques"
                  ? `Bloques del Día ${reorderDayObj?.dia ?? ""}`
                  : "Días"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {reorderTab === "bloques" && reorderDay !== null && (
              (reorderDayObj?.bloques.length ?? 0) === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Este día no tiene bloques.
                </p>
              ) : (
                reorderDayObj?.bloques.map((block, blockIdx) => {
                  const Icon = TIPO_ICONS[block.tipo];
                  return (
                    <div
                      key={block.id}
                      className="flex items-center gap-3 px-2 py-2.5 border-b border-gray-100 last:border-b-0"
                    >
                      <Icon className="h-4 w-4 text-gray-400 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">
                        {block.titulo}
                      </span>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-25"
                        disabled={blockIdx === 0}
                        onClick={() => moveBlockInDay(reorderDay, blockIdx, -1)}
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-25"
                        disabled={blockIdx === (reorderDayObj?.bloques.length ?? 0) - 1}
                        onClick={() => moveBlockInDay(reorderDay, blockIdx, 1)}
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )
            )}

            {reorderTab === "dias" && (
              content.dias.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-2 py-2.5 border-b border-gray-100 last:border-b-0"
                >
                  <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">
                    <span className="font-medium">Día {day.dia}</span>
                    {!/^Día \d+$/.test(day.titulo) && (
                      <span className="text-muted-foreground"> · {day.titulo}</span>
                    )}
                    <span className="text-muted-foreground"> · {day.bloques.length} bloques</span>
                  </span>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-25"
                    disabled={idx === 0}
                    onClick={() => moveDay(idx, -1)}
                    aria-label="Subir día"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-25"
                    disabled={idx === content.dias.length - 1}
                    onClick={() => moveDay(idx, 1)}
                    aria-label="Bajar día"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sheet: Mover bloque a día ───────────────────────────────────────── */}
      <Sheet open={moveTarget !== null} onOpenChange={(open) => { if (!open) setMoveTarget(null); }}>
        <SheetContent side="bottom" className="rounded-t-[16px] p-0 flex flex-col border-0 h-[50vh]">
          <SheetTitle className="sr-only">Mover bloque a otro día</SheetTitle>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <p className="px-5 pt-1 pb-3 text-[15px] font-semibold text-foreground shrink-0">
            Mover a…
          </p>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {content.dias.map((day, idx) => {
              const isSource = moveTarget?.dayIdx === idx;
              const dateLabel = dayDateLabel(day, idx, tripStart);
              return (
                <button
                  key={idx}
                  disabled={isSource}
                  className={cn(
                    "w-full flex items-baseline gap-2 px-3 py-3 rounded-[10px] text-left transition-colors",
                    isSource ? "opacity-40" : "hover:bg-gray-50",
                  )}
                  onClick={() => moveTarget && moveBlockToDay(moveTarget.dayIdx, moveTarget.blockIdx, idx)}
                >
                  <span className="text-[14px] font-medium text-foreground">Día {day.dia}</span>
                  <span className="text-[12px] text-muted-foreground truncate">
                    {[dateLabel, `${day.bloques.length} bloques`, isSource ? "(actual)" : null]
                      .filter(Boolean).join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── AlertDialog: eliminar día con bloques ───────────────────────────── */}
      <AlertDialog
        open={deleteDayTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteDayTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este día?</AlertDialogTitle>
            <AlertDialogDescription>
              El Día {deleteDayTarget !== null ? deleteDayTarget + 1 : ""} tiene{" "}
              {deleteDayTarget !== null ? content.dias[deleteDayTarget]?.bloques.length ?? 0 : 0}{" "}
              bloque(s) que se eliminarán con él. Podrás deshacer inmediatamente después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={deleteDayConfirmed}
            >
              Eliminar día
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ItineraryBlockEditor;
