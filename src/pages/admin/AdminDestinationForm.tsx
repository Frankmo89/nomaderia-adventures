import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Sparkles, Tent, Trash2 } from "lucide-react";
import { VerifyFieldBadge } from "@/components/admin/VerifyFieldBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/dashboard/ImageUpload";
import MultiMediaUpload from "@/components/dashboard/MultiMediaUpload";

interface Fear { miedo: string; respuesta: string; }

// Matches the keys consumed by TrailCards.tsx and the jsonb-contracts canonical form
interface HikeRow {
  nombre: string;
  distancia_km: string;    // stored as number in DB; string in form state
  duracion_horas: string;
  desnivel_m: string;
  apto_principiante: boolean;
  nota: string;
}

// Matches lodging_info v2 canonical form consumed by HowToGetThere.tsx
interface LodgingRow {
  nombre: string;
  tipo: string;
  precio_usd: string;      // stored as number in DB; string in form state
  precio_nota: string;
  dentro_del_parque: boolean;
  reserva_url: string;
}

interface GenerateParkResult {
  ok: boolean;
  procesados: number;
  restantes: number;
  detalle: Array<{
    park_code: string | null;
    status: "ok" | "error";
    fields?: string[];
    reason?: string;
  }>;
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
  // Extended fields — ADR-009 cast until Frank regenera tipos
  why_visit_markdown: "",
  has_nonresident_surcharge: false,
  nonresident_surcharge: "",
  max_elevation_ft: "",
  altitude_warning: false,
  beginner_friendly: true,
  drive_time_from_la: "",
  drive_time_from_san_diego: "",
  nearest_airport: "",
  nearest_town: "",
  getting_there_markdown: "",
  last_verified_at: "",
  internal_notes: "",
};

type FormState = typeof emptyForm;

// El flujo de borrador IA de destinos se retiró (catálogo de 63 parques cerrado);
// sin él no hay flags automáticos, pero los sub-componentes conservan el soporte
// de VerifyFieldBadge para edición manual.
const NO_VERIFY_FLAGS: string[] = [];

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
          {field("URL Stripe por Destino (opcional)", <Input value={form.permit_alert_url} onChange={(e) => set("permit_alert_url", e.target.value)} className={inputCls} placeholder="https://buy.stripe.com/..." />)}
          <p className="text-xs text-muted-foreground mt-1">Link de pago específico por parque. Dejar vacío si no aplica.</p>
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

// --- Collapsible sections for extended fields ---

const CollapsibleCard = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: ReactNode }) => (
  <Card className="bg-card border-border">
    <Accordion type="single" collapsible>
      <AccordionItem value={sectionKey} className="border-none">
        <AccordionTrigger className="px-6 py-4 text-card-foreground font-serif text-lg hover:no-underline [&[data-state=open]]:text-primary">
          {title}
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-6 pb-6 space-y-4">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Card>
);

const CharacteristicsFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <CollapsibleCard title="Características del Destino" sectionKey="characteristics">
    {field("Por qué ir (markdown)", <Textarea rows={5} value={form.why_visit_markdown} onChange={(e) => set("why_visit_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} placeholder="Texto de venta del destino en markdown..." />)}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {field("Elevación Máxima (pies)", <Input type="number" value={form.max_elevation_ft} onChange={(e) => set("max_elevation_ft", e.target.value)} className={inputCls} placeholder="Ej: 8800" />)}
    </div>
    <div className="flex flex-wrap gap-6 pt-2">
      <div className="flex items-center gap-2">
        <Switch id="beginner_friendly" checked={form.beginner_friendly} onCheckedChange={(v) => set("beginner_friendly", v)} />
        <Label htmlFor="beginner_friendly" className="text-card-foreground">Apto para principiantes</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="altitude_warning" checked={form.altitude_warning} onCheckedChange={(v) => set("altitude_warning", v)} />
        <Label htmlFor="altitude_warning" className="text-card-foreground">Advertencia de altitud</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="has_nonresident_surcharge" checked={form.has_nonresident_surcharge} onCheckedChange={(v) => set("has_nonresident_surcharge", v)} />
        <Label htmlFor="has_nonresident_surcharge" className="text-card-foreground">Recargo para no-residentes</Label>
      </div>
    </div>
    {form.has_nonresident_surcharge && field("Recargo no-residentes (USD)", <Input type="number" value={form.nonresident_surcharge} onChange={(e) => set("nonresident_surcharge", e.target.value)} className={inputCls} placeholder="Ej: 100" />)}
  </CollapsibleCard>
);

const LogisticsFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <CollapsibleCard title="Logística y Cómo Llegar" sectionKey="logistics">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {field("Aeropuerto más cercano", <Input value={form.nearest_airport} onChange={(e) => set("nearest_airport", e.target.value)} className={inputCls} placeholder="Ej: LAX, SAN" />)}
      {field("Ciudad / pueblo más cercano", <Input value={form.nearest_town} onChange={(e) => set("nearest_town", e.target.value)} className={inputCls} placeholder="Ej: Fresno, CA" />)}
      {field("Tiempo desde Los Ángeles", <Input value={form.drive_time_from_la} onChange={(e) => set("drive_time_from_la", e.target.value)} className={inputCls} placeholder="Ej: 4h 30min en auto" />)}
      {field("Tiempo desde San Diego", <Input value={form.drive_time_from_san_diego} onChange={(e) => set("drive_time_from_san_diego", e.target.value)} className={inputCls} placeholder="Ej: 6h en auto" />)}
    </div>
    {field("Cómo Llegar (markdown)", <Textarea rows={6} value={form.getting_there_markdown} onChange={(e) => set("getting_there_markdown", e.target.value)} className={`${inputCls} font-mono text-sm`} />)}
  </CollapsibleCard>
);

const InternalFields = ({ form, set }: { form: FormState; set: (k: string, v: string | boolean) => void }) => (
  <CollapsibleCard title="Control Interno" sectionKey="internal">
    {field("Última verificación", <Input type="date" value={form.last_verified_at} onChange={(e) => set("last_verified_at", e.target.value)} className={inputCls} />)}
    {field("Notas internas (solo admin)", <Textarea rows={4} value={form.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} className={inputCls} placeholder="Notas privadas sobre este destino..." />)}
  </CollapsibleCard>
);

const SignatureHikesFields = ({
  hikes,
  onAdd,
  onRemove,
  onUpdate,
}: {
  hikes: HikeRow[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, key: keyof HikeRow, val: string | boolean) => void;
}) => (
  <CollapsibleCard title="Senderos destacados" sectionKey="hikes">
    {hikes.map((h, i) => (
      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Sendero {i + 1}</span>
          <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar sendero ${i + 1}`} onClick={() => onRemove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field("Nombre", <Input value={h.nombre} onChange={(e) => onUpdate(i, "nombre", e.target.value)} className={inputCls} placeholder="Delicate Arch Trail" />)}
          {field("Distancia (km)", <Input type="number" step="0.1" min="0" value={h.distancia_km} onChange={(e) => onUpdate(i, "distancia_km", e.target.value)} className={inputCls} placeholder="4.8" />)}
          {field("Duración (horas)", <Input type="number" step="0.5" min="0" value={h.duracion_horas} onChange={(e) => onUpdate(i, "duracion_horas", e.target.value)} className={inputCls} placeholder="3.0" />)}
          {field("Desnivel (m)", <Input type="number" min="0" value={h.desnivel_m} onChange={(e) => onUpdate(i, "desnivel_m", e.target.value)} className={inputCls} placeholder="147" />)}
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`hike-apto-${i}`} checked={h.apto_principiante} onCheckedChange={(v) => onUpdate(i, "apto_principiante", v)} />
          <Label htmlFor={`hike-apto-${i}`} className="text-card-foreground text-sm">Apto para principiantes</Label>
        </div>
        {field("Nota", <Textarea rows={2} value={h.nota} onChange={(e) => onUpdate(i, "nota", e.target.value)} className={inputCls} placeholder="1-2 oraciones sobre este sendero..." />)}
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={onAdd} className="border-border text-foreground">
      <Plus className="h-4 w-4 mr-1" /> Agregar Sendero
    </Button>
  </CollapsibleCard>
);

const LODGING_TIPOS = ["camping", "lodge", "hotel", "cabaña", "glamping", "hostal"] as const;

const LodgingFields = ({
  lodging,
  onAdd,
  onRemove,
  onUpdate,
}: {
  lodging: LodgingRow[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, key: keyof LodgingRow, val: string | boolean) => void;
}) => (
  <CollapsibleCard title="Hospedaje" sectionKey="lodging">
    {lodging.map((l, i) => (
      <div key={i} className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Opción {i + 1}</span>
          <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar hospedaje ${i + 1}`} onClick={() => onRemove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field("Nombre", <Input value={l.nombre} onChange={(e) => onUpdate(i, "nombre", e.target.value)} className={inputCls} placeholder="Yosemite Valley Lodge" />)}
          <div>
            {fieldLabel("Tipo", false)}
            <Select value={l.tipo} onValueChange={(v) => onUpdate(i, "tipo", v)}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {LODGING_TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field("Precio desde (USD/noche)", <Input type="number" min="0" value={l.precio_usd} onChange={(e) => onUpdate(i, "precio_usd", e.target.value)} className={inputCls} placeholder="89" />)}
          {field("Nota de precio", <Input value={l.precio_nota} onChange={(e) => onUpdate(i, "precio_nota", e.target.value)} className={inputCls} placeholder="Varía por temporada" />)}
          {field("URL para reservar", <Input value={l.reserva_url} onChange={(e) => onUpdate(i, "reserva_url", e.target.value)} className={inputCls} placeholder="https://..." />)}
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`lodging-inside-${i}`} checked={l.dentro_del_parque} onCheckedChange={(v) => onUpdate(i, "dentro_del_parque", v)} />
          <Label htmlFor={`lodging-inside-${i}`} className="text-card-foreground text-sm">Dentro del parque</Label>
        </div>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={onAdd} className="border-border text-foreground">
      <Plus className="h-4 w-4 mr-1" /> Agregar Hospedaje
    </Button>
  </CollapsibleCard>
);

// --- Main component ---

const AdminDestinationForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [fears, setFears] = useState<Fear[]>([]);
  const [hikes, setHikes] = useState<HikeRow[]>([]);
  const [lodging, setLodging] = useState<LodgingRow[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [parkCode, setParkCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [isRidbPulling, setIsRidbPulling] = useState(false);
  const [ridbForce, setRidbForce] = useState(false);
  const [ridbPullResult, setRidbPullResult] = useState<{ procesados: number; sin_match: number } | null>(null);
  const [ridbPullError, setRidbPullError] = useState<string | null>(null);

  const loadDestination = useCallback(async () => {
    if (!isEdit || !id) return;
    const { data } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
    if (!data) return;
    const aff = (data.affiliate_links as Record<string, string>) || {};
    const raw = data as Record<string, unknown>;
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
      // Extended fields via ADR-009 cast
      why_visit_markdown: (raw.why_visit_markdown as string | null) ?? "",
      has_nonresident_surcharge: (raw.has_nonresident_surcharge as boolean | null) ?? false,
      nonresident_surcharge: raw.nonresident_surcharge != null ? String(raw.nonresident_surcharge as number) : "",
      max_elevation_ft: raw.max_elevation_ft != null ? String(raw.max_elevation_ft as number) : "",
      altitude_warning: (raw.altitude_warning as boolean | null) ?? false,
      beginner_friendly: (raw.beginner_friendly as boolean | null) ?? true,
      drive_time_from_la: (raw.drive_time_from_la as string | null) ?? "",
      drive_time_from_san_diego: (raw.drive_time_from_san_diego as string | null) ?? "",
      nearest_airport: (raw.nearest_airport as string | null) ?? "",
      nearest_town: (raw.nearest_town as string | null) ?? "",
      getting_there_markdown: (raw.getting_there_markdown as string | null) ?? "",
      last_verified_at: raw.last_verified_at ? (raw.last_verified_at as string).slice(0, 10) : "",
      internal_notes: (raw.internal_notes as string | null) ?? "",
    });
    setParkCode(raw.park_code as string | null ?? null);
    setFears((data.common_fears as unknown as Fear[]) || []);

    const rawHikes = (raw.signature_hikes as Array<Record<string, unknown>> | null) ?? [];
    setHikes(rawHikes.map((h) => ({
      nombre: (h.nombre as string | null) ?? "",
      distancia_km: h.distancia_km != null ? String(h.distancia_km) : "",
      duracion_horas: h.duracion_horas != null ? String(h.duracion_horas) : "",
      desnivel_m: h.desnivel_m != null ? String(h.desnivel_m) : "",
      apto_principiante: (h.apto_principiante as boolean | null) ?? false,
      nota: (h.nota as string | null) ?? "",
    })));

    const rawLodging = (raw.lodging_info as Array<Record<string, unknown>> | null) ?? [];
    setLodging(rawLodging.map((l) => ({
      nombre: (l.nombre as string | null) ?? "",
      tipo: (l.tipo as string | null) ?? "",
      precio_usd: l.precio_usd != null ? String(l.precio_usd) : "",
      precio_nota: (l.precio_nota as string | null) ?? (l.notas as string | null) ?? "",
      dentro_del_parque: (l.dentro_del_parque as boolean | null) ?? false,
      reserva_url: (l.reserva_url as string | null) ?? "",
    })));

    setGalleryImages((data.gallery_images as string[]) || []);
  }, [id, isEdit]);

  useEffect(() => {
    loadDestination();
  }, [loadDestination]);

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

  const handleGenerateParkContent = async () => {
    if (!parkCode) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-park-content", {
        body: { park_code: parkCode, force: forceOverwrite },
      });
      if (error) throw error;
      const result = data as GenerateParkResult | null;
      if (!result?.ok) {
        throw new Error(result?.detalle?.[0]?.reason ?? "La función no devolvió OK");
      }
      const parkDetail = result.detalle.find((d) => d.status === "ok");
      const fieldsCount = parkDetail?.fields?.length ?? 0;
      toast({
        title: "Contenido generado",
        description: fieldsCount > 0
          ? `${fieldsCount} campos actualizados con IA.`
          : "Sin campos nuevos (todos ya tenían contenido — usa Forzar para sobrescribir).",
      });
      await loadDestination();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al generar contenido";
      toast({ title: "Error al generar", description: message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRidbPull = async () => {
    if (!parkCode) return;
    setIsRidbPulling(true);
    setRidbPullResult(null);
    setRidbPullError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-park-permits", {
        body: { park_code: parkCode, force: ridbForce },
      });
      if (error) throw error;
      const d = data as { procesados?: number; sin_match?: number };
      setRidbPullResult({
        procesados: d.procesados ?? 0,
        sin_match:  d.sin_match  ?? 0,
      });
      // Reload form to show freshly written fields (lodging_info, permits_info, etc.)
      await loadDestination();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al jalar datos RIDB";
      setRidbPullError(msg);
      console.error("[RIDB pull]", err);
    } finally {
      setIsRidbPulling(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

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

    // Extended fields not in generated types — ADR-009 cast required
    const extPayload = {
      why_visit_markdown: form.why_visit_markdown || null,
      has_nonresident_surcharge: form.has_nonresident_surcharge,
      nonresident_surcharge: form.nonresident_surcharge ? Number(form.nonresident_surcharge) : null,
      max_elevation_ft: form.max_elevation_ft ? Number(form.max_elevation_ft) : null,
      altitude_warning: form.altitude_warning,
      beginner_friendly: form.beginner_friendly,
      drive_time_from_la: form.drive_time_from_la || null,
      drive_time_from_san_diego: form.drive_time_from_san_diego || null,
      nearest_airport: form.nearest_airport || null,
      nearest_town: form.nearest_town || null,
      getting_there_markdown: form.getting_there_markdown || null,
      last_verified_at: form.last_verified_at || null,
      internal_notes: form.internal_notes || null,
      signature_hikes: hikes.filter((h) => h.nombre.trim()).map((h) => ({
        nombre: h.nombre.trim(),
        distancia_km: h.distancia_km ? Number(h.distancia_km) : null,
        duracion_horas: h.duracion_horas ? Number(h.duracion_horas) : null,
        desnivel_m: h.desnivel_m ? Number(h.desnivel_m) : null,
        apto_principiante: h.apto_principiante,
        nota: h.nota.trim() || null,
      })),
      lodging_info: lodging.filter((l) => l.nombre.trim()).map((l) => ({
        nombre: l.nombre.trim(),
        tipo: l.tipo || null,
        precio_usd: l.precio_usd ? Number(l.precio_usd) : null,
        precio_nota: l.precio_nota.trim() || null,
        dentro_del_parque: l.dentro_del_parque,
        reserva_url: l.reserva_url.trim() || null,
      })),
    };

    const fullPayload = { ...payload, ...extPayload };
    const dbClient = supabase as unknown as SupabaseClient;
    const result = isEdit
      ? await dbClient.from("destinations").update(fullPayload).eq("id", id)
      : await dbClient.from("destinations").insert(fullPayload).select("id").single();

    setSaving(false);
    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    navigate("/admin/destinations");
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="font-serif text-3xl text-foreground">{isEdit ? "Editar Destino" : "Nuevo Destino"}</h1>
      </div>

      {isEdit && (
        <Card className="bg-card border border-primary/30 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <Button
                type="button"
                disabled={isGenerating || !parkCode}
                onClick={handleGenerateParkContent}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shrink-0"
              >
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</>
                  : <><Sparkles className="h-4 w-4 mr-2" />Generar contenido AI de este parque</>
                }
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  id="force-overwrite"
                  checked={forceOverwrite}
                  onCheckedChange={setForceOverwrite}
                  disabled={isGenerating}
                />
                <Label htmlFor="force-overwrite" className="text-sm text-muted-foreground cursor-pointer">
                  Forzar sobrescritura (ignorar reglas no-destructivas)
                </Label>
              </div>
              {!parkCode && (
                <p className="text-xs text-muted-foreground italic">
                  Sin código NPS — este destino no tiene <code className="text-xs">park_code</code> configurado.
                </p>
              )}
              {parkCode && (
                <p className="text-xs text-muted-foreground">
                  Código NPS: <span className="font-mono text-foreground">{parkCode}</span>
                </p>
              )}
            </div>

            {/* RIDB: pull permits & campgrounds */}
            <div className="border-t border-border/50 pt-3 mt-1 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <Button
                type="button"
                disabled={isRidbPulling || !parkCode}
                onClick={handleRidbPull}
                variant="outline"
                className="border-border text-foreground hover:bg-muted shrink-0"
              >
                {isRidbPulling
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Jalando RIDB…</>
                  : <><Tent className="h-4 w-4 mr-2" />Jalar permisos/campamentos de RIDB</>
                }
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  id="ridb-force"
                  checked={ridbForce}
                  onCheckedChange={setRidbForce}
                  disabled={isRidbPulling}
                />
                <Label htmlFor="ridb-force" className="text-sm text-muted-foreground cursor-pointer">
                  Forzar (re-jalar aunque ya haya datos)
                </Label>
              </div>
              {!parkCode && (
                <p className="text-xs text-muted-foreground italic">
                  Sin código NPS — <code className="text-xs">park_code</code> no configurado.
                </p>
              )}
              {ridbPullResult && (
                <p className="text-xs text-[#166534] font-medium">
                  ✓ {ridbPullResult.procesados} procesado{ridbPullResult.procesados !== 1 ? "s" : ""}
                  {ridbPullResult.sin_match > 0 && ` · ${ridbPullResult.sin_match} sin match`}
                </p>
              )}
              {ridbPullError && (
                <p className="text-xs text-destructive font-medium">{ridbPullError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <GeneralFields
          form={form}
          set={set}
          galleryImages={galleryImages}
          onGalleryChange={setGalleryImages}
          verifyFlags={NO_VERIFY_FLAGS}
        />
        <FaqFields
          fears={fears}
          onAdd={() => setFears([...fears, { miedo: "", respuesta: "" }])}
          onRemove={(i) => setFears(fears.filter((_, idx) => idx !== i))}
          onUpdate={(i, key, val) => setFears(fears.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)))}
          verifyFlags={NO_VERIFY_FLAGS}
        />
        <MarkdownFields form={form} set={set} verifyFlags={NO_VERIFY_FLAGS} />
        <SignatureHikesFields
          hikes={hikes}
          onAdd={() => setHikes([...hikes, { nombre: "", distancia_km: "", duracion_horas: "", desnivel_m: "", apto_principiante: false, nota: "" }])}
          onRemove={(i) => setHikes(hikes.filter((_, idx) => idx !== i))}
          onUpdate={(i, key, val) => setHikes(hikes.map((h, idx) => (idx === i ? { ...h, [key]: val } : h)))}
        />
        <LodgingFields
          lodging={lodging}
          onAdd={() => setLodging([...lodging, { nombre: "", tipo: "", precio_usd: "", precio_nota: "", dentro_del_parque: false, reserva_url: "" }])}
          onRemove={(i) => setLodging(lodging.filter((_, idx) => idx !== i))}
          onUpdate={(i, key, val) => setLodging(lodging.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)))}
        />
        <CharacteristicsFields form={form} set={set} />
        <LogisticsFields form={form} set={set} />
        <InternalFields form={form} set={set} />
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
