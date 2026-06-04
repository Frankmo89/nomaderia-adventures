import { useEffect, useState, useMemo } from "react";
import { Download, Search, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Sub = Tables<"newsletter_subscribers">;
type SubSortKey = "email" | "created_at" | "source";

interface DripLog {
  email: string;
  email_type: string;
  sent_at: string;
  status: string;
}

const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  sentinel: "Alerta de Permisos",
  itinerary: "Itinerario",
};

const dripTypeLabels: Record<string, string> = {
  quiz_results: "Resultados del quiz",
  gear_guide: "Guía de equipo",
  itinerary_cta: "CTA de itinerario",
};

const SOURCE_CHIP_COLORS: Record<string, string> = {
  quiz: "bg-primary/15 text-primary border-primary/25",
  sentinel: "bg-amber-700/20 text-amber-400 border-amber-700/30",
  itinerary: "bg-secondary/15 text-secondary border-secondary/25",
};

const SOURCE_ORDER = ["quiz", "sentinel", "itinerary"];

const getSubValue = (s: Sub, key: SubSortKey): string => {
  switch (key) {
    case "email": return s.email;
    case "created_at": return s.created_at;
    case "source": return s.source ?? "";
  }
};

const exportCSV = (items: Sub[]) => {
  const headers = ["Email", "Fuente", "Fecha"];
  const rows = items.map((s) => [
    s.email,
    sourceLabels[s.source ?? ""] || s.source || "",
    new Date(s.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const COL_COUNT = 4;

const AdminSubscribers = () => {
  const [items, setItems] = useState<Sub[]>([]);
  const [dripLogs, setDripLogs] = useState<DripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { sortState, handleSort } = useSortable<SubSortKey>();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((s) => s.email.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getSubValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  // Map email → drip logs (sorted desc by sent_at, i.e. first = latest)
  const dripByEmail = useMemo(() => {
    const map = new Map<string, DripLog[]>();
    for (const log of dripLogs) {
      const existing = map.get(log.email) ?? [];
      existing.push(log);
      map.set(log.email, existing);
    }
    return map;
  }, [dripLogs]);

  // Count subscribers per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of items) {
      const src = s.source || "otro";
      counts[src] = (counts[src] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const sourceBreakdown = useMemo(
    () =>
      Object.entries(sourceCounts).sort(([a], [b]) => {
        const ai = SOURCE_ORDER.indexOf(a);
        const bi = SOURCE_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }),
    [sourceCounts]
  );

  useEffect(() => {
    const load = async () => {
      const [subsResult, dripResult] = await Promise.all([
        supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
        supabase
          .from("email_drip_log" as never)
          .select("email, email_type, sent_at, status")
          .order("sent_at", { ascending: false }),
      ]);
      setItems((subsResult.data as Sub[]) || []);
      setDripLogs((dripResult.data as DripLog[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Suscriptores</h1>
          {!loading && <p className="text-sm text-muted-foreground mt-1">{items.length} suscriptor{items.length !== 1 ? "es" : ""}</p>}
        </div>
        {items.length > 0 && (
          <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => exportCSV(items)}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        )}
      </div>

      {/* Source breakdown */}
      {!loading && sourceBreakdown.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {sourceBreakdown.map(([src, count]) => (
            <div
              key={src}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${SOURCE_CHIP_COLORS[src] ?? "bg-stone-800 text-stone-300 border-stone-700"}`}
            >
              <span>{sourceLabels[src] || src}</span>
              <span className="opacity-70">{count}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por correo…"
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">Mostrando {filtered.length} de {items.length}</p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader label="Email" sortKey="email" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fuente" sortKey="source" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fecha" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-muted-foreground">Drip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Users}
                    title="Aún no hay suscriptores"
                    description="Los correos capturados a través del quiz y las landings aparecerán aquí."
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro correo electrónico."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((s) => {
                const subLogs = dripByEmail.get(s.email) ?? [];
                const lastLog = subLogs[0]; // already sorted desc
                return (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="text-foreground">{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sourceLabels[s.source ?? ""] || s.source || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      {subLogs.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500/80">
                          <Clock className="h-3 w-3 shrink-0" />
                          Aún sin enviar
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {dripTypeLabels[lastLog.email_type] || lastLog.email_type}
                          <span className="ml-1 opacity-60">
                            · {new Date(lastLog.sent_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination page={page} pageCount={pageCount} total={sorted.length} onPageChange={setPage} />
    </div>
  );
};

export default AdminSubscribers;
