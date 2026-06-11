import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ItineraryBlockEditor, { type ContentV1 } from "@/components/admin/ItineraryBlockEditor";

const AdminItineraryTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [templateTitle, setTemplateTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [content, setContent] = useState<ContentV1 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("itinerary_templates")
        .select("title, is_published, content")
        .eq("id", id)
        .single();

      if (error || !data) { setLoading(false); return; }

      setTemplateTitle(data.title);
      setIsPublished(data.is_published);

      const raw = data.content as unknown as ContentV1;
      const c: ContentV1 =
        raw?.version === 1 && Array.isArray(raw.dias) ? raw : { version: 1, dias: [] };
      setContent(c);
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async (newContent: ContentV1) => {
    const { error } = await supabase
      .from("itinerary_templates")
      .update({ content: JSON.parse(JSON.stringify(newContent)) })
      .eq("id", id!);
    if (error) throw error;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Plantilla no encontrada.
      </div>
    );
  }

  return (
    <ItineraryBlockEditor
      key={id}
      content={content}
      title={templateTitle || "Plantilla"}
      subtitle={`Plantilla · ${isPublished ? "publicada" : "borrador"}`}
      backHref="/admin/itinerary-templates"
      onSave={handleSave}
    />
  );
};

export default AdminItineraryTemplateEditor;
