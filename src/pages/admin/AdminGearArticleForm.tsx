import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { AIDraftProgressOverlay } from "@/components/admin/AIDraftProgressOverlay";
import { AIDraftSourcesPanel } from "@/components/admin/AIDraftSourcesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useGearDraft } from "@/hooks/use-gear-draft";
import { useToast } from "@/hooks/use-toast";
import type { GenerateGearResponse } from "@/types/ai-gear";

interface Product { name: string; price: string; rating: number; pros: string[]; cons: string[]; affiliate_url: string; }
interface CandidateParams { title: string; category: string; suggested_slug?: string; destination_id?: string; }

const emptyProduct = (): Product => ({ name: "", price: "", rating: 5, pros: [""], cons: [""], affiliate_url: "" });

const stagedDraftStatuses = [
  "Buscando fuentes confiables…",
  "Redactando con la voz de Nomaderia…",
  "Organizando productos y verificación…",
];

const AdminGearArticleForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", slug: "", category: "", short_description: "", content_markdown: "", is_published: false, featured: false });
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiDraftResponse, setAiDraftResponse] = useState<GenerateGearResponse | null>(null);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [draftProgressIndex, setDraftProgressIndex] = useState(0);
  const [draftErrorMessage, setDraftErrorMessage] = useState<string | null>(null);
  const draftAutofillStartedRef = useRef(false);
  const draftAutofillCanceledRef = useRef(false);
  const { mutate: generateDraft, isPending: draftPending, reset: resetDraft } = useGearDraft();

  const candidateParams = useMemo<CandidateParams | null>(() => {
    const candidate = searchParams.get("candidate");

    if (candidate) {
      try {
        const parsed = JSON.parse(candidate) as CandidateParams;
        if (parsed.title && parsed.category) return parsed;
      } catch {
        try {
          const parsed = JSON.parse(decodeURIComponent(candidate)) as CandidateParams;
          if (parsed.title && parsed.category) return parsed;
        } catch {
          return null;
        }
      }
    }

    const title = searchParams.get("title");
    const category = searchParams.get("category");
    const suggested_slug = searchParams.get("suggested_slug") || undefined;
    const destination_id = searchParams.get("destination_id") || undefined;

    if (title && category) {
      return { title, category, suggested_slug, destination_id };
    }

    return null;
  }, [searchParams]);

  const verifyFlags = aiDraftResponse?.verify_flags || [];
  const forcedVerifyFlags = useMemo(() => {
    const flags = new Set<string>(verifyFlags);
    flags.add("price");
    if (products.some((product) => product.rating > 0)) {
      flags.add("rating");
    }
    return Array.from(flags);
  }, [products, verifyFlags]);

  const confidenceTotal = useMemo(() => {
    return 5 + products.length;
  }, [products.length]);

  const confidenceCount = useMemo(() => {
    let count = 0;

    if (form.title.trim().length > 0 && !verifyFlags.includes("title")) count += 1;
    if (form.slug.trim().length > 0 && !verifyFlags.includes("slug")) count += 1;
    if (form.category.trim().length > 0 && !verifyFlags.includes("category")) count += 1;
    if (form.short_description.trim().length > 0 && !verifyFlags.includes("short_description")) count += 1;
    if (form.content_markdown.trim().length > 0 && !verifyFlags.includes("content_markdown")) count += 1;

    products.forEach((product, index) => {
      const hasName = product.name.trim().length > 0;
      const productFlag = `products.${index}`;
      if (hasName && !verifyFlags.includes(productFlag) && !verifyFlags.includes("products")) {
        count += 1;
      }
    });

    return count;
  }, [form, products, verifyFlags]);

  const confidenceHigh = confidenceTotal > 0 && confidenceCount / confidenceTotal >= 0.75;

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await supabase.from("gear_articles").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      setForm({
        title: data.title, slug: data.slug, category: data.category,
        short_description: data.short_description || "", content_markdown: data.content_markdown || "",
        is_published: data.is_published || false, featured: data.featured || false,
      });
      setProducts((data.products as unknown as Product[]) || []);
    };
    load();
  }, [id, isEdit]);

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
          content_markdown: response.draft.content_markdown,
        }));

        setProducts(response.draft.products.map((product) => ({
          name: product.name,
          price: product.price || "",
          rating: typeof product.rating === "number" ? product.rating : 0,
          pros: product.pros.length ? product.pros : [""],
          cons: product.cons.length ? product.cons : [""],
          affiliate_url: "",
        })));
        setTitleOptions(response.draft.title_options ?? []);
      },
      onError: (error) => {
        if (draftAutofillCanceledRef.current) return;
        setDraftErrorMessage(error.message || "No pudimos generar el borrador IA.");
      },
    });
  }, [candidateParams, generateDraft, isEdit, resetDraft]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    const normalizedBase = baseSlug.trim();
    if (!normalizedBase) return normalizedBase;

    let candidateSlug = normalizedBase;
    let suffix = 2;

    while (true) {
      const { data, error } = await supabase
        .from("gear_articles")
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
      description: "Puedes seguir editando el artículo manualmente.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDraftErrorMessage(null);

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

    const payload = { ...form, slug: resolvedSlug, products: JSON.parse(JSON.stringify(products)), short_description: form.short_description || null, content_markdown: form.content_markdown || null };
    const result = isEdit
      ? await supabase.from("gear_articles").update(payload).eq("id", id)
      : await supabase.from("gear_articles").insert(payload).select("id").single();

    setSaving(false);
    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    if (!isEdit && aiDraftResponse && "data" in result && result.data?.id) {
      // ai_content_meta.rag_meta was added after the last type generation
      // (migration 20260726000000). Same bridge-cast pattern as ADR-009 /
      // use-media.ts — remove once types.ts is regenerated.
      const { error: aiMetaError } = await (supabase as unknown as SupabaseClient)
        .from("ai_content_meta")
        .upsert(
          {
            content_type: "gear",
            content_id: result.data.id,
            sources: aiDraftResponse.sources,
            verify_flags: aiDraftResponse.verify_flags,
            model: aiDraftResponse.model,
            rag_meta: aiDraftResponse.rag_meta,
          },
          { onConflict: "content_type,content_id" },
        );

      if (aiMetaError) {
        console.error("[AdminGearArticleForm] ai_content_meta save failed:", aiMetaError);
        toast({
          title: "Artículo guardado con advertencia",
          description: "Se guardó el artículo, pero no pudimos guardar las fuentes privadas de IA.",
        });
      }
    }

    navigate("/admin/gear-articles");
  };

  const addProduct = () => setProducts([...products, emptyProduct()]);
  const removeProduct = (i: number) => setProducts(products.filter((_, idx) => idx !== i));
  const updateProduct = <K extends keyof Product>(i: number, key: K, val: Product[K]) =>
    setProducts(products.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));

  const hasRatingSet = (product: Product) => product.rating > 0;

  return (
    <div className="max-w-3xl">
      <AIDraftProgressOverlay
        open={draftPending}
        message={stagedDraftStatuses[draftProgressIndex]}
        onCancel={handleCancelAutoFill}
      />

      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-3xl text-foreground">{isEdit ? "Editar Artículo" : "Nuevo Artículo"}</h1>
        {aiDraftResponse && !isEdit && (
          <Badge className={confidenceHigh ? "bg-secondary text-secondary-foreground" : "bg-primary/15 text-primary border border-primary/20"}>
            Confianza: {confidenceCount} de {confidenceTotal} campos verificados con fuente
          </Badge>
        )}
      </div>

      {draftErrorMessage && !draftPending && (
        <Card className="bg-card border-border mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive font-medium">{draftErrorMessage}</p>
          </CardContent>
        </Card>
      )}

      {aiDraftResponse && !isEdit && <AIDraftSourcesPanel sources={aiDraftResponse.sources} />}

      {!!forcedVerifyFlags.length && !isEdit && (
        <Card className="bg-card border-border mt-6">
          <CardHeader>
            <CardTitle className="text-card-foreground">Campos por verificar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {forcedVerifyFlags.map((flag) => (
              <span key={flag} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                ⚠ Verificar: {flag}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Información</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-card-foreground">Título *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-background border-border text-foreground" required />
                {!isEdit && titleOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {titleOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => set("title", option)}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                          form.title === option
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div><Label className="text-card-foreground">Slug *</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">Categoría *</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} className="bg-background border-border text-foreground" required /></div>
            </div>
            <div><Label className="text-card-foreground">Descripción Corta</Label><Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div><Label className="text-card-foreground">Contenido (Markdown)</Label><Textarea rows={12} value={form.content_markdown} onChange={(e) => set("content_markdown", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} /><Label className="text-card-foreground">Publicado</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} /><Label className="text-card-foreground">Destacado</Label></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Productos Recomendados</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {products.map((p, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-card-foreground">Producto {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar producto ${i + 1}`} title={`Eliminar producto ${i + 1}`} onClick={() => removeProduct(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Nombre" value={p.name} onChange={(e) => updateProduct(i, "name", e.target.value)} className="bg-background border-border text-foreground" />
                  <div>
                    <div className="mb-1">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                        ⚠ Verificar
                      </span>
                    </div>
                    <Input placeholder="Precio" value={p.price} onChange={(e) => updateProduct(i, "price", e.target.value)} className="bg-background border-border text-foreground" />
                  </div>
                  <div>
                    {hasRatingSet(p) && (
                      <div className="mb-1">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                          ⚠ Verificar
                        </span>
                      </div>
                    )}
                    <Input type="number" placeholder="Rating (0-5)" min={0} max={5} value={p.rating} onChange={(e) => updateProduct(i, "rating", Number(e.target.value))} className="bg-background border-border text-foreground" />
                  </div>
                </div>
                <Input placeholder="URL Afiliado" value={p.affiliate_url} onChange={(e) => updateProduct(i, "affiliate_url", e.target.value)} className="bg-background border-border text-foreground" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-card-foreground text-xs">Pros (uno por línea)</Label>
                    <Textarea value={p.pros.join("\n")} onChange={(e) => updateProduct(i, "pros", e.target.value.split("\n"))} className="bg-background border-border text-foreground text-sm" rows={3} />
                  </div>
                  <div>
                    <Label className="text-card-foreground text-xs">Contras (uno por línea)</Label>
                    <Textarea value={p.cons.join("\n")} onChange={(e) => updateProduct(i, "cons", e.target.value.split("\n"))} className="bg-background border-border text-foreground text-sm" rows={3} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addProduct} className="border-border text-foreground">
              <Plus className="h-4 w-4 mr-1" /> Agregar Producto
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Artículo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/gear-articles")} className="border-border text-foreground">Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminGearArticleForm;
