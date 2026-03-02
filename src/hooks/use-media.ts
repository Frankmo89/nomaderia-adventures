import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface MediaItem {
  id: string;
  media_type: "image" | "video";
  public_url: string;
  storage_path: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// media_slider was created after the last type generation.
// Widen the client type so `.from("media_slider")` compiles.
// Regenerate types to remove this cast:
//   npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
const db = supabase as unknown as ReturnType<typeof createClient>;

/**
 * Fetches active media_slider items ordered by display_order.
 * Used by the public MediaSlider component on the landing page.
 */
export function useMediaSlider() {
  return useQuery<MediaItem[]>({
    queryKey: ["media_slider"],
    queryFn: async () => {
      const { data, error } = await db
        .from("media_slider")
        .select("id, media_type, public_url, storage_path, display_order, is_active, created_at")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as MediaItem[]) ?? [];
    },
  });
}

/**
 * Upload a file to the media_gallery bucket and insert a record in media_slider.
 */
export async function uploadMediaItem(file: File): Promise<MediaItem> {
  const isVideo = file.type.startsWith("video/");
  const mediaType: "image" | "video" = isVideo ? "video" : "image";
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media_gallery")
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("media_gallery")
    .getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Get next display_order
  const { data: maxOrderData } = await db
    .from("media_slider")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (maxOrderData && maxOrderData.length > 0
    ? (maxOrderData[0] as { display_order: number }).display_order
    : 0) + 1;

  const { data, error: insertError } = await db
    .from("media_slider")
    .insert({
      media_type: mediaType,
      public_url: publicUrl,
      storage_path: storagePath,
      display_order: nextOrder,
      is_active: true,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  return data as MediaItem;
}

/**
 * Toggle is_active for a media_slider item.
 */
export async function toggleMediaActive(id: string, currentActive: boolean) {
  const { error } = await db
    .from("media_slider")
    .update({ is_active: !currentActive })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Delete a media_slider item and its file from storage.
 */
export async function deleteMediaItem(id: string, storagePath: string) {
  const { error: storageError } = await supabase.storage
    .from("media_gallery")
    .remove([storagePath]);
  if (storageError) throw storageError;

  const { error: dbError } = await db
    .from("media_slider")
    .delete()
    .eq("id", id);
  if (dbError) throw dbError;
}
