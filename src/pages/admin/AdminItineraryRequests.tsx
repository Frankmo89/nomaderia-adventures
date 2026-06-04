import { useEffect, useState } from "react";
import { Download, Search, Map, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface ItineraryRequest {
  id: string;
  name: string;
  email: string;
  destination: string;
  estimated_budget: string | null;
  message: string | null;
  created_at: string;
}

type ItinSortKey = "name" | "destination" | "created_at";

const COL_COUNT = 7;

const budgetLabel: Record<string, string> = {
  "menos-de-500": "< $500",
  "500-1000": "$500–$1,000",
  "1000-2500": "$1,000–$2,500",
  "2500-5000": "$2,500–$5,000",
  "mas-de-5000": "> $5,000",
};

const getItinValue = (r: ItineraryRequest, key: ItinSortKey): string => {
  switch (key) {
    case "name": return r.name;
    case "destination": return r.destination;
    case "created_at": return r.created_at;
  }
};

const exportCSV = (items: ItineraryRequest[]) => {
  const headers = ["Nombre", "Email", "Destino", "Presupuesto", "Mensaje", "Fecha"];
  const rows = items.map((r) => [
    r.name,
    r.email,
    r.destination,
    r.estimated_budget ? (budgetLabel[r.estimated_budget] || r.estimated_budget) : "",
    r.message || "",
    new Date(r.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `itinerary-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminItineraryRequests = () => {
  const [items, setItems] = useState<ItineraryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { sortState, handleSort } = useSortable<ItinSortKey>();

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((r) => `${r.name} ${r.email} ${r.destination}`.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getItinValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("itinerary_requests")
        .select("*")
        .order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Solicitudes de Itinerario</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} solicitud{items.length !== 1 ? "es" : ""}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => exportCSV(items)}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre, correo o destino…" className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">Mostrando {filtered.length} de {items.length}</p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader label="Nombre" sortKey="name" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Email</TableHead>
              <SortableHeader label="Destino" sortKey="destination" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Presupuesto</TableHead>
              <TableHead className="text-foreground">Mensaje</TableHead>
              <TableHead className="text-foreground">Acción</TableHead>
              <SortableHeader label="Fecha" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Map}
                    title="Aún no hay solicitudes de itinerario"
                    description="Las solicitudes de itinerario personalizado aparecerán aquí."
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro nombre, correo o destino."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell className="text-muted-foreground">{r.destination}</TableCell>
                  <TableCell>
                    {r.estimated_budget ? (
                      <Badge variant="outline" className="text-foreground border-border text-xs whitespace-nowrap">
                        {budgetLabel[r.estimated_budget] || r.estimated_budget}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">
                    {r.message ? (
                      <div>
                        <span className={cn("text-sm block", !expandedIds.has(r.id) && "line-clamp-2")}>
                          {r.message}
                        </span>
                        {r.message.length > 80 && (
                          <button
                            type="button"
                            className="text-xs text-primary mt-1 hover:underline"
                            onClick={() => toggleExpanded(r.id)}
                          >
                            {expandedIds.has(r.id) ? "Ver menos" : "Ver más"}
                          </button>
                        )}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs"
                      onClick={() =>
                        window.open(
                          buildWhatsAppLink(
                            `Hola ${r.name}, recibí tu solicitud para ${r.destination}. ¿Platicamos? — Frank, Nomaderia`
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WA
                    </Button>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("es-MX")}
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

export default AdminItineraryRequests;
