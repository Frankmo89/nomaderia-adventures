import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Search, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type TemplateRow = Tables<"itinerary_templates"> & {
  destinations: { id: string; title: string } | null;
};

type TemplateSortKey = "title" | "suggested_days" | "updated_at";

const getTemplateValue = (t: TemplateRow, key: TemplateSortKey): string | number => {
  switch (key) {
    case "title": return t.title;
    case "suggested_days": return t.suggested_days;
    case "updated_at": return t.updated_at;
  }
};

const newTemplateSchema = z.object({
  destination_id: z.string().min(1, "Selecciona un destino"),
  title: z.string().min(1, "El título es requerido"),
  summary: z.string().optional(),
  suggested_days: z.coerce.number().int().min(1, "Mínimo 1 día").max(30, "Máximo 30 días"),
});
type NewTemplateValues = z.infer<typeof newTemplateSchema>;

const AdminItineraryTemplates = () => {
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [destOptions, setDestOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { sortState, handleSort } = useSortable<TemplateSortKey>();

  const form = useForm<NewTemplateValues>({
    resolver: zodResolver(newTemplateSchema),
    defaultValues: { destination_id: "", title: "", summary: "", suggested_days: 2 },
  });

  const load = async () => {
    const { data } = await supabase
      .from("itinerary_templates")
      .select("*, destinations(id, title)")
      .order("updated_at", { ascending: false });
    setItems((data as unknown as TemplateRow[]) ?? []);
    setLoading(false);
  };

  const loadDestOptions = async () => {
    const { data } = await supabase
      .from("destinations")
      .select("id, title")
      .eq("is_published", true)
      .order("title", { ascending: true });
    setDestOptions(data ?? []);
  };

  useEffect(() => { load(); loadDestOptions(); }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((t) =>
        `${t.title} ${t.destinations?.title ?? ""}`.toLowerCase().includes(q)
      )
    : items;
  const sorted = applySortable(filtered, sortState, getTemplateValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  const handleTogglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("itinerary_templates")
      .update({ is_published: !current })
      .eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.map((t) => (t.id === id ? { ...t, is_published: !current } : t)));
  };

  const onSubmit = async (values: NewTemplateValues) => {
    setSaving(true);
    const { error } = await supabase.from("itinerary_templates").insert({
      destination_id: values.destination_id,
      title: values.title,
      summary: values.summary || null,
      suggested_days: values.suggested_days,
      content: { version: 1, dias: [] },
      research_status: "ai_draft",
      is_published: false,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error al crear plantilla", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plantilla creada" });
      form.reset();
      setDialogOpen(false);
      load();
    }
  };

  const closeDialog = () => { setDialogOpen(false); form.reset(); };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Plantillas de Itinerario</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) form.reset(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Nueva Plantilla de Itinerario</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="destination_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-card border-border text-foreground">
                            <SelectValue placeholder="Selecciona un destino publicado" />
                          </SelectTrigger>
                          <SelectContent>
                            {destOptions.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej. Joshua Tree — 2 días esencial"
                          className="bg-card border-border text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Resumen{" "}
                        <span className="text-muted-foreground text-xs">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción breve para el panel admin"
                          className="bg-card border-border text-foreground resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suggested_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días sugeridos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          className="bg-card border-border text-foreground w-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Crear Plantilla"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por título o destino…"
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            Mostrando {filtered.length} de {items.length}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader
                label="Título"
                sortKey="title"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <TableHead className="text-foreground">Destino</TableHead>
              <SortableHeader
                label="Días"
                sortKey="suggested_days"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <TableHead className="text-foreground">Publicado</TableHead>
              <SortableHeader
                label="Actualizado"
                sortKey="updated_at"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <TableHead className="text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <AdminEmptyState
                    icon={LayoutList}
                    title="Aún no hay plantillas"
                    description="Crea tu primera plantilla de itinerario para comenzar."
                    cta={{ label: "Nueva Plantilla", onClick: () => setDialogOpen(true) }}
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro término de búsqueda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((t) => (
                <TableRow key={t.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{t.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.destinations?.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.suggested_days}</TableCell>
                  <TableCell>
                    <Switch
                      checked={t.is_published}
                      onCheckedChange={() => handleTogglePublish(t.id, t.is_published)}
                      aria-label={t.is_published ? "Publicado" : "Borrador"}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(t.updated_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar contenido de ${t.title}`}
                    >
                      <Link to={`/admin/itinerary-templates/${t.id}`}>
                        <Pencil className="h-4 w-4 mr-1.5" /> Editar contenido
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        page={page}
        pageCount={pageCount}
        total={sorted.length}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminItineraryTemplates;
