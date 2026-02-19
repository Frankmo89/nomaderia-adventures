import { useState, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  bucket: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
}

const ImageUpload = ({ bucket, currentUrl, onUploadComplete }: ImageUploadProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl || currentUrl || null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten imágenes WebP, JPG o PNG.",
        variant: "destructive",
      });
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo es 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast({
        title: "Error al subir imagen",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    setPreviewUrl(publicUrl);
    onUploadComplete(publicUrl);
    toast({ title: "Imagen subida correctamente" });
    setUploading(false);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label className="text-card-foreground">Imagen Principal</Label>

      {displayUrl && (
        <div className="relative w-full max-w-sm">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          type="file"
          accept=".webp,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={uploading}
          className="bg-background border-border text-foreground max-w-sm"
        />
        {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground">
        Formatos: WebP, JPG, PNG · Máximo 2MB · Recomendado: 800×500px en WebP
      </p>
    </div>
  );
};

export default ImageUpload;
