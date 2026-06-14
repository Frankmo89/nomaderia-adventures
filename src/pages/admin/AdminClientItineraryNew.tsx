import { useEffect, useState, KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { generateFriendlySlug } from "@/lib/generate-slug";
import type { ContentV1 } from "@/components/admin/ItineraryBlockEditor";

type TemplateOption = Pick<Tables<"itinerary_templates">, "id" | "title" | "content">;

const formSchema = z.object({
  template_id: z.string().optional(),
  client_name: z.string().min(1, "El nombre es requerido"),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  client_whatsapp: z.string().optional(),
  trip_start: z.string().optional(),
  trip_end: z.string().optional(),
  adultos: z.coerce.number().int().min(1, "Mínimo 1 adulto").default(2),
  ninos: z.coerce.number().int().min(0).default(0),
  nivel: z.enum(["principiante", "intermedio", "avanzado"]).default("principiante"),
  presupuesto_usd: z.coerce.number().min(0).optional().or(z.literal("")),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AdminClientItineraryNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [miedos, setMiedos] = useState<string[]>([]);
  const [miedoInput, setMiedoInput] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_id: "",
      client_name: searchParams.get("name") ?? "",
      client_email: searchParams.get("email") ?? "",
      client_whatsapp: "",
      trip_start: "",
      trip_end: "",
      adultos: 2,
      ninos: 0,
      nivel: "principiante",
      presupuesto_usd: "",
      notas: searchParams.get("destination")
        ? `Destino preferido: ${searchParams.get("destination")}`
        : "",
    },
  });

  useEffect(() => {
    supabase
      .from("itinerary_templates")
      .select("id, title, content")
      .eq("is_published", true)
      .order("title", { ascending: true })
      .then(({ data }) => setTemplates((data as unknown as TemplateOption[]) ?? []));
  }, []);

  const addMiedo = () => {
    const val = miedoInput.trim();
    if (val && !miedos.includes(val)) setMiedos((prev) => [...prev, val]);
    setMiedoInput("");
  };

  const handleMiedoKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMiedo();
    }
  };

  const removeMiedo = (m: string) => setMiedos((prev) => prev.filter((x) => x !== m));

  const onSubmit = async (values: FormValues) => {
    setSaving(true);

    const selectedTpl = values.template_id
      ? templates.find((t) => t.id === values.template_id)
      : undefined;

    let content: ContentV1 = { version: 1, dias: [] };
    if (selectedTpl?.content) {
      const raw = selectedTpl.content as unknown as ContentV1;
      content = raw?.version === 1 && Array.isArray(raw.dias)
        ? JSON.parse(JSON.stringify(raw))
        : { version: 1, dias: [] };
    }

    const parkTitle =
      (selectedTpl?.content as unknown as ContentV1 | null)?.parque ??
      selectedTpl?.title ??
      "";
    let friendlySlug = generateFriendlySlug(values.client_name, parkTitle);

    const party = {
      adultos: values.adultos,
      ninos: values.ninos,
      nivel: values.nivel,
      miedos,
      presupuesto_usd: values.presupuesto_usd ? Number(values.presupuesto_usd) : null,
      notas: values.notas || null,
    };

    const basePayload = {
      template_id: values.template_id || null,
      client_name: values.client_name,
      client_email: values.client_email || null,
      client_whatsapp: values.client_whatsapp || null,
      trip_start: values.trip_start || null,
      trip_end: values.trip_end || null,
      party,
      content: JSON.parse(JSON.stringify(content)),
      status: "borrador",
    };

    let { data, error } = await supabase
      .from("client_itineraries")
      .insert({ ...basePayload, friendly_slug: friendlySlug })
      .select("id")
      .single();

    // Retry once on unique constraint violation (slug collision, ~1 in 36^4)
    if (error?.code === "23505") {
      friendlySlug = generateFriendlySlug(values.client_name, parkTitle);
      const retry = await supabase
        .from("client_itineraries")
        .insert({ ...basePayload, friendly_slug: friendlySlug })
        .select("id")
        .single();
      data = retry.data;
      error = retry.error;
    }

    setSaving(false);

    if (error) {
      toast({ title: "Error al crear itinerario", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Itinerario creado" });
    navigate(`/admin/client-itineraries/${data.id}`);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-foreground">Nuevo Itinerario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona una plantilla y completa los datos del cliente.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Plantilla */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h2 className="font-medium text-foreground text-sm uppercase tracking-wide text-muted-foreground">
              Plantilla base
            </h2>
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plantilla de itinerario</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <SelectTrigger className="bg-card border-border text-foreground">
                        <SelectValue placeholder="Empezar en blanco (sin plantilla)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Empezar en blanco</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Datos del cliente */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Datos del cliente
            </h2>

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="María García" className="bg-card border-border text-foreground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="maria@email.com" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="16195551234" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trip_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trip_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de regreso</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Datos del grupo */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Grupo
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="adultos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adultos</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ninos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niños</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-card border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principiante">Principiante</SelectItem>
                          <SelectItem value="intermedio">Intermedio</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Miedos (tag input) */}
            <div>
              <FormLabel className="block mb-1.5">
                Miedos / preocupaciones{" "}
                <span className="text-muted-foreground font-normal">(Enter o coma para añadir)</span>
              </FormLabel>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {miedos.map((m) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="flex items-center gap-1 bg-amber-50 border-amber-200 text-amber-800 text-xs"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMiedo(m)}
                      className="hover:text-red-600 transition-colors"
                      aria-label={`Eliminar ${m}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={miedoInput}
                onChange={(e) => setMiedoInput(e.target.value)}
                onKeyDown={handleMiedoKey}
                onBlur={addMiedo}
                placeholder="ej: osos, altura, perderse…"
                className="bg-card border-border text-foreground"
              />
            </div>

            <FormField
              control={form.control}
              name="presupuesto_usd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Presupuesto estimado (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="800"
                      className="bg-card border-border text-foreground w-40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Preferencias, restricciones, destino solicitado…"
                      className="bg-card border-border text-foreground resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/client-itineraries")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={saving}
            >
              {saving ? "Creando…" : "Crear Itinerario"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminClientItineraryNew;
