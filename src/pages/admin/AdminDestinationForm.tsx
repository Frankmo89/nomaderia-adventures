import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/dashboard/ImageUpload";

interface Fear { question: string; answer: string; }
type FormState = typeof emptyForm;

const emptyForm = {
  title: "", slug: "", country: "", region: "", short_description: "",
  difficulty_level: "easy", difficulty_description: "", days_needed: "",
  best_season: "", estimated_budget_usd: "", hero_image_url: "",
  experience_type: "", is_published: false, featured: false,
  full_guide_markdown: "", preparation_plan: "", itinerary_markdown: "",
  gear_list_markdown: "", flights_url: "", hotels_url: "", insurance_url: "",
  tours_url: "", tickets_url: "", car_rental_url: "", transfer_url: "",
};

// --- Sub-components ---

const field = (label: string, input: React.ReactNode) => (
  <div><Label className="text-card-foreground">{label}</Label>{input}</div>
);

const inputCls = "bg-background border-border text-foreground";

const GeneralFields = ({ form, set, galleryImages, onGalleryChange }: {
  form: FormState;
  set: (k: string, v: string | boolean) => void;
  galleryImages: string[];
  onGalleryChange: (imgs: string[]) => void;
}) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Información General</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("Título *", <Input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} required />)}
        {field("Slug *", <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} required />)}
        {field("País *", <Input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} required />)}
        {field("Región", <Input value={form.region} onChange={(e) => set("region", e.target.value)} className={inputCls} />)}
        <div>
          <Label className="text-card-foreground">Dificultad</Label>
          <Select value={form.difficulty_level} onValueChange={(v) => set("difficulty_level", v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="moderate">Moderado</SelectItem>
              <SelectItem value="challenging">Desafiante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {field("Días necesarios", <Input value={form.days_needed} onChange={(e) => set("days_needed", e.target.value)} className={inputCls} />)}
        {field("Presupuesto (USD)", <Input type="number" value={form.estimated_budget_usd} onChange={(e) => set("estimated_budget_usd", e.target.value)} className={inputCls} />)}
        {field("Mejor Temporada", <Input value={form.best_season} onChange={(e) => set("best_season", e.target.value)} className={inputCls} />)}
      </div>
      {field("Descripción Corta", <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls} />)}
      {field("Descripción de Dificultad", <Textarea value={form.difficulty_description} onChange={(e) => set("difficulty_description", e.target.value)} className={inputCls} />)}
      <ImageUpload bucket="destinations" currentUrl={form.hero_image_url} onUploadComplete={(url) => set("hero_image_url", url)} />
      <div>
        <Label className="text-card-foreground">Galería de Imágenes (una URL por línea)</Label>
        <Textarea
          rows={5}
          value={galleryImages.join("\n")}
          onChange={(e) => onGalleryChange(e.target.value.split("\n").filter((url) => url.trim()))}
          className={`${inputCls} font-mono text-sm`}
          placeholder={`https://images.unsplash.com/photo-1?w=1200&q=80\nhttps://images.unsplash.com/photo-2?w=1200&q=80\nhttps://images.unsplash.com/photo-3?w=1200&q=80`}
        />
        <p className="text-xs text-muted-foreground mt-1">La primera imagen se usa como principal del carrusel. Usa ?w=1200&q=80 en URLs de Unsplash.</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} /><Label className="text-card-foreground">Publicado</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} /><Label className="text-card-foreground">Destacado</Label></div>
      </div>
    </CardContent>
  </Card>
);

const FaqFields = ({ fears, onAdd, onRemove, onUpdate }: {
  fears: Fear[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, key: keyof Fear, val: string) => void;
}) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Miedos Comunes (FAQ)</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {fears.map((f, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <Input placeholder="Pregunta" value={f.question} onChange={(e) => onUpdate(i, "question", e.target.value)} className={inputCls} />
            <Textarea placeholder="Respuesta" value={f.answer} onChange={(e) => onUpdate(i, "answer", e.target.value)} className={inputCls} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd} className="border-border text-foreground"><Plus className="h-4 w-4 mr-1" /> Agregar Pregunta</Button>
    </CardContent>
  </Card>
);

const MarkdownFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Contenido Markdown</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {field("Preparación Física", <Textarea rows={8} value={form.preparation_plan} onChange={(e) => set("preparation_plan", e.target.value)} className={`${inputCls} font-mono text-sm`} />)}
      {field("Itinerario", <Textarea rows={8} value={form.itinerary_markdown} onChange={(e) => set("itinerary_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />)}
      {field("Qué Llevar", <Textarea rows={8} value={form.gear_list_markdown} onChange={(e) => set("gear_list_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />)}
      {field("Guía Completa", <Textarea rows={8} value={form.full_guide_markdown} onChange={(e) => set("full_guide_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />)}
    </CardContent>
  </Card>
);

const AffiliateFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <Card className="bg-card border-border">
    <CardHeader><CardTitle className="text-card-foreground">Affiliate Links</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [fears, setFears] = useState<Fear[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      const aff = (data.affiliate_links as Record<string, string>) || {};
      setForm({
        title: data.title, slug: data.slug, country: data.country, region: data.region || "",
        short_description: data.short_description || "", difficulty_level: data.difficulty_level,
        difficulty_description: data.difficulty_description || "", days_needed: data.days_needed || "",
        best_season: data.best_season || "", estimated_budget_usd: String(data.estimated_budget_usd || ""),
        hero_image_url: data.hero_image_url || "", experience_type: data.experience_type || "",
        is_published: data.is_published || false, featured: data.featured || false,
        full_guide_markdown: data.full_guide_markdown || "", preparation_plan: data.preparation_plan || "",
        itinerary_markdown: data.itinerary_markdown || "", gear_list_markdown: data.gear_list_markdown || "",
        flights_url: aff.flights_url || "", hotels_url: aff.hotels_url || "", insurance_url: aff.insurance_url || "",
        tours_url: aff.tours_url || "", tickets_url: aff.tickets_url || "",
        car_rental_url: aff.car_rental_url || "", transfer_url: aff.transfer_url || "",
      });
      setFears((data.common_fears as unknown as Fear[]) || []);
      setGalleryImages((data.gallery_images as string[]) || []);
    };
    load();
  }, [id, isEdit]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title, slug: form.slug, country: form.country, region: form.region || null,
      short_description: form.short_description || null, difficulty_level: form.difficulty_level,
      difficulty_description: form.difficulty_description || null, days_needed: form.days_needed || null,
      best_season: form.best_season || null, estimated_budget_usd: form.estimated_budget_usd ? Number(form.estimated_budget_usd) : null,
      hero_image_url: form.hero_image_url || null, experience_type: form.experience_type || null,
      is_published: form.is_published, featured: form.featured,
      full_guide_markdown: form.full_guide_markdown || null, preparation_plan: form.preparation_plan || null,
      itinerary_markdown: form.itinerary_markdown || null, gear_list_markdown: form.gear_list_markdown || null,
      common_fears: JSON.parse(JSON.stringify(fears)),
      gallery_images: galleryImages,
      affiliate_links: JSON.parse(JSON.stringify({
        flights_url: form.flights_url, hotels_url: form.hotels_url, insurance_url: form.insurance_url,
        tours_url: form.tours_url, tickets_url: form.tickets_url,
        car_rental_url: form.car_rental_url, transfer_url: form.transfer_url,
      })),
    };

    const { error } = isEdit
      ? await supabase.from("destinations").update(payload).eq("id", id)
      : await supabase.from("destinations").insert(payload);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else navigate("/admin/destinations");
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl text-foreground mb-6">{isEdit ? "Editar Destino" : "Nuevo Destino"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <GeneralFields form={form} set={set} galleryImages={galleryImages} onGalleryChange={setGalleryImages} />
        <FaqFields
          fears={fears}
          onAdd={() => setFears([...fears, { question: "", answer: "" }])}
          onRemove={(i) => setFears(fears.filter((_, idx) => idx !== i))}
          onUpdate={(i, key, val) => setFears(fears.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))}
        />
        <MarkdownFields form={form} set={set} />
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
