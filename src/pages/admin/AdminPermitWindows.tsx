import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AIDraftProgressOverlay } from "@/components/admin/AIDraftProgressOverlay";
import { AIDraftSourcesPanel } from "@/components/admin/AIDraftSourcesPanel";
import { PermitWindowDraftEditor } from "@/components/admin/PermitWindowDraftEditor";
import { usePermitWindowsDraft } from "@/hooks/use-permit-windows-draft";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PermitWindowDraft, PermitWindowsDraftResponse } from "@/types/ai-permits";
import { PARK_NAMES } from "@/lib/parks";

interface PermitWindowRow {
  id: string;
  park: string;
  permit_name: string;
  window_type: "lottery" | "reservation_release" | "first_come";
  opens_at: string;
  closes_at: string | null;
  how_to_apply_url: string | null;
  source_url: string | null;
  year: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PermitWindowFormState {
  park: string;
  permit_name: string;
  window_type: "lottery" | "reservation_release" | "first_come";
  opens_at: string;
  closes_at: string;
  how_to_apply_url: string;
  source_url: string;
  year: string;
  notes: string;
  is_active: boolean;
}

const emptyForm: PermitWindowFormState = {
  park: PARK_NAMES[0],
  permit_name: "",
  window_type: "lottery",
  opens_at: "",
  closes_at: "",
  how_to_apply_url: "",
  source_url: "",
  year: String(new Date().getFullYear()),
  notes: "",
  is_active: false,
};

const windowTypeLabel: Record<string, string> = {
  lottery: "Lotería",
  reservation_release: "Liberación",
  first_come: "Por llegada",
};

const discoveryStatuses = [
  "Buscando fuentes oficiales…",
  "Contrastando ventanas por permiso…",
  "Preparando borrador para revisión…",
];

function formatDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatDateTimeReadable(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AdminPermitWindows = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<PermitWindowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PermitWindowFormState>(emptyForm);

  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftPark, setDraftPark] = useState("");
  const [draftYear, setDraftYear] = useState(String(new Date().getFullYear()));
  const [statusIndex, setStatusIndex] = useState(0);

  const [draftResponse, setDraftResponse] = useState<PermitWindowsDraftResponse | null>(null);
  const [draftWindows, setDraftWindows] = useState<PermitWindowDraft[]>([]);
  const [draftSavingIndex, setDraftSavingIndex] = useState<number | null>(null);

  const {
    mutate: discoverPermitWindows,
    isPending: draftPending,
    error: draftError,
    reset: resetDraft,
  } = usePermitWindowsDraft();

  const verifyFlags = useMemo(() => {
    const baseFlags = new Set(draftResponse?.verify_flags || []);
    baseFlags.add("opens_at");
    baseFlags.add("closes_at");
    return Array.from(baseFlags);
  }, [draftResponse]);

  const parkOptions = useMemo(() => {
    const options = [...PARK_NAMES] as string[];
    if (form.park && !options.includes(form.park)) {
      options.push(form.park);
    }
    return options;
  }, [form.park]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("permit_windows")
      .select("id, park, permit_name, window_type, opens_at, closes_at, how_to_apply_url, source_url, year, notes, is_active, created_at, updated_at")
      .order("year", { ascending: false })
      .order("opens_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data || []) as PermitWindowRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!draftPending) {
      setStatusIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % discoveryStatuses.length);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [draftPending]);

  const setFormField = <K extends keyof PermitWindowFormState>(key: K, value: PermitWindowFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("permit_windows").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: !current } : item)));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("permit_windows").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Ventana eliminada" });
    await load();
  };

  const handleEdit = (item: PermitWindowRow) => {
    setEditingId(item.id);
    setForm({
      park: item.park,
      permit_name: item.permit_name,
      window_type: item.window_type,
      opens_at: formatDateTimeLocal(item.opens_at),
      closes_at: formatDateTimeLocal(item.closes_at),
      how_to_apply_url: item.how_to_apply_url || "",
      source_url: item.source_url || "",
      year: String(item.year),
      notes: item.notes || "",
      is_active: item.is_active,
    });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.park.trim() || !form.permit_name.trim() || !form.opens_at || !form.year.trim()) {
      toast({ title: "Datos incompletos", description: "Parque, permiso, apertura y año son obligatorios.", variant: "destructive" });
      return;
    }

    setSavingForm(true);

    const payload = {
      park: form.park.trim(),
      permit_name: form.permit_name.trim(),
      window_type: form.window_type,
      opens_at: new Date(form.opens_at).toISOString(),
      closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      how_to_apply_url: form.how_to_apply_url.trim() || null,
      source_url: form.source_url.trim() || null,
      year: Number(form.year),
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };

    const result = editingId
      ? await supabase.from("permit_windows").update(payload).eq("id", editingId)
      : await supabase.from("permit_windows").insert(payload);

    setSavingForm(false);

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    toast({ title: editingId ? "Ventana actualizada" : "Ventana creada" });
    clearForm();
    await load();
  };

  const handleDiscoverDraft = () => {
    if (!draftPark.trim() || !draftYear.trim()) {
      toast({ title: "Datos incompletos", description: "Debes indicar parque y año.", variant: "destructive" });
      return;
    }

    const parsedYear = Number(draftYear);
    if (!Number.isInteger(parsedYear)) {
      toast({ title: "Año inválido", description: "Ingresa un año numérico válido.", variant: "destructive" });
      return;
    }

    resetDraft();
    setDraftResponse(null);
    setDraftWindows([]);

    discoverPermitWindows(
      { park: draftPark.trim(), year: parsedYear },
      {
        onSuccess: (response) => {
          setDraftResponse(response);
          setDraftWindows(response.windows);
        },
      },
    );
  };

  const handleCancelDraft = () => {
    resetDraft();
    toast({ title: "Búsqueda detenida", description: "Puedes continuar con el flujo manual." });
  };

  const handleChangeDraftWindow = (index: number, next: PermitWindowDraft) => {
    setDraftWindows((prev) => prev.map((item, current) => (current === index ? next : item)));
  };

  const handleSaveDraftWindow = async (index: number) => {
    const item = draftWindows[index];
    if (!item) return;

    if (!item.park.trim() || !item.permit_name.trim() || !item.opens_at || !item.year) {
      toast({
        title: "Faltan datos por verificar",
        description: "Parque, permiso, fecha de apertura y año son obligatorios para guardar.",
        variant: "destructive",
      });
      return;
    }

    setDraftSavingIndex(index);

    const payload = {
      park: item.park.trim(),
      permit_name: item.permit_name.trim(),
      window_type: item.window_type,
      opens_at: item.opens_at,
      closes_at: item.closes_at,
      how_to_apply_url: item.how_to_apply_url,
      source_url: item.source_url,
      year: item.year,
      notes: item.notes,
      is_active: false,
    };

    const result = await supabase.from("permit_windows").insert(payload).select("id").single();
    setDraftSavingIndex(null);

    if (result.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }

    if (draftResponse && result.data?.id) {
      const { error: aiMetaError } = await supabase
        .from("ai_content_meta")
        .upsert(
          {
            content_type: "permit_window",
            content_id: result.data.id,
            sources: draftResponse.sources,
            verify_flags: draftResponse.verify_flags,
            model: draftResponse.model,
          },
          { onConflict: "content_type,content_id" },
        );

      if (aiMetaError) {
        console.error("[AdminPermitWindows] ai_content_meta save failed:", aiMetaError);
        toast({
          title: "Ventana guardada con advertencia",
          description: "Se guardó la ventana, pero no pudimos guardar fuentes privadas de IA.",
        });
      }
    }

    toast({ title: "Ventana guardada" });
    setDraftWindows((prev) => prev.filter((_, current) => current !== index));
    await load();
  };

  return (
    <div>
      <AIDraftProgressOverlay
        open={draftPending}
        message={discoveryStatuses[statusIndex]}
        onCancel={handleCancelDraft}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Ventanas de Permiso</h1>
        <Button
          type="button"
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setShowDraftForm((prev) => !prev)}
        >
          <Sparkles className="h-4 w-4 mr-2" /> ✦ Buscar fechas oficiales
        </Button>
      </div>

      {showDraftForm && (
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-card-foreground">Borrador IA de calendario oficial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-card-foreground mb-2">Parque</Label>
                <Input className="bg-background border-border text-foreground" value={draftPark} onChange={(e) => setDraftPark(e.target.value)} placeholder="Ej: Yosemite National Park" />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Año</Label>
                <Input type="number" className="bg-background border-border text-foreground" value={draftYear} onChange={(e) => setDraftYear(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleDiscoverDraft} disabled={draftPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {draftPending ? "Buscando..." : "Buscar fechas oficiales"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDraftForm(false)}>Cerrar</Button>
            </div>

            {draftError && !draftPending && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm text-destructive font-medium">
                  No pudimos generar el borrador en este momento. Intenta de nuevo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {draftResponse && (
        <section className="mb-8 space-y-4">
          <AIDraftSourcesPanel sources={draftResponse.sources} />

          {!!verifyFlags.length && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Campos por verificar</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {verifyFlags.map((flag) => (
                  <span key={flag} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20">
                    ⚠ Verificar: {flag}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {draftWindows.length > 0 ? (
            <div className="space-y-4">
              {draftWindows.map((windowDraft, index) => (
                <PermitWindowDraftEditor
                  key={`${windowDraft.permit_name}-${index}`}
                  item={windowDraft}
                  index={index}
                  onChange={handleChangeDraftWindow}
                  onSave={handleSaveDraftWindow}
                  saving={draftSavingIndex === index}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay ventanas pendientes por guardar del borrador actual.</p>
          )}
        </section>
      )}

      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <CardTitle className="text-card-foreground">{editingId ? "Editar ventana" : "Nueva ventana"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-card-foreground mb-2">Parque</Label>
                <Select value={form.park} onValueChange={(value) => setFormField("park", value)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {parkOptions.map((park) => (
                      <SelectItem key={park} value={park}>{park}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Permiso</Label>
                <Input className="bg-background border-border text-foreground" value={form.permit_name} onChange={(e) => setFormField("permit_name", e.target.value)} required />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Tipo de ventana</Label>
                <Select value={form.window_type} onValueChange={(value) => setFormField("window_type", value as PermitWindowFormState["window_type"])}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lottery">Lotería</SelectItem>
                    <SelectItem value="reservation_release">Liberación de reservas</SelectItem>
                    <SelectItem value="first_come">Primero en llegar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Año</Label>
                <Input type="number" className="bg-background border-border text-foreground" value={form.year} onChange={(e) => setFormField("year", e.target.value)} required />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Abre en</Label>
                <Input type="datetime-local" className="bg-background border-border text-foreground" value={form.opens_at} onChange={(e) => setFormField("opens_at", e.target.value)} required />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">Cierra en</Label>
                <Input type="datetime-local" className="bg-background border-border text-foreground" value={form.closes_at} onChange={(e) => setFormField("closes_at", e.target.value)} />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">URL para aplicar</Label>
                <Input className="bg-background border-border text-foreground" value={form.how_to_apply_url} onChange={(e) => setFormField("how_to_apply_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-card-foreground mb-2">URL fuente</Label>
                <Input className="bg-background border-border text-foreground" value={form.source_url} onChange={(e) => setFormField("source_url", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label className="text-card-foreground mb-2">Notas</Label>
              <Textarea className="bg-background border-border text-foreground" rows={3} value={form.notes} onChange={(e) => setFormField("notes", e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(value) => setFormField("is_active", value)} />
              <Label className="text-card-foreground">Activa</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={savingForm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {savingForm ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={clearForm}>Cancelar edición</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Parque</TableHead>
              <TableHead className="text-foreground">Permiso</TableHead>
              <TableHead className="text-foreground">Tipo</TableHead>
              <TableHead className="text-foreground">Abre en</TableHead>
              <TableHead className="text-foreground">Año</TableHead>
              <TableHead className="text-foreground">Activa</TableHead>
              <TableHead className="text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No hay ventanas de permiso registradas.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{item.park}</TableCell>
                  <TableCell className="text-muted-foreground">{item.permit_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-foreground border-border">{windowTypeLabel[item.window_type] ?? item.window_type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTimeReadable(item.opens_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{item.year}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                      aria-label={item.is_active ? "Activa" : "Inactiva"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="icon" aria-label={`Editar ventana ${item.permit_name}`} title={`Editar ventana ${item.permit_name}`} onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar ventana ${item.permit_name}`} title={`Eliminar ventana ${item.permit_name}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar ventana?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{item.permit_name}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPermitWindows;
