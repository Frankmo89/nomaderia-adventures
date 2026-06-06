import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { VerifyFieldBadge } from "@/components/admin/VerifyFieldBadge";
import { AIDraftProgressOverlay } from "@/components/admin/AIDraftProgressOverlay";
import { AIDraftSourcesPanel } from "@/components/admin/AIDraftSourcesPanel";
import { supabase } from "@/integrations/supabase/client";
import { useDestinationDraft } from "@/hooks/use-destination-draft";
import { useToast } from "@/hooks/use-toast";
import type { GenerateDraftResponse } from "@/types/ai-destinations";
import ImageUpload from "@/components/dashboard/ImageUpload";
import MultiMediaUpload from "@/components/dashboard/MultiMediaUpload";

interface Fear { miedo: string; respuesta: string; }

interface CandidateParams {
  title: string;
  country: string;
  suggested_slug?: string;
}

const emptyForm = {
  title: "", slug: "", country: "", region: "", short_description: "",
  base_city: "", access_type: "", cell_signal_status: "",
  difficulty_level: "easy", difficulty_description: "", days_needed: "",
  best_season: "", estimated_budget_usd: "", hero_image_url: "",
  experience_type: "", tags: "", is_published: false, featured: false,
  full_guide_markdown: "", preparation_plan: "", itinerary_markdown: "",
  gear_list_markdown: "", permit_alert_url: "", flights_url: "", hotels_url: "", insurance_url: "",
  tours_url: "", tickets_url: "", car_rental_url: "", transfer_url: "",
};

type FormState = typeof emptyForm;

const trackedConfidenceFields = [
  "region",
  "base_city",
  "access_type",
  "cell_signal_status",
  "short_description",
  "difficulty_level",
  "difficulty_description",
  "days_needed",
  "best_season",
  "estimated_budget_usd",
  "preparation_plan",
  "gear_list_markdown",
  "itinerary_markdown",
  "full_guide_markdown",
  "experience_type",
  "tags",
] as const;

const stagedDraftStatuses = [
  "Buscando fuentes oficiales…",
  "Redactando con la voz de Nomaderia…",
  "Verificando datos…",
];

const fieldLabel = (label: string, shouldVerify: boolean) => (
  <div className="flex items-center gap-2 mb-2">
    <Label className="text-card-foreground">{label}</Label>
    {shouldVerify && <VerifyFieldBadge />}
  </div>
);

// --- Sub-components ---

const field = (label: string, input: ReactNode, shouldVerify = false) => (
  <div>{fieldLabel(label, shouldVerify)}{input}</div>
);

const inputCls = "bg-background border-border text-foreground";

const GeneralFields = ({ form, set, galleryImages, onGalleryChange, verifyFlags }: {
  form: FormState;
  set: (k: string, v: string | boolean) => void;
  galleryImages: string[];
  onGalleryChange: (imgs: string[]) => void;
  verifyFlags: string[];
}) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Información General</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("Título *", <Input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} required />, verifyFlags.includes("title"))}
        {field("Slug *", <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} required />, verifyFlags.includes("slug"))}
        {field("País *", <Input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} required />, verifyFlags.includes("country"))}
        {field("Región", <Input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />, verifyFlags.includes("region"))}
        {field("Ciudad Base / Aeropuerto", <Input value={form.base_city} onChange={(e) => set("base_city", e.target.value)} className={inputCls} />, verifyFlags.includes("base_city"))}
        {field("Tipo de Acceso / Permisos", <Input value={form.access_type} onChange={(e) => set("access_type", e.target.value)} className={inputCls} />, verifyFlags.includes("access_type"))}
        {field("Cobertura Celular", <Input value={form.cell_signal_status} onChange={(e) => set("cell_signal_status", e.target.value)} className={inputCls} />, verifyFlags.includes("cell_signal_status"))}
        <div>
          {fieldLabel("Dificultad", verifyFlags.includes("difficulty_level"))}
          <Select value={form.difficulty_level} onValueChange={(v) => set("difficulty_level", v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="moderate">Moderado</SelectItem>
              <SelectItem value="challenging">Desafiante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {field("Días necesarios", <Input value={form.days_needed} onChange={(e) => set("days_needed", e.target.value)} className={inputCls} />, verifyFlags.includes("days_needed"))}
        {field("Presupuesto (USD)", <Input type="number" value={form.estimated_budget_usd} onChange={(e) => set("estimated_budget_usd", e.target.value)} className={inputCls} />, verifyFlags.includes("estimated_budget_usd"))}
        {field("Mejor Temporada", <Input value={form.best_season} onChange={(e) => set("best_season", e.target.value)} className={inputCls} />, verifyFlags.includes("best_season"))}
        {field("Tipo de experiencia", <Input value={form.experience_type} onChange={(e) => set("experience_type", e.target.value)} className={inputCls} />, verifyFlags.includes("experience_type"))}
        {field("Tags (separados por coma)", <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="parque nacional, trail escénico, principiantes" />, verifyFlags.includes("tags"))}
      </div>
      {field("Descripción Corta", <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls} />, verifyFlags.includes("short_description"))}
      {field("Descripción de Dificultad", <Textarea value={form.difficulty_description} onChange={(e) => set("difficulty_description", e.target.value)} className={inputCls} />, verifyFlags.includes("difficulty_description"))}
      <ImageUpload bucket="destinations" currentUrl={form.hero_image_url} onUploadComplete={(url) => set("hero_image_url", url)} />
      <MultiMediaUpload currentUrls={galleryImages} onChange={onGalleryChange} />
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} /><Label className="text-card-foreground">Publicado</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} /><Label className="text-card-foreground">Destacado</Label></div>
      </div>
    </CardContent>
  </Card>
);

const FaqFields = ({ fears, onAdd, onRemove, onUpdate, verifyFlags }: {
  fears: Fear[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, key: keyof Fear, val: string) => void;
  verifyFlags: string[];
}) => (
  <Card className="bg-card border-border">
    <CardHeader>
      <CardTitle className="text-card-foreground flex items-center gap-2">
        Miedos Comunes (FAQ)
        {verifyFlags.includes("common_fears") && <VerifyFieldBadge />}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {fears.map((f, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <Input placeholder="Pregunta" value={f.miedo} onChange={(e) => onUpdate(i, "miedo", e.target.value)} className={inputCls} />
            <Textarea placeholder="Respuesta" value={f.respuesta} onChange={(e) => onUpdate(i, "respuesta", e.target.value)} className={inputCls} />
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar pregunta ${i + 1}`} title={`Eliminar pregunta ${i + 1}`} onClick={() => onRemove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="border-border text-foreground"><Plus className="h-4 w-4 mr-1" /> Agregar Pregunta</Button>
    </CardContent>
  </Card>
);

const MarkdownFields = ({ form, set, verifyFlags }: { form: FormState; set: (k: string, v: string | boolean) => void; verifyFlags: string[] }) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Contenido Markdown</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {field("Preparación Física", <Textarea rows={8} value={form.preparation_plan} onChange={(e) => set("preparation_plan", e.target.value)} className={`${inputCls} font-mono text-sm`} />, verifyFlags.includes("preparation_plan"))}
      {field("Itinerario", <Textarea rows={8} value={form.itinerary_markdown} onChange={(e) => set("itinerary_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />, verifyFlags.includes("itinerary_markdown"))}
      {field("Qué Llevar", <Textarea rows={8} value={form.gear_list_markdown} onChange={(e) => set("gear_list_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />, verifyFlags.includes("gear_list_markdown"))}
      {field("Guía Completa", <Textarea rows={8} value={form.full_guide_markdown} onChange={(e) => set("full_guide_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />, verifyFlags.includes("full_guide_markdown"))}
    </CardContent>
  </Card>
);

const AffiliateFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Affiliate Links</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {field("URL Alerta de Permisos (Stripe)", <Input value={form.permit_alert_url} onChange={(e) => set("permit_alert_url", e.target.value)} className={inputCls} placeholder="https://buy.stripe.com/..." />)}
          <p className="text-xs text-muted-foreground mt-1">Solo para parques con permisos difíciles (Yosemite, Grand Canyon)</p>
        </div>
        {field("URL Vuelos", <Input value={form.flights_url} onChange={(e) => set("flights_url", e.target.value)} className={inputCls} placeholder="https://..." />)}
        {field("URL Hoteles", <Input value={form.hotels_url} onChange={(e) => set("hotels_url", e.target.value)} className={inputCls} placeholder="https://..." />)}
        {field("Tours y Actividades URL (Klook)", <Input value={form.tours_url} onChange={(e) => set("tours_url", e.target.value)} className={inputCls} placeholder="https://www.klook.com/..." />)}
        {field("Entradas y Atracciones URL (Tiqets)", <Input value={form.tickets_url} onChange={(e) => set("tickets_url", e.target.value)} className={inputCls} placeholder="https://www.tiqets.com/..." />)}
        {field("Renta de Auto URL (Localrent)", <Input value={form.car_rental_url} onChange={(e) => set("car_rental_url", e.target.value)} className={inputCls} placeholder="https://localrent.com/..." />)}
        {field("Transfer Aeropuerto URL (Welcome Pickups)", <Input value={form.transfer_url} onChange={(e) => set("transfer_url", e.target.value)} className={inputCls} placeholder="https://www.welcomepickups.com/..." />)}
        {field("URL Seguro de Viaje", <Input value={form.insurance_url} onChange={(e) => set("insurance_url", e.target.value)} className={inputCls} placeholder="https://..." />)}
      </div>
    </CardContent>
  </Card>
);

// --- Main component ---

const AdminDestinationForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [fears, setFears] = useState<Fear[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiDraftResponse, setAiDraftResponse] = useState<GenerateDraftResponse | null>(null);
  const [draftProgressIndex, setDraftProgressIndex] = useState(0);
  const [draftErrorMessage, setDraftErrorMessage] = useState<string | null>(null);
  const draftAutofillStartedRef = useRef(false);
  const draftAutofillCanceledRef = useRef(false);
  const {
    mutate: generateDraft,
    isPending: draftPending,
    reset: resetDraft,
  } = useDestinationDraft();

  const candidateParams = useMemo<CandidateParams | null>(() => {
    const candidate = searchParams.get("candidate");

    if (candidate) {
      try {
        const parsed = JSON.parse(candidate) as CandidateParams;
        if (parsed.title && parsed.country) return parsed;
      } catch {
        try {
          const parsed = JSON.parse(decodeURIComponent(candidate)) as CandidateParams;
          if (parsed.title && parsed.country) return parsed;
        } catch {
          return null;
        }
      }
    }

    const title = searchParams.get("title");
    const country = searchParams.get("country");
    const suggested_slug = searchParams.get("suggested_slug") || undefined;

    if (title && country) {
      return { title, country, suggested_slug };
    }

    return null;
  }, [searchParams]);

  const verifyFlags = aiDraftResponse?.verify_flags || [];
  const confidenceCount = useMemo(() => {
    return trackedConfidenceFields.filter((fieldName) => {
      if (verifyFlags.includes(fieldName)) return false;

      const value = form[fieldName];
      if (typeof value === "boolean") return value;
      if (typeof value === "string") return value.trim().length > 0;
      return false;
    }).length;
  }, [form, verifyFlags]);
  const confidenceHigh = confidenceCount / trackedConfidenceFields.length >= 0.75;

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      const aff = (data.affiliate_links as Record<string, string>) || {};
      setForm({
        title: data.title, slug: data.slug, country: data.country, region: data.region || "",
        base_city: data.base_city || "", access_type: data.access_type || "", cell_signal_status: data.cell_signal_status || "",
        short_description: data.short_description || "", difficulty_level: data.difficulty_level,
        difficulty_description: data.difficulty_description || "", days_needed: data.days_needed || "",
        best_season: data.best_season || "", estimated_budget_usd: String(data.estimated_budget_usd || ""),
        hero_image_url: data.hero_image_url || "", experience_type: data.experience_type || "",
        tags: (data.tags || []).join(", "),
        is_published: data.is_published || false, featured: data.featured || false,
        full_guide_markdown: data.full_guide_markdown || "", preparation_plan: data.preparation_plan || "",
        itinerary_markdown: data.itinerary_markdown || "", gear_list_markdown: data.gear_list_markdown || "",
        flights_url: aff.flights_url || "", hotels_url: aff.hotels_url || "", insurance_url: aff.insurance_url || "",
        tours_url: aff.tours_url || "", tickets_url: aff.tickets_url || "",
        car_rental_url: aff.car_rental_url || "", transfer_url: aff.transfer_url || "",
        permit_alert_url: aff.permit_alert_url || "",
      });
      setFears((data.common_fears as unknown as Fear[]) || []);
      setGalleryImages((data.gallery_images as string[]) || []);
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
          country: response.draft.country,
          region: response.draft.region || "",
          base_city: response.draft.base_city || "",
          access_type: response.draft.access_type || "",
          cell_signal_status: response.draft.cell_signal_status || "",
          short_description: response.draft.short_description,
          difficulty_level: response.draft.difficulty_level,
          difficulty_description: response.draft.difficulty_description || "",
          days_needed: response.draft.days_needed || "",
          best_season: response.draft.best_season || "",
          estimated_budget_usd: response.draft.estimated_budget_usd != null ? String(response.draft.estimated_budget_usd) : "",
          preparation_plan: response.draft.preparation_plan,
          gear_list_markdown: response.draft.gear_list_markdown,
          itinerary_markdown: response.draft.itinerary_markdown,
          full_guide_markdown: response.draft.full_guide_markdown,
          experience_type: response.draft.experience_type || "",
          tags: response.draft.tags.join(", "),
        }));
        setFears(response.draft.common_fears.map((fear) => ({
          miedo: fear.miedo,
          respuesta: fear.respuesta,
        })));
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
        .from("destinations")
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
      description: "Puedes seguir editando el destino manualmente.",
    });
  };

  const handleSubmit = async (e: FormEvent) => {
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

    const normalizedTags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title: form.title, slug: resolvedSlug, country: form.country, region: form.region || null,
      base_city: form.base_city || null, access_type: form.access_type || null, cell_signal_status: form.cell_signal_status || null,
      short_description: form.short_description || null, difficulty_level: form.difficulty_level,
      difficulty_description: form.difficulty_description || null, days_needed: form.days_needed || null,
      best_season: form.best_season || null, estimated_budget_usd: form.estimated_budget_usd ? Number(form.estimated_budget_usd) : null,
      hero_image_url: form.hero_image_url || null, experience_type: form.experience_type || null,
      tags: normalizedTags.length ? normalizedTags : null,
      is_published: form.is_published, featured: form.featured,
      full_guide_markdown: form.full_guide_markdown || null, preparation_plan: form.preparation_plan || null,
      itinerary_markdown: form.itinerary_markdown || null, gear_list_markdown: form.gear_list_markdown || null,
      common_fears: JSON.parse(JSON.stringify(fears)),
      gallery_images: galleryImages,
      affiliate_links: JSON.parse(JSON.stringify({
        permit_alert_url: form.permit_alert_url,
        flights_url: form.flights_url, hotels_url: form.hotels_url, insurance_url: form.insurance_url,
        tours_url: form.tours_url, tickets_url: form.tickets_url,
        car_rental_url: form.car_rental_url, transfer_url: form.transfer_url,
      })),
    };

    const result = isEdit
      ? await supabase.from("destinations").update(payload).eq("id", id)
      : await supabase.from("destinations").insert(payload).select("id").single();

    setSaving(false);
    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    if (!isEdit && aiDraftResponse && "data" in result && result.data?.id) {
      const aiMetaClient = supabase as unknown as SupabaseClient;
      const { error: aiMetaError } = await aiMetaClient
        .from("destination_ai_meta")
        .upsert(
          {
            destination_id: result.data.id,
            sources: aiDraftResponse.sources,
            verify_flags: aiDraftResponse.verify_flags,
            model: aiDraftResponse.model,
          },
          { onConflict: "destination_id" }
        );

      if (aiMetaError) {
        console.error("[AdminDestinationForm] destination_ai_meta save failed:", aiMetaError);
        toast({
          title: "Destino guardado con advertencia",
          description: "Se guardó el destino, pero no pudimos guardar las fuentes privadas de IA.",
        });
      }
    }

    navigate("/admin/destinations");
  };

  return (
    <div className="max-w-3xl">
      <AIDraftProgressOverlay
        open={draftPending}
        message={stagedDraftStatuses[draftProgressIndex]}
        onCancel={handleCancelAutoFill}
      />

      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-3xl text-foreground">{isEdit ? "Editar Destino" : "Nuevo Destino"}</h1>
        {aiDraftResponse && !isEdit && (
          <Badge className={confidenceHigh ? "bg-secondary text-secondary-foreground" : "bg-primary/15 text-primary border border-primary/20"}>
            Confianza: {confidenceCount} de {trackedConfidenceFields.length} campos verificados con fuente
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <GeneralFields
          form={form}
          set={set}
          galleryImages={galleryImages}
          onGalleryChange={setGalleryImages}
          verifyFlags={verifyFlags}
        />
        <FaqFields
          fears={fears}
          onAdd={() => setFears([...fears, { miedo: "", respuesta: "" }])}
          onRemove={(i) => setFears(fears.filter((_, idx) => idx !== i))}
          onUpdate={(i, key, val) => setFears(fears.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))}
          verifyFlags={verifyFlags}
        />
        <MarkdownFields form={form} set={set} verifyFlags={verifyFlags} />
        <AffiliateFields form={form} set={set} />
        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Destino"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/destinations")} className="border-border text-foreground">Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminDestinationForm;
