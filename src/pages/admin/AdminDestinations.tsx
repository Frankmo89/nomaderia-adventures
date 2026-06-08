import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Sparkles, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrendingDestinationCard } from "@/components/admin/TrendingDestinationCard";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useTrendingDestinations } from "@/hooks/use-trending-destinations";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Destination = Tables<"destinations">;

type DestSortKey = "title" | "country" | "difficulty_level" | "created_at" | "updated_at";

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderada",
  challenging: "Difícil",
};

const getDestValue = (d: Destination, key: DestSortKey): string => {
  switch (key) {
    case "title": return d.title;
    case "country": return d.country ?? "";
    case "difficulty_level": return d.difficulty_level ?? "";
    case "created_at": return d.created_at;
    case "updated_at": return d.updated_at;
  }
};

const AdminDestinations = () => {
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { sortState, handleSort } = useSortable<DestSortKey>();
  const {
    mutate: discoverTrending,
    data: discoveryData,
    error: discoveryError,
    isPending: discoveryPending,
    reset: resetDiscovery,
  } = useTrendingDestinations();

  const discoveryStatuses = [
    "Buscando hikes en tendencia…",
    "Filtrando para principiantes…",
    "Reuniendo fuentes…",
  ];

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((d) => `${d.title} ${d.country ?? ""}`.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getDestValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  const load = async () => {
    const { data } = await supabase.from("destinations").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!discoveryPending) { setStatusIndex(0); return; }
    // Progreso por etapas en cliente (no es streaming real del backend).
    const intervalId = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % discoveryStatuses.length);
    }, 2200);
    return () => { window.clearInterval(intervalId); };
  }, [discoveryPending, discoveryStatuses.length]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("destinations").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Destino eliminado" }); load(); }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("destinations").update({ is_published: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.map((d) => d.id === id ? { ...d, is_published: !current } : d));
  };

  const handleDiscoverTrending = () => {
    setShowDiscoveryPanel(true);
    resetDiscovery();
    discoverTrending();
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Destinos</h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={handleDiscoverTrending} disabled={discoveryPending}>
            <Sparkles className="h-4 w-4 mr-2" /> ✦ Descubrir Trending
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/admin/destinations/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Destino</Link>
          </Button>
        </div>
      </div>

      {showDiscoveryPanel && (
        <section className="mb-8 rounded-xl border border-border bg-card/40 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-serif text-2xl text-foreground">Sugerencias IA en Tendencia</h2>
            {discoveryPending && <Badge variant="outline" className="text-primary border-primary/30">{discoveryStatuses[statusIndex]}</Badge>}
          </div>
          {discoveryError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium mb-3">No pudimos descubrir destinos en este momento. Intenta de nuevo.</p>
              <Button type="button" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/20" onClick={handleDiscoverTrending} disabled={discoveryPending}>Reintentar</Button>
            </div>
          )}
          {!discoveryPending && !discoveryError && discoveryData?.candidates?.length === 0 && (
            <p className="text-sm text-muted-foreground">No encontramos candidatos nuevos por ahora. Prueba de nuevo en unos minutos.</p>
          )}
          {discoveryData?.candidates && discoveryData.candidates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {discoveryData.candidates.map((candidate) => (
                <TrendingDestinationCard key={`${candidate.suggested_slug}-${candidate.title}`} candidate={candidate} />
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por título o país…" className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">Mostrando {filtered.length} de {items.length}</p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader label="Título" sortKey="title" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="País" sortKey="country" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Dificultad" sortKey="difficulty_level" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Publicado</TableHead>
              <SortableHeader label="Creado" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Actualizado" sortKey="updated_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <AdminEmptyState
                    icon={MapPin}
                    title="Aún no hay destinos"
                    description="Crea tu primer destino para comenzar a construir tu catálogo."
                    cta={{ label: "Crea tu primer destino", href: "/admin/destinations/new" }}
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro término de búsqueda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((d) => (
                <TableRow key={d.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{d.title}</TableCell>
                  <TableCell className="text-muted-foreground">{d.country}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-foreground border-border">
                      {difficultyLabel[d.difficulty_level ?? ""] ?? d.difficulty_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={d.is_published ?? false} onCheckedChange={() => handleTogglePublish(d.id, d.is_published ?? false)} aria-label={d.is_published ? "Publicado" : "Borrador"} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(d.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(d.updated_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" aria-label={`Editar destino ${d.title}`} title={`Editar destino ${d.title}`}>
                        <Link to={`/admin/destinations/${d.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar destino ${d.title}`} title={`Eliminar destino ${d.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar destino?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{d.title}</strong>.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(d.id)}>Eliminar</AlertDialogAction>
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
      <AdminPagination page={page} pageCount={pageCount} total={sorted.length} onPageChange={setPage} />
    </div>
  );
};

export default AdminDestinations;
