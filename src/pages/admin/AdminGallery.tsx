import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Image, Film, GripVertical, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type MediaItem,
  uploadMediaItem,
  toggleMediaActive,
  deleteMediaItem,
} from "@/hooks/use-media";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// media_slider not yet in generated types — widen the client
const db = supabase as unknown as ReturnType<typeof createClient>;

// ── Sortable card ─────────────────────────────────────────────────────────────

interface SortableCardProps {
  item: MediaItem;
  index: number;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string, storagePath: string) => void;
}

const SortableCard = ({ item, index, onToggle, onDelete }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border overflow-hidden bg-card",
        isDragging ? "opacity-30 border-primary/50" : "border-border",
      )}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {item.media_type === "video" ? (
          <video
            src={item.public_url}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onMouseEnter={(e) => {
              const v = e.currentTarget as HTMLVideoElement;
              if (v.readyState >= 2) v.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const v = e.currentTarget as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
        ) : (
          <img src={item.public_url} alt="" loading="lazy" className="w-full h-full object-cover" />
        )}

        <Badge variant="secondary" className="absolute top-2 left-2 gap-1">
          {item.media_type === "video" ? <Film className="h-3 w-3" /> : <Image className="h-3 w-3" />}
          {item.media_type === "video" ? "Video" : "Imagen"}
        </Badge>

        <span className="absolute bottom-2 left-2 text-[11px] font-medium bg-black/55 text-white px-1.5 py-0.5 rounded leading-none">
          #{index + 1}
        </span>

        {/* Drag handle — listeners/attributes spread here, not on the card */}
        <button
          type="button"
          className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white cursor-grab active:cursor-grabbing hover:bg-black/70 transition-colors touch-none select-none"
          title="Arrastrar para reordenar"
          aria-label="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 pointer-events-none" />
        </button>
      </div>

      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={item.is_active}
            onCheckedChange={() => onToggle(item.id, item.is_active)}
            aria-label={item.is_active ? "Activo" : "Inactivo"}
          />
          <span className="text-sm text-muted-foreground">
            {item.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Eliminar archivo" title="Eliminar archivo">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente del almacenamiento y de la galería.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(item.id, item.storage_path)}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdminGallery = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const load = async () => {
    const { data, error } = await db
      .from("media_slider")
      .select("id, media_type, public_url, storage_path, display_order, is_active, created_at")
      .order("display_order", { ascending: true });
    if (error) {
      toast({ title: "Error al cargar", description: error.message, variant: "destructive" });
    }
    setItems((data as MediaItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Upload / toggle / delete (untouched logic) ──────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadMediaItem(file);
      toast({ title: "Archivo subido correctamente" });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al subir", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleMediaActive(id, currentActive);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_active: !currentActive } : i));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    try {
      await deleteMediaItem(id, storagePath);
      toast({ title: "Archivo eliminado" });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast({ title: "Error al eliminar", description: msg, variant: "destructive" });
    }
  };

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const snapshot = items; // keep for rollback

    // Optimistic: assign sequential display_order starting at 1
    setItems(reordered.map((item, idx) => ({ ...item, display_order: idx + 1 })));

    // Only persist rows whose display_order actually changed
    const updates = reordered
      .map((item, idx) => ({ id: item.id, newOrder: idx + 1, oldOrder: item.display_order }))
      .filter((u) => u.newOrder !== u.oldOrder);

    try {
      await Promise.all(
        updates.map(async (u) => {
          const { error } = await db
            .from("media_slider")
            .update({ display_order: u.newOrder })
            .eq("id", u.id);
          if (error) throw new Error(error.message);
        }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el orden.";
      setItems(snapshot);
      toast({ title: "Error al reordenar", description: msg, variant: "destructive" });
    }
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const gridClass = viewMode === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    : "flex flex-col gap-4";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Galería Multimedia</h1>
          {!loading && items.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              {items.length} archivo{items.length !== 1 ? "s" : ""}
              <span className="text-muted-foreground/60 mx-1">·</span>
              <GripVertical className="h-3.5 w-3.5" />
              arrastra el ícono para reordenar
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / list toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              title="Vista cuadrícula"
              aria-label="Vista cuadrícula"
              className={cn(
                "h-8 w-8 rounded-none border-r border-border",
                viewMode === "grid" && "bg-primary/10 text-primary",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              title="Vista lista"
              aria-label="Vista lista"
              className={cn(
                "h-8 w-8 rounded-none",
                viewMode === "list" && "bg-primary/10 text-primary",
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Subiendo…" : "Subir archivo"}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          No hay archivos. Sube el primero con el botón de arriba.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className={gridClass}>
              {items.map((item, idx) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  index={idx}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag overlay — shown while dragging, follows cursor */}
          <DragOverlay>
            {activeItem ? (
              <div className="rounded-lg border border-primary/60 overflow-hidden bg-card shadow-2xl rotate-1 scale-[1.03]">
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {activeItem.media_type === "video" ? (
                    <video src={activeItem.public_url} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={activeItem.public_url} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default AdminGallery;
