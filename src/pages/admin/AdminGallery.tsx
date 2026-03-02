import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Image, Film } from "lucide-react";
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

// media_slider not yet in generated types — widen the client
const db = supabase as unknown as ReturnType<typeof createClient>;

const AdminGallery = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Galería Multimedia</h1>
        <div>
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          No hay archivos. Sube el primero con el botón de arriba.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border overflow-hidden bg-card">
              <div className="relative aspect-video bg-muted">
                {item.media_type === "video" ? (
                  <video
                    src={item.public_url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    onMouseEnter={(e) => {
                      const video = e.currentTarget as HTMLVideoElement;
                      if (video.readyState >= 2) {
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(() => {
                            // Ignore play errors (e.g. autoplay restrictions)
                          });
                        }
                      }
                    }}
                    onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                  />
                ) : (
                  <img src={item.public_url} alt="" className="w-full h-full object-cover" />
                )}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 gap-1"
                >
                  {item.media_type === "video" ? <Film className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                  {item.media_type === "video" ? "Video" : "Imagen"}
                </Badge>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggle(item.id, item.is_active)}
                    aria-label={item.is_active ? "Activo" : "Inactivo"}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
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
                        onClick={() => handleDelete(item.id, item.storage_path)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
