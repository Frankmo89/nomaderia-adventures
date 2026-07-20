import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Map, Pencil, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ContentV1 } from "@/types/itinerary";
import { crearContenidoVacio } from "@/lib/itinerary-schema";
import { generateFriendlySlug } from "@/lib/generate-slug";

type ClientRow = Tables<"client_itineraries"> & {
  itinerary_templates: {
    destinations: { title: string } | null;
  } | null;
  destinations: { title: string } | null;
};

type DestinationOption = Pick<Tables<"destinations">, "id" | "title">;

type CISortKey = "title" | "client_name" | "status" | "trip_start" | "days" | "updated_at";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  borrador:     { label: "Borrador",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  entregado:    { label: "Entregado",  className: "bg-green-100  text-green-800  border-green-200"  },
  viaje_activo: { label: "En viaje",   className: "bg-blue-100   text-blue-800   border-blue-200"   },
  completado:   { label: "Completado", className: "bg-gray-100   text-gray-700   border-gray-200"   },
  archivado:    { label: "Archivado",  className: "bg-stone-100  text-stone-600  border-stone-200"  },
};

function getPark(row: ClientRow): string {
  if (row.destinations?.title) return row.destinations.title;
  const c = row.content as unknown as ContentV1 | null;
  if (c?.parque) return c.parque;
  return row.itinerary_templates?.destinations?.title ?? "—";
}

function getDaysCount(row: ClientRow): number {
  const c = row.content as unknown as ContentV1 | null;
  return Array.isArray(c?.dias) ? c.dias.length : 0;
}

function formatDates(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}

const getCIValue = (r: ClientRow, key: CISortKey): string | number => {
  switch (key) {
    case "title":       return r.title ?? "";
    case "client_name": return r.client_name;
    case "status":      return r.status;
    case "trip_start":  return r.trip_start ?? "";
    case "days":        return getDaysCount(r);
    case "updated_at":  return r.updated_at;
  }
};

const COL_COUNT = 8;

const createSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  client_name: z.string().min(1, "El nombre es requerido"),
  destination_id: z.string().min(1, "Selecciona un parque"),
  trip_start: z.string().optional(),
  num_days: z.coerce.number().int().min(1, "Mínimo 1 día").max(14, "Máximo 14 días"),
});

type CreateValues = z.infer<typeof createSchema>;

const AdminClientItineraries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { sortState, handleSort } = useSortable<CISortKey>();

  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("client_itineraries")
      .select("*, itinerary_templates(destinations(title)), destinations(title)")
      .order("updated_at", { ascending: false });
    setItems((data as unknown as ClientRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, title")
      .eq("is_published", true)
      .order("title", { ascending: true })
      .then(({ data }) => setDestinations((data as DestinationOption[]) ?? []));
  }, []);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", client_name: "", destination_id: "", trip_start: "", num_days: 3 },
  });

  const onCreate = async (values: CreateValues) => {
    setCreating(true);
    const park = destinations.find((d) => d.id === values.destination_id);
    const content = crearContenidoVacio(values.num_days, park?.title);

    const basePayload = {
      title: values.title,
      client_name: values.client_name,
      destination_id: values.destination_id,
      trip_start: values.trip_start || null,
      content: JSON.parse(JSON.stringify(content)),
      status: "borrador",
    };

    let friendlySlug = generateFriendlySlug(values.client_name, park?.title ?? "");
    let { data, error } = await supabase
      .from("client_itineraries")
      .insert({ ...basePayload, friendly_slug: friendlySlug })
      .select("id")
      .single();

    // Retry once on unique constraint violation (slug collision, ~1 in 36^4)
    if (error?.code === "23505") {
      friendlySlug = generateFriendlySlug(values.client_name, park?.title ?? "");
      const retry = await supabase
        .from("client_itineraries")
        .insert({ ...basePayload, friendly_slug: friendlySlug })
        .select("id")
        .single();
      data = retry.data;
      error = retry.error;
    }

    setCreating(false);
    if (error || !data) {
      toast({ title: "Error al crear itinerario", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Itinerario creado" });
    setCreateOpen(false);
    form.reset();
    navigate(`/admin/client-itineraries/${data.id}`);
  };

  const handleDuplicate = async (row: ClientRow) => {
    setDuplicatingId(row.id);
    // share_token se omite a propósito: el DEFAULT de la tabla genera uno nuevo.
    // friendly_slug queda null (ADR-014: el fallback público es el share_token).
    const { error } = await supabase.from("client_itineraries").insert({
      title: `${row.title ?? row.client_name} (copia)`,
      template_id: row.template_id,
      request_id: row.request_id,
      destination_id: row.destination_id,
      client_name: row.client_name,
      client_email: row.client_email,
      client_whatsapp: row.client_whatsapp,
      trip_start: row.trip_start,
      trip_end: row.trip_end,
      party: JSON.parse(JSON.stringify(row.party)),
      content: JSON.parse(JSON.stringify(row.content)),
      show_costs: row.show_costs,
      internal_notes: row.internal_notes,
      status: "borrador",
    });
    setDuplicatingId(null);
    if (error) {
      toast({ title: "Error al duplicar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Itinerario duplicado", description: "La copia quedó en estado Borrador." });
    fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("client_itineraries")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Itinerario eliminado" });
    setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((r) =>
        `${r.title ?? ""} ${r.client_name} ${r.client_email ?? ""} ${getPark(r)}`
          .toLowerCase()
          .includes(q)
      )
    : items;
  const sorted = applySortable(filtered, sortState, getCIValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Itinerarios de Clientes</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} itinerario{items.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" /> Nuevo itinerario
        </Button>
      </div>

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por título, nombre, email o parque…"
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
              <SortableHeader
                label="Cliente"
                sortKey="client_name"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <TableHead className="text-foreground">Parque</TableHead>
              <SortableHeader
                label="Fechas"
                sortKey="trip_start"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Días"
                sortKey="days"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Estado"
                sortKey="status"
                activeSortKey={sortState.sortKey}
                sortDir={sortState.sortDir}
                onSort={handleSort}
              />
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
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Map}
                    title="Aún no hay itinerarios de clientes"
                    description="Crea el primer itinerario personalizado para un cliente."
                    cta={{ label: "Nuevo itinerario", onClick: () => setCreateOpen(true) }}
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro término de búsqueda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r) => {
                const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.borrador;
                return (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="text-foreground font-medium">
                      {r.title ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div>
                        <span>{r.client_name}</span>
                        {r.client_email && (
                          <p className="text-xs text-muted-foreground mt-0.5">{r.client_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getPark(r)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDates(r.trip_start, r.trip_end)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getDaysCount(r)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs whitespace-nowrap ${sc.className}`}
                      >
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {new Date(r.updated_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/admin/client-itineraries/${r.id}`} aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(r)}
                          disabled={duplicatingId === r.id}
                          aria-label="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(r)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* ── Diálogo de creación rápida ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Nuevo itinerario</DialogTitle>
            <DialogDescription>
              Crea un borrador con días vacíos y complétalo en el editor.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Joshua Tree — fin de semana" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="María García" className="bg-card border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parque <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="bg-card border-border text-foreground">
                          <SelectValue placeholder="Selecciona un parque" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {destinations.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  name="num_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={14} className="bg-card border-border text-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                <Link
                  to="/admin/client-itineraries/new"
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={() => setCreateOpen(false)}
                >
                  ¿Con plantilla y datos del grupo? Formulario completo
                </Link>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {creating ? "Creando…" : "Crear y editar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmación de borrado ────────────────────────────────────────── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este itinerario?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title ?? deleteTarget?.client_name} se eliminará de forma permanente.
              {deleteTarget && deleteTarget.status !== "borrador" && (
                <>
                  {" "}Este itinerario ya fue entregado: el link que tiene el cliente
                  (/i/…) dejará de funcionar.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminClientItineraries;
