import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Map, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ContentV1 } from "@/components/admin/ItineraryBlockEditor";

type ClientRow = Tables<"client_itineraries"> & {
  itinerary_templates: {
    destinations: { title: string } | null;
  } | null;
};

type CISortKey = "client_name" | "status" | "trip_start" | "updated_at";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  borrador:     { label: "Borrador",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  entregado:    { label: "Entregado",  className: "bg-green-100  text-green-800  border-green-200"  },
  viaje_activo: { label: "En viaje",   className: "bg-blue-100   text-blue-800   border-blue-200"   },
  completado:   { label: "Completado", className: "bg-gray-100   text-gray-700   border-gray-200"   },
  archivado:    { label: "Archivado",  className: "bg-stone-100  text-stone-600  border-stone-200"  },
};

function getPark(row: ClientRow): string {
  const c = row.content as unknown as ContentV1 | null;
  if (c?.parque) return c.parque;
  return row.itinerary_templates?.destinations?.title ?? "—";
}

function formatDates(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}

const getCIValue = (r: ClientRow, key: CISortKey): string => {
  switch (key) {
    case "client_name": return r.client_name;
    case "status":      return r.status;
    case "trip_start":  return r.trip_start ?? "";
    case "updated_at":  return r.updated_at;
  }
};

const COL_COUNT = 6;

const AdminClientItineraries = () => {
  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { sortState, handleSort } = useSortable<CISortKey>();

  useEffect(() => {
    supabase
      .from("client_itineraries")
      .select("*, itinerary_templates(destinations(title))")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as ClientRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((r) =>
        `${r.client_name} ${r.client_email ?? ""} ${getPark(r)}`.toLowerCase().includes(q)
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
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/admin/client-itineraries/new">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Itinerario
          </Link>
        </Button>
      </div>

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, email o parque…"
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
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Map}
                    title="Aún no hay itinerarios de clientes"
                    description="Crea el primer itinerario personalizado para un cliente."
                    cta={{ label: "Nuevo Itinerario", href: "/admin/client-itineraries/new" }}
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
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/client-itineraries/${r.id}`}>
                          <Pencil className="h-4 w-4 mr-1.5" /> Editar
                        </Link>
                      </Button>
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
    </div>
  );
};

export default AdminClientItineraries;
