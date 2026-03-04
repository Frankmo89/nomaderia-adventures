import { useState, useRef } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const BUCKET = "destinations_media";

const isVideo = (url: string) =>
  /\.(mp4|webm|mov)(\?|$)/i.test(url);

interface MultiMediaUploadProps {
  currentUrls: string[];
  onChange: (urls: string[]) => void;
}

const MultiMediaUpload = ({ currentUrls, onChange }: MultiMediaUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: `"${file.name}" no es un formato soportado.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: "Archivo muy grande",
          description: `"${file.name}" supera el límite de 50 MB.`,
          variant: "destructive",
        });
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { cacheControl: "3600", upsert: false, contentType: file.type });

      if (error) {
        toast({
          title: "Error al subir",
          description: `${file.name}: ${error.message}`,
          variant: "destructive",
        });
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      newUrls.push(publicUrlData.publicUrl);
    }

    if (newUrls.length > 0) {
      onChange([...currentUrls, ...newUrls]);
      toast({ title: `${newUrls.length} archivo(s) subido(s)` });
    }

    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
  };

  const handleRemove = async (index: number) => {
    const url = currentUrls[index];
    // Only attempt storage deletion for URLs from our Supabase bucket
    try {
      const parsed = new URL(url);
      const supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
      if (parsed.hostname === supabaseHost) {
        const path = parsed.pathname.split(`/${BUCKET}/`)[1];
        if (path) {
          const { error } = await supabase.storage.from(BUCKET).remove([path]);
          if (error) {
            toast({
              title: "Error al eliminar archivo",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
        }
      }
    } catch {
      // Ignore errors for malformed or external URLs
    }
    onChange(currentUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label className="text-card-foreground">Galería de Fotos y Videos</Label>

      {currentUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {currentUrls.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group rounded-lg overflow-hidden border border-border">
              {isVideo(url) ? (
                <video
                  src={url}
                  muted
                  playsInline
                  preload="none"
                  className="w-full h-32 object-cover"
                  onMouseEnter={(e) =>
                    (e.currentTarget as HTMLVideoElement).play().catch(() => {})
                  }
                  onMouseOut={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                  onFocus={(e) =>
                    (e.currentTarget as HTMLVideoElement).play().catch(() => {})
                  }
                  onBlur={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                  }}
                  tabIndex={0}
                />
              ) : (
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-32 object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                aria-label="Eliminar elemento"
                onClick={() => handleRemove(i)}
              >
                <X className="h-3 w-3" />
              </Button>
              {isVideo(url) && (
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  VIDEO
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          onChange={handleFiles}
          disabled={uploading}
          className="bg-background border-border text-foreground max-w-sm"
        />
        {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground">
        Formatos: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV · Máximo 50 MB por archivo · El primer elemento se usa como principal del carrusel.
      </p>
    </div>
  );
};

export default MultiMediaUpload;
