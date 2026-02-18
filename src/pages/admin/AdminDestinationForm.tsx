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

interface Fear { question: string; answer: string; }

const emptyForm = {
  title: "", slug: "", country: "", region: "", short_description: "",
  difficulty_level: "easy", difficulty_description: "", days_needed: "",
  best_season: "", estimated_budget_usd: "", hero_image_url: "",
  experience_type: "", is_published: false, featured: false,
  full_guide_markdown: "", preparation_plan: "", itinerary_markdown: "",
  gear_list_markdown: "", flights_url: "", hotels_url: "", insurance_url: "",
};

const AdminDestinationForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [fears, setFears] = useState<Fear[]>([]);
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
      });
      setFears((data.common_fears as unknown as Fear[]) || []);
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
      affiliate_links: JSON.parse(JSON.stringify({ flights_url: form.flights_url, hotels_url: form.hotels_url, insurance_url: form.insurance_url })),
    };

    const { error } = isEdit
      ? await supabase.from("destinations").update(payload).eq("id", id)
      : await supabase.from("destinations").insert(payload);

    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else navigate("/admin/destinations");
  };

  const addFear = () => setFears([...fears, { question: "", answer: "" }]);
  const removeFear = (i: number) => setFears(fears.filter((_, idx) => idx !== i));
  const updateFear = (i: number, key: keyof Fear, val: string) =>
    setFears(fears.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl text-foreground mb-6">{isEdit ? "Editar Destino" : "Nuevo Destino"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Información General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-card-foreground">Título *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">Slug *</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">País *</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">Región</Label><Input value={form.region} onChange={(e) => set("region", e.target.value)} className="bg-background border-border text-foreground" /></div>
              <div>
                <Label className="text-card-foreground">Dificultad</Label>
                <Select value={form.difficulty_level} onValueChange={(v) => set("difficulty_level", v)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="easy">Fácil</SelectItem><SelectItem value="moderate">Moderado</SelectItem><SelectItem value="challenging">Desafiante</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-card-foreground">Días necesarios</Label><Input value={form.days_needed} onChange={(e) => set("days_needed", e.target.value)} className="bg-background border-border text-foreground" /></div>
              <div><Label className="text-card-foreground">Presupuesto (USD)</Label><Input type="number" value={form.estimated_budget_usd} onChange={(e) => set("estimated_budget_usd", e.target.value)} className="bg-background border-border text-foreground" /></div>
              <div><Label className="text-card-foreground">Mejor Temporada</Label><Input value={form.best_season} onChange={(e) => set("best_season", e.target.value)} className="bg-background border-border text-foreground" /></div>
            </div>
            <div><Label className="text-card-foreground">Descripción Corta</Label><Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div><Label className="text-card-foreground">Descripción de Dificultad</Label><Textarea value={form.difficulty_description} onChange={(e) => set("difficulty_description", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} /><Label className="text-card-foreground">Publicado</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} /><Label className="text-card-foreground">Destacado</Label></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Miedos Comunes (FAQ)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fears.map((f, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input placeholder="Pregunta" value={f.question} onChange={(e) => updateFear(i, "question", e.target.value)} className="bg-background border-border text-foreground" />
                  <Textarea placeholder="Respuesta" value={f.answer} onChange={(e) => updateFear(i, "answer", e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeFear(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addFear} className="border-border text-foreground"><Plus className="h-4 w-4 mr-1" /> Agregar Pregunta</Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Contenido Markdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-card-foreground">Preparación Física</Label><Textarea rows={8} value={form.preparation_plan} onChange={(e) => set("preparation_plan", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
            <div><Label className="text-card-foreground">Itinerario</Label><Textarea rows={8} value={form.itinerary_markdown} onChange={(e) => set("itinerary_markdown", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
            <div><Label className="text-card-foreground">Qué Llevar</Label><Textarea rows={8} value={form.gear_list_markdown} onChange={(e) => set("gear_list_markdown", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
            <div><Label className="text-card-foreground">Guía Completa</Label><Textarea rows={8} value={form.full_guide_markdown} onChange={(e) => set("full_guide_markdown", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Affiliate Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-card-foreground">URL Vuelos</Label><Input value={form.flights_url} onChange={(e) => set("flights_url", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div><Label className="text-card-foreground">URL Hoteles</Label><Input value={form.hotels_url} onChange={(e) => set("hotels_url", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div><Label className="text-card-foreground">URL Seguro de Viaje</Label><Input value={form.insurance_url} onChange={(e) => set("insurance_url", e.target.value)} className="bg-background border-border text-foreground" /></div>
          </CardContent>
        </Card>

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
