import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIDraftProgressOverlay } from "@/components/admin/AIDraftProgressOverlay";
import { AIDraftSourcesPanel } from "@/components/admin/AIDraftSourcesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useBlogDraft } from "@/hooks/use-blog-draft";
import { useToast } from "@/hooks/use-toast";
import type { GenerateBlogResponse } from "@/types/ai-blog";
import ImageUpload from "@/components/dashboard/ImageUpload";

const blogCategories = [
  "Noticias",
  "Trending Hikes",
  "Historias",
  "Preparación",
  "Errores",
  "Inspiración",
  "Consejos",
  "Listas",
];

interface CandidateParams {
  title: string;
  category?: string;
  suggested_slug?: string;
}

const stagedDraftStatuses = [
  "Investigando fuentes para el tema…",
  "Redactando borrador SEO con voz Nomaderia…",
  "Validando campos para revisión editorial…",
];

const trackedConfidenceFields = [
  "title",
  "slug",
  "category",
  "short_description",
  "meta_description",
  "tags",
  "content_markdown",
] as const;

const META_DESCRIPTION_MAX = 160;

const computeReadingTimeMin = (contentMarkdown: string): string => {
  const wordCount = contentMarkdown
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return String(Math.max(1, Math.ceil(wordCount / 200)));
};

const AdminBlogPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Preparación",
    short_description: "",
    content_markdown: "",
    hero_image_url: "",
    author: "Nomaderia",
    is_published: false,
    featured: false,
    reading_time_min: "5",
    meta_description: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiDraftResponse, setAiDraftResponse] = useState<GenerateBlogResponse | null>(null);
  const [draftProgressIndex, setDraftProgressIndex] = useState(0);
  const [draftErrorMessage, setDraftErrorMessage] = useState<string | null>(null);
  const draftAutofillStartedRef = useRef(false);
  const draftAutofillCanceledRef = useRef(false);
  const {
    mutate: generateDraft,
    isPending: draftPending,
    reset: resetDraft,
  } = useBlogDraft();

  const candidateParams = useMemo<CandidateParams | null>(() => {
    const candidate = searchParams.get("candidate");

    if (candidate) {
      try {
        const parsed = JSON.parse(candidate) as CandidateParams;
        if (parsed.title) return parsed;
      } catch {
        try {
          const parsed = JSON.parse(decodeURIComponent(candidate)) as CandidateParams;
          if (parsed.title) return parsed;
        } catch {
          return null;
        }
      }
    }

    const title = searchParams.get("title");
    const category = searchParams.get("category") || undefined;
    const suggested_slug = searchParams.get("suggested_slug") || undefined;

    if (title) {
      return { title, category, suggested_slug };
    }

    return null;
  }, [searchParams]);

  const verifyFlags = aiDraftResponse?.verify_flags || [];
  const metaDescriptionLength = form.meta_description.length;
  const metaDescriptionRemaining = META_DESCRIPTION_MAX - metaDescriptionLength;
  const metaDescriptionExceeded = metaDescriptionRemaining < 0;
  const confidenceCount = useMemo(() => {
    return trackedConfidenceFields.filter((fieldName) => {
      if (verifyFlags.includes(fieldName)) return false;

      if (fieldName === "tags") {
        return tags.length > 0;
      }

      const value = form[fieldName];
      return value.trim().length > 0;
    }).length;
  }, [form, tags, verifyFlags]);
  const confidenceHigh = confidenceCount / trackedConfidenceFields.length >= 0.75;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          category: data.category || "Preparación",
          short_description: data.short_description || "",
          content_markdown: data.content_markdown || "",
          hero_image_url: data.hero_image_url || "",
          author: data.author || "Nomaderia",
          is_published: data.is_published || false,
          featured: data.featured || false,
          reading_time_min: String(data.reading_time_min || "5"),
          meta_description: data.meta_description || "",
        });
        setTags(data.tags || []);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!draftPending) {
      setDraftProgressIndex(0);
      return;
    }

    // Progreso por etapas en cliente; no representa streaming real del backend.
    const intervalId = window.setInterval(() => {
      setDraftProgressIndex((prev) => (prev + 1) % stagedDraftStatuses.length);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [draftPending]);

  useEffect(() => {
    if (isEdit || !candidateParams || draftAutofillStartedRef.current) return;

    draftAutofillStartedRef.current = true;
    draftAutofillCanceledRef.current = false;
    setDraftErrorMessage(null);
    resetDraft();

    generateDraft(candidateParams, {
      onSuccess: (response) => {
        if (draftAutofillCanceledRef.current) return;

        setAiDraftResponse(response);
        setForm((prev) => ({
          ...prev,
          title: response.draft.title,
          slug: response.draft.slug,
          category: response.draft.category,
          short_description: response.draft.short_description,
          meta_description: response.draft.meta_description,
          content_markdown: response.draft.content_markdown,
          reading_time_min: computeReadingTimeMin(response.draft.content_markdown),
        }));
        setTags(response.draft.tags);
      },
      onError: (error) => {
        if (draftAutofillCanceledRef.current) return;
        setDraftErrorMessage(error.message || "No pudimos generar el borrador IA.");
      },
    });
  }, [candidateParams, generateDraft, isEdit, resetDraft]);

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    const normalizedBase = baseSlug.trim();
    if (!normalizedBase) return normalizedBase;

    let candidateSlug = normalizedBase;
    let suffix = 2;

    while (true) {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", candidateSlug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return candidateSlug;

      candidateSlug = `${normalizedBase}-${suffix}`;
      suffix += 1;
    }
  };

  const handleCancelAutoFill = () => {
    draftAutofillCanceledRef.current = true;
    resetDraft();
    toast({
      title: "Autocompletado detenido",
      description: "Puedes seguir editando el post manualmente.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDraftErrorMessage(null);

    if (metaDescriptionExceeded) {
      setSaving(false);
      toast({
        title: "Meta descripción demasiado larga",
        description: `La meta descripción debe tener máximo ${META_DESCRIPTION_MAX} caracteres.`,
        variant: "destructive",
      });
      return;
    }

    let resolvedSlug = form.slug;

    if (!isEdit) {
      try {
        resolvedSlug = await ensureUniqueSlug(form.slug);
        if (resolvedSlug !== form.slug) {
          setForm((prev) => ({ ...prev, slug: resolvedSlug }));
          toast({
            title: "Slug ajustado automáticamente",
            description: `El slug ya existía. Se guardará como ${resolvedSlug}.`,
          });
        }
      } catch (slugError) {
        setSaving(false);
        const message = slugError instanceof Error ? slugError.message : "No pudimos validar el slug.";
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }
    }

    const payload = {
      title: form.title,
      slug: resolvedSlug,
      category: form.category,
      short_description: form.short_description || null,
      content_markdown: form.content_markdown || null,
      hero_image_url: form.hero_image_url || null,
      author: form.author || null,
      is_published: form.is_published,
      featured: form.featured,
      reading_time_min: form.reading_time_min ? Number(form.reading_time_min) : null,
      meta_description: form.meta_description || null,
      tags,
    };

    if (isEdit) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id!);
      setSaving(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const result = await supabase.from("blog_posts").insert(payload).select("id").single();
      setSaving(false);
      if (result.error) { toast({ title: "Error", description: result.error.message, variant: "destructive" }); return; }

      if (aiDraftResponse && result.data?.id) {
        const { error: aiMetaError } = await supabase
          .from("ai_content_meta")
          .upsert(
            {
              content_type: "blog",
              content_id: result.data.id,
              sources: aiDraftResponse.sources,
              verify_flags: aiDraftResponse.verify_flags,
              model: aiDraftResponse.model,
            },
            { onConflict: "content_type,content_id" },
          );

        if (aiMetaError) {
          console.error("[AdminBlogPostForm] ai_content_meta save failed:", aiMetaError);
          toast({
            title: "Post guardado con advertencia",
            description: "Se guardó el post, pero no pudimos guardar las fuentes privadas de IA.",
          });
        }
      }
    }

    toast({ title: isEdit ? "Post actualizado" : "Post creado" });
    navigate("/admin/blog-posts");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <AIDraftProgressOverlay
        open={draftPending}
        message={stagedDraftStatuses[draftProgressIndex]}
        onCancel={handleCancelAutoFill}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-3xl text-foreground">{isEdit ? "Editar Post" : "Nuevo Post"}</h1>
        {aiDraftResponse && !isEdit && (
          <Badge className={confidenceHigh ? "bg-secondary text-secondary-foreground" : "bg-primary/15 text-primary border border-primary/20"}>
            Confianza: {confidenceCount} de {trackedConfidenceFields.length} campos verificados con fuente
          </Badge>
        )}
      </div>

      {draftErrorMessage && !draftPending && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive font-medium">{draftErrorMessage}</p>
        </div>
      )}

      {aiDraftResponse && !isEdit && <AIDraftSourcesPanel sources={aiDraftResponse.sources} />}

      {!!verifyFlags.length && !isEdit && (
        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="text-sm font-medium text-card-foreground mb-2">Campos por verificar</p>
          <div className="flex flex-wrap gap-2">
            {verifyFlags.map((flag) => (
              <span key={flag} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                ⚠ Verificar: {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground">Título</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Slug</Label>
        <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Categoría</Label>
        <Select value={form.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {blogCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Autor</Label>
        <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Tiempo de lectura (min)</Label>
        <Input type="number" value={form.reading_time_min} onChange={(e) => set("reading_time_min", e.target.value)} min={1} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Imagen principal</Label>
        <ImageUpload
          bucket="blog-posts"
          currentUrl={form.hero_image_url}
          onUploadComplete={(url) => set("hero_image_url", url)}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Descripción corta</Label>
        <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Meta descripción (SEO)</Label>
        <Textarea
          value={form.meta_description}
          onChange={(e) => set("meta_description", e.target.value)}
          rows={2}
          maxLength={META_DESCRIPTION_MAX}
          placeholder="Descripción optimizada para Google (máx 160 caracteres)"
        />
        <p className={`text-xs ${metaDescriptionExceeded ? "text-destructive" : "text-muted-foreground"}`}>
          {metaDescriptionLength}/{META_DESCRIPTION_MAX}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Tags (uno por línea)</Label>
        <Textarea
          value={tags.join("\n")}
          onChange={(e) => setTags(e.target.value.split("\n").filter((t) => t.trim()))}
          rows={3}
          className="font-mono text-sm"
          placeholder={"hiking\nmexico\nprincipiantes"}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Contenido (markdown)</Label>
        <Textarea value={form.content_markdown} onChange={(e) => set("content_markdown", e.target.value)} rows={12} className="font-mono text-sm" />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
          <Label className="text-foreground">Publicado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          <Label className="text-foreground">Destacado</Label>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isEdit ? "Guardar" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/blog-posts")}>Cancelar</Button>
      </div>
    </form>
  );
};

export default AdminBlogPostForm;
