import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, ArrowUpDown, Plus, ChevronDown, ChevronRight,
  GripVertical, Check, AlertCircle,
  Route, UtensilsCrossed, Tent, Car, TriangleAlert, Ticket, DollarSign, StickyNote,
} from "lucide-react";
import {
  DndContext, DragOverlay, closestCenter,
  useSensor, useSensors, PointerSensor, TouchSensor,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Exported domain types ────────────────────────────────────────────────────

export type BlockTipo =
  | "ruta" | "comida" | "alojamiento" | "traslado"
  | "tip_seguridad" | "permiso" | "costo" | "nota";

export interface BlockExtra {
  distancia_km?: number | null;
  desnivel_m?: number | null;
  apto_principiante?: boolean;
  duracion?: string | null;
  modo?: "auto" | "shuttle" | "caminar" | null;
}

export interface ItBlock {
  id: string;
  tipo: BlockTipo;
  titulo: string;
  contenido_md: string | null;
  horario: string | null;
  precio_usd: number | null;
  precio_nota: string | null;
  fuente_url: string | null;
  afiliado_url: string | null;
  verify_flag: string | null;
  extra?: BlockExtra | null;
}

export interface ItDay {
  dia: number;
  titulo: string;
  bloques: ItBlock[];
}

export interface ContentV1 {
  version: 1;
  parque?: string;
  hero_image_url?: string;
  dias: ItDay[];
}

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

const TIPO_ORDER: BlockTipo[] = [
  "ruta", "comida", "alojamiento", "traslado",
  "tip_seguridad", "permiso", "costo", "nota",
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const blockFormSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  contenido_md: z.string().optional(),
  horario: z.string().optional(),
  precio_usd: z.string().optional(),
  precio_nota: z.string().optional(),
  fuente_url: z.string().optional(),
  afiliado_url: z.string().optional(),
  verify_flag_on: z.boolean(),
  distancia_km: z.string().optional(),
  desnivel_m: z.string().optional(),
  apto_principiante: z.boolean(),
  duracion: z.string().optional(),
  modo: z.string().optional(),
});

type BlockFormValues = z.infer<typeof blockFormSchema>;

// ─── Block row meta helper ─────────────────────────────────────────────────────

function getBlockMeta(block: ItBlock): string {
  const parts: string[] = [];
  if (block.tipo === "ruta") {
    if (block.extra?.distancia_km != null) parts.push(`${block.extra.distancia_km} km`);
    if (block.extra?.apto_principiante) parts.push("principiante");
  } else if (block.tipo === "traslado" || block.tipo === "comida") {
    if (block.horario) parts.push(block.horario);
  }
  if (block.verify_flag) parts.push("⚠ verificar");
  return parts.join(" · ");
}

// ─── Sortable block row ────────────────────────────────────────────────────────

interface BlockRowProps {
  block: ItBlock;
  reorderMode: boolean;
  onTap: () => void;
}

function SortableBlockRow({ block, reorderMode, onTap }: BlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const Icon = TIPO_ICONS[block.tipo];
  const isTip = block.tipo === "tip_seguridad";
  const meta = getBlockMeta(block);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0",
        isTip ? "bg-[#FEF3C7]" : "bg-white",
      )}
    >
      {reorderMode && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-gray-400 shrink-0"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      <Icon
        className={cn("h-[17px] w-[17px] shrink-0", isTip ? "text-[#854F0B]" : "text-gray-400")}
        strokeWidth={1.8}
      />

      <button
        className="flex-1 min-w-0 text-left disabled:opacity-100"
        onClick={!reorderMode ? onTap : undefined}
        disabled={reorderMode}
      >
        <p className={cn("text-[13px] font-medium truncate", isTip ? "text-[#633806]" : "text-foreground")}>
          {block.titulo}
        </p>
        {meta && (
          <p className={cn("text-[11px] mt-0.5 truncate", isTip ? "text-[#854F0B]/70" : "text-muted-foreground")}>
            {TIPO_LABELS[block.tipo]} · {meta}
          </p>
        )}
      </button>

      {!reorderMode && (
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ItineraryBlockEditorProps {
  content: ContentV1;
  title: string;
  subtitle: string;
  backHref: string;
  onSave: (c: ContentV1) => Promise<void>;
}

// ─── Main component ───────────────────────────────────────────────────────────

const ItineraryBlockEditor = ({
  content: initialContent,
  title,
  subtitle,
  backHref,
  onSave,
}: ItineraryBlockEditorProps) => {
  const { toast } = useToast();

  // Content state
  const [content, setContent] = useState<ContentV1>(initialContent);
  const contentRef = useRef<ContentV1>(initialContent);
  useEffect(() => { contentRef.current = content; }, [content]);

  // UI
  const [expandedDay, setExpandedDay] = useState<number | null>(
    initialContent.dias.length > 0 ? 0 : null,
  );
  const [reorderMode, setReorderMode] = useState(false);

  // Sheet
  const [sheetPhase, setSheetPhase] = useState<null | "select" | "edit">(null);
  const [sheetDayIdx, setSheetDayIdx] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<ItBlock | null>(null);
  const [editingBlockIdx, setEditingBlockIdx] = useState<number | null>(null);
  const [pendingTipo, setPendingTipo] = useState<BlockTipo | null>(null);

  // Save indicator
  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [secondsSinceSave, setSecondsSinceSave] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUndoRef = useRef<{ block: ItBlock; dayIdx: number; blockIdx: number } | null>(null);

  // dnd-kit
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // RHF
  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      titulo: "", contenido_md: "", horario: "", precio_usd: "",
      precio_nota: "", fuente_url: "", afiliado_url: "", verify_flag_on: false,
      distancia_km: "", desnivel_m: "", apto_principiante: false, duracion: "", modo: "",
    },
  });

  const currentTipo: BlockTipo = pendingTipo ?? editingBlock?.tipo ?? "nota";

  // ── Save ticker ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!savedAt) return;
    const interval = setInterval(() => {
      setSecondsSinceSave(Math.floor((Date.now() - savedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [savedAt]);

  // ── Autosave (debounced 1.5s) ─────────────────────────────────────────────────

  const triggerSave = useCallback((newContent: ContentV1) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("pending");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(newContent);
        setSavedAt(new Date());
        setSecondsSinceSave(0);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
        toast({ title: "Error al guardar", description: "Verifica tu conexión.", variant: "destructive" });
      }
    }, 1500);
  }, [onSave, toast]);

  const applyContent = useCallback((newContent: ContentV1) => {
    setContent(newContent);
    triggerSave(newContent);
  }, [triggerSave]);

  // ── Day management ────────────────────────────────────────────────────────────

  const addDay = useCallback(() => {
    const current = contentRef.current;
    const nextNum = current.dias.length + 1;
    const newContent: ContentV1 = {
      ...current,
      dias: [...current.dias, { dia: nextNum, titulo: `Día ${nextNum}`, bloques: [] }],
    };
    setContent(newContent);
    setExpandedDay(current.dias.length);
    triggerSave(newContent);
  }, [triggerSave]);

  // ── Sheet helpers ─────────────────────────────────────────────────────────────

  const closeSheet = useCallback(() => {
    setSheetPhase(null);
    setSheetDayIdx(null);
    setEditingBlock(null);
    setEditingBlockIdx(null);
    setPendingTipo(null);
    form.reset();
  }, [form]);

  const openAddSheet = useCallback((dayIdx: number) => {
    setSheetDayIdx(dayIdx);
    setEditingBlock(null);
    setEditingBlockIdx(null);
    setPendingTipo(null);
    setSheetPhase("select");
  }, []);

  const openEditSheet = useCallback((dayIdx: number, blockIdx: number, block: ItBlock) => {
    setSheetDayIdx(dayIdx);
    setEditingBlock(block);
    setEditingBlockIdx(blockIdx);
    setPendingTipo(null);
    form.reset({
      titulo: block.titulo,
      contenido_md: block.contenido_md ?? "",
      horario: block.horario ?? "",
      precio_usd: block.precio_usd != null ? String(block.precio_usd) : "",
      precio_nota: block.precio_nota ?? "",
      fuente_url: block.fuente_url ?? "",
      afiliado_url: block.afiliado_url ?? "",
      verify_flag_on: block.verify_flag !== null,
      distancia_km: block.extra?.distancia_km != null ? String(block.extra.distancia_km) : "",
      desnivel_m: block.extra?.desnivel_m != null ? String(block.extra.desnivel_m) : "",
      apto_principiante: block.extra?.apto_principiante ?? false,
      duracion: block.extra?.duracion ?? "",
      modo: block.extra?.modo ?? "",
    });
    setSheetPhase("edit");
  }, [form]);

  const handleTypeSelect = useCallback((tipo: BlockTipo) => {
    setPendingTipo(tipo);
    form.reset({
      titulo: "", contenido_md: "", horario: "", precio_usd: "", precio_nota: "",
      fuente_url: "", afiliado_url: "", verify_flag_on: false,
      distancia_km: "", desnivel_m: "", apto_principiante: false, duracion: "", modo: "",
    });
    setSheetPhase("edit");
  }, [form]);

  // ── Undo ──────────────────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const undo = pendingUndoRef.current;
    if (!undo) return;
    pendingUndoRef.current = null;

    const current = contentRef.current;
    const newDias = current.dias.map((d, i) => {
      if (i !== undo.dayIdx) return d;
      const newBloques = [...d.bloques];
      newBloques.splice(undo.blockIdx, 0, undo.block);
      return { ...d, bloques: newBloques };
    });
    const restored: ContentV1 = { ...current, dias: newDias };
    setContent(restored);
    triggerSave(restored);
  }, [triggerSave]);

  // ── Block CRUD ────────────────────────────────────────────────────────────────

  const handleBlockFormSave = useCallback((values: BlockFormValues) => {
    if (sheetDayIdx === null) return;
    const tipo = pendingTipo ?? editingBlock?.tipo;
    if (!tipo) return;

    const today = new Date().toISOString().slice(0, 10);

    const MODO_VALUES = ["auto", "shuttle", "caminar"] as const;
    type ModoVal = typeof MODO_VALUES[number];
    const isModo = (v: string): v is ModoVal =>
      (MODO_VALUES as readonly string[]).includes(v);

    const extra: BlockExtra | null =
      tipo === "ruta"
        ? {
            distancia_km: values.distancia_km ? Number(values.distancia_km) : null,
            desnivel_m: values.desnivel_m ? Number(values.desnivel_m) : null,
            apto_principiante: values.apto_principiante,
          }
        : tipo === "traslado"
        ? {
            duracion: values.duracion || null,
            modo: values.modo && isModo(values.modo) ? values.modo : null,
          }
        : null;

    const block: ItBlock = {
      id: editingBlock?.id ?? crypto.randomUUID(),
      tipo,
      titulo: values.titulo,
      contenido_md: values.contenido_md || null,
      horario: values.horario || null,
      precio_usd: values.precio_usd ? Number(values.precio_usd) : null,
      precio_nota: values.precio_nota || null,
      fuente_url: values.fuente_url || null,
      afiliado_url: values.afiliado_url || null,
      verify_flag: values.verify_flag_on ? `⚠️ VERIFICAR (IA) [${today}]` : null,
      extra,
    };

    const current = contentRef.current;
    const newContent: ContentV1 = {
      ...current,
      dias: current.dias.map((d, i) => {
        if (i !== sheetDayIdx) return d;
        const bloques =
          editingBlockIdx !== null
            ? d.bloques.map((b, j) => (j === editingBlockIdx ? block : b))
            : [...d.bloques, block];
        return { ...d, bloques };
      }),
    };
    applyContent(newContent);
    closeSheet();
  }, [sheetDayIdx, pendingTipo, editingBlock, editingBlockIdx, applyContent, closeSheet]);

  const handleDeleteBlock = useCallback((dayIdx: number, blockIdx: number) => {
    const current = contentRef.current;
    const block = current.dias[dayIdx]?.bloques[blockIdx];
    if (!block) return;

    pendingUndoRef.current = { block, dayIdx, blockIdx };

    const newContent: ContentV1 = {
      ...current,
      dias: current.dias.map((d, i) => {
        if (i !== dayIdx) return d;
        return { ...d, bloques: d.bloques.filter((_, j) => j !== blockIdx) };
      }),
    };
    setContent(newContent);
    triggerSave(newContent);
    closeSheet();

    toast({
      title: "Bloque eliminado",
      action: (
        <ToastAction altText="Deshacer" onClick={handleUndo}>
          Deshacer
        </ToastAction>
      ),
    });
  }, [triggerSave, closeSheet, toast, handleUndo]);

  // ── Drag handlers ─────────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveBlockId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveBlockId(null);
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const current = contentRef.current;

    const activeDayIdx = current.dias.findIndex(d => d.bloques.some(b => b.id === activeId));
    const overDayIdx = current.dias.findIndex(d => d.bloques.some(b => b.id === overId));
    if (activeDayIdx !== overDayIdx || activeDayIdx === -1) return;

    const activeIdx = current.dias[activeDayIdx].bloques.findIndex(b => b.id === activeId);
    const overIdx = current.dias[activeDayIdx].bloques.findIndex(b => b.id === overId);

    const newContent: ContentV1 = {
      ...current,
      dias: current.dias.map((d, i) => {
        if (i !== activeDayIdx) return d;
        return { ...d, bloques: arrayMove(d.bloques, activeIdx, overIdx) };
      }),
    };
    setContent(newContent);
    triggerSave(newContent);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const activeBlock = activeBlockId
    ? content.dias.flatMap(d => d.bloques).find(b => b.id === activeBlockId) ?? null
    : null;

  const saveLabel =
    saveStatus === "error" ? "Error al guardar" :
    saveStatus === "pending" ? "Guardando..." :
    saveStatus === "saved" ? `Guardado hace ${secondsSinceSave}s` :
    "Sin cambios";

  const sheetDay = sheetDayIdx !== null ? content.dias[sheetDayIdx] : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-[#FAFAFA] pb-32">

        {/* Admin header bar */}
        <div className="bg-sidebar text-sidebar-foreground sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-sidebar-border">
          <Link
            to={backHref}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex-1 min-w-0">
            {reorderMode ? (
              <p className="text-[15px] font-semibold text-sidebar-foreground">Reordenar bloques</p>
            ) : (
              <>
                <p className="font-serif text-[17px] font-semibold text-sidebar-foreground truncate leading-tight">
                  {title || "Itinerario"}
                </p>
                <p className="text-[11px] text-sidebar-foreground/50 mt-0.5">{subtitle}</p>
              </>
            )}
          </div>

          {reorderMode ? (
            <button
              className="text-[14px] font-medium text-primary shrink-0 px-2 py-1"
              onClick={() => setReorderMode(false)}
            >
              Listo
            </button>
          ) : (
            <button
              className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0 transition-colors"
              onClick={() => setReorderMode(true)}
              title="Reordenar bloques"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Day cards */}
        <div className="px-4 pt-4 space-y-3">
          {content.dias.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              Sin días todavía. Toca "+ Añadir día" para empezar.
            </p>
          )}

          {content.dias.map((day, dayIdx) => {
            const isExpanded = expandedDay === dayIdx;
            return (
              <div
                key={day.dia}
                className="bg-white rounded-[12px] overflow-hidden"
                style={{ border: "0.5px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <button
                  className="w-full flex items-center gap-2 px-4 py-3.5 text-left hover:bg-gray-50/70 transition-colors"
                  onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                >
                  <span className="font-serif text-[17px] font-semibold text-foreground leading-none">
                    Día {day.dia}
                  </span>
                  <span className="text-[13px] text-muted-foreground leading-none">
                    · {day.bloques.length} {day.bloques.length === 1 ? "bloque" : "bloques"}
                  </span>
                  <span className="flex-1" />

                  {!reorderMode && (
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-[#166534]/10 text-gray-400 hover:text-[#166534] transition-colors shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(dayIdx);
                        openAddSheet(dayIdx);
                      }}
                      title="Añadir bloque a este día"
                    >
                      <Plus className="h-[15px] w-[15px]" />
                    </button>
                  )}

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {day.bloques.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground text-center py-5">
                        Sin bloques. Toca + para añadir.
                      </p>
                    ) : (
                      <SortableContext
                        items={day.bloques.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {day.bloques.map((block, blockIdx) => (
                          <SortableBlockRow
                            key={block.id}
                            block={block}
                            reorderMode={reorderMode}
                            onTap={() => openEditSheet(dayIdx, blockIdx, block)}
                          />
                        ))}
                      </SortableContext>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            className="w-full py-3 text-[15px] font-medium text-[#166534] hover:text-[#166534]/70 transition-colors"
            onClick={addDay}
          >
            + Añadir día
          </button>
        </div>

        {/* FAB */}
        {!reorderMode && (
          <button
            className="fixed bottom-16 right-5 h-[52px] w-[52px] rounded-full bg-[#D97706] shadow-lg shadow-amber-700/25 flex items-center justify-center text-white hover:bg-[#B45309] active:scale-95 transition-all z-20"
            onClick={() => {
              if (content.dias.length === 0) { addDay(); return; }
              const target = expandedDay !== null ? expandedDay : 0;
              setExpandedDay(target);
              openAddSheet(target);
            }}
            title="Añadir bloque"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Footer save bar */}
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-10 h-12 flex items-center gap-2 px-5 border-t text-[12px]",
            saveStatus === "error"
              ? "bg-red-950 text-red-300 border-red-800"
              : "bg-sidebar text-sidebar-foreground/50 border-sidebar-border",
          )}
        >
          {saveStatus === "error"
            ? <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            : <Check className="h-3.5 w-3.5 shrink-0" />
          }
          <span>{saveLabel}</span>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBlock && (() => {
          const Icon = TIPO_ICONS[activeBlock.tipo];
          return (
            <div className="bg-white rounded-lg border border-primary/40 shadow-xl px-4 py-3 flex items-center gap-3 rotate-1 opacity-95">
              <Icon className="h-[17px] w-[17px] text-gray-400 shrink-0" strokeWidth={1.8} />
              <span className="text-[13px] font-medium text-foreground truncate">
                {activeBlock.titulo}
              </span>
            </div>
          );
        })()}
      </DragOverlay>

      {/* Bottom sheet */}
      <Sheet open={sheetPhase !== null} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent
          side="bottom"
          className={cn(
            "rounded-t-[16px] p-0 flex flex-col border-0",
            sheetPhase === "edit" ? "h-[95vh] overflow-hidden" : "h-[56vh] overflow-hidden",
          )}
        >
          <SheetTitle className="sr-only">
            {sheetPhase === "select"
              ? `Añadir bloque al Día ${sheetDay?.dia ?? ""}`
              : "Editar bloque"}
          </SheetTitle>

          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>

          {/* Phase 1: type selector */}
          {sheetPhase === "select" && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <p className="px-5 pt-1 pb-3 text-[15px] font-semibold text-foreground shrink-0">
                Añadir bloque al Día {sheetDay?.dia ?? ""}
              </p>
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-6">
                {TIPO_ORDER.map((tipo) => {
                  const Icon = TIPO_ICONS[tipo];
                  const isTip = tipo === "tip_seguridad";
                  const isGreen = tipo === "ruta";
                  const isAmber = tipo === "comida" || tipo === "permiso";
                  return (
                    <button
                      key={tipo}
                      onClick={() => handleTypeSelect(tipo)}
                      className={cn(
                        "flex flex-col items-center gap-2.5 py-4 px-3 rounded-[12px] border transition-colors",
                        isTip
                          ? "bg-[#FEF3C7] border-[#FAC775] hover:bg-[#FDE68A]"
                          : "bg-white border-gray-200/70 hover:bg-gray-50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isGreen && "text-[#166534]",
                          isAmber && "text-[#D97706]",
                          isTip && "text-[#B45309]",
                          !isGreen && !isAmber && !isTip && "text-gray-500",
                        )}
                        strokeWidth={1.8}
                      />
                      <span className={cn(
                        "text-[13px] font-medium text-center leading-tight",
                        isTip ? "text-[#854F0B]" : "text-foreground",
                      )}>
                        {TIPO_LABELS[tipo]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phase 2: block edit form */}
          {sheetPhase === "edit" && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleBlockFormSave)}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>

                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const Icon = TIPO_ICONS[currentTipo];
                      return <Icon className="h-[15px] w-[15px] text-gray-500" strokeWidth={1.8} />;
                    })()}
                    <span className="text-[14px] font-medium text-foreground">
                      {TIPO_LABELS[currentTipo]}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="text-[14px] text-[#D97706] hover:text-[#B45309] transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Guardar
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Título
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Título del bloque" {...field} />
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
                        <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Descripción
                        </FormLabel>
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
                          <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Horario
                          </FormLabel>
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
                          <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Precio USD
                          </FormLabel>
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
                        <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Nota de precio
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: por persona · sujeto a cambios" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {currentTipo === "ruta" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="distancia_km"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Distancia km
                              </FormLabel>
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
                              <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Desnivel m
                              </FormLabel>
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

                  {currentTipo === "traslado" && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="duracion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Duración
                            </FormLabel>
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
                            <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Modo
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Modo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="shuttle">Shuttle</SelectItem>
                                <SelectItem value="caminar">Caminar</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="fuente_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Fuente oficial
                        </FormLabel>
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
                        <FormLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Link de afiliado{" "}
                          <span className="normal-case">(opcional)</span>
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

                  {editingBlock && (
                    <div className="pt-2 pb-6">
                      <button
                        type="button"
                        className="w-full text-[14px] text-red-500 hover:text-red-600 py-2 transition-colors"
                        onClick={() => {
                          if (sheetDayIdx !== null && editingBlockIdx !== null) {
                            handleDeleteBlock(sheetDayIdx, editingBlockIdx);
                          }
                        }}
                      >
                        Eliminar bloque
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          )}
        </SheetContent>
      </Sheet>
    </DndContext>
  );
};

export default ItineraryBlockEditor;
