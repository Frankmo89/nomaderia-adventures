import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Search, MessageCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import LeadStatusBadge from "@/components/admin/LeadStatusBadge";
import type { LeadStatus, LeadTable } from "@/components/admin/LeadStatusBadge";
import { STATUS_CONFIG } from "@/components/admin/LeadStatusBadge";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface UnifiedLead {
  id: string;        // prefixed key: s-{uuid} | q-{uuid} | i-{uuid}
  dbId: string;      // real DB uuid
  email: string;
  name?: string;
  source: "sentinel" | "quiz" | "itinerary";
  destination?: string;
  createdAt: string;
  status: LeadStatus;
  contactedAt: string | null;
}

type LeadSortKey = "email" | "source" | "destination" | "createdAt" | "status";

const COL_COUNT = 7;

const db = supabase as unknown as SupabaseClient;

const SOURCE_CONFIG = {
  sentinel: { label: "Alerta",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  quiz:     { label: "Quiz",       cls: "bg-stone-700 text-stone-300 border-stone-600" },
  itinerary:{ label: "Itinerario", cls: "bg-green-900/50 text-green-400 border-green-700/50" },
} as const;

const SOURCE_TABLE: Record<UnifiedLead["source"], LeadTable> = {
  sentinel:  "sentinel_leads",
  quiz:      "quiz_responses",
  itinerary: "itinerary_requests",
};

const relDate = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1d";
  if (days < 7) return `hace ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks}sem`;
  return `hace ${Math.floor(days / 30)}mes`;
};

const fmtSlug = (slug: string): string =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const buildWaMessage = (lead: UnifiedLead): string => {
  if (lead.source === "sentinel")
    return `Hola, vi que te interesaste en la alerta de permisos de Yosemite. ¿Tienes dudas? Con gusto te ayudo. — Frank, Nomaderia`;
  if (lead.source === "quiz")
    return lead.destination
      ? `Hola, vi que te recomendamos ${lead.destination}. ¿Te ayudo a planear tu viaje? — Frank, Nomaderia`
      : `Hola, completaste el quiz de Nomaderia. ¿Te ayudo a planear tu próxima aventura? — Frank, Nomaderia`;
  return `Hola ${lead.name ?? ""}, recibí tu solicitud para ${lead.destination ?? "un itinerario"}. ¿Platicamos? — Frank, Nomaderia`;
};

const getLeadValue = (lead: UnifiedLead, key: LeadSortKey): string => {
  switch (key) {
    case "email":       return lead.email;
    case "source":      return lead.source;
    case "destination": return lead.destination ?? "";
    case "createdAt":   return lead.createdAt;
    case "status":      return lead.status;
  }
};

const AdminLeads = () => {
  const [items, setItems] = useState<UnifiedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { sortState, handleSort } = useSortable<LeadSortKey>();

  useEffect(() => {
    const load = async () => {
      const [sentinelRes, quizRes, itinRes] = await Promise.all([
        db
          .from("sentinel_leads")
          .select("id, email, source, created_at, status, contacted_at")
          .order("created_at", { ascending: false }),
        db
          .from("quiz_responses")
          .select("id, email, recommended_destinations, created_at, status, contacted_at")
          .not("email", "is", null)
          .order("created_at", { ascending: false }),
        db
          .from("itinerary_requests")
          .select("id, name, email, destination, created_at, status, contacted_at")
          .order("created_at", { ascending: false }),
      ]);

      type SentinelRow = { id: string; email: string; source: string | null; created_at: string; status: LeadStatus; contacted_at: string | null };
      type QuizRow     = { id: string; email: string | null; recommended_destinations: string[] | null; created_at: string; status: LeadStatus; contacted_at: string | null };
      type ItinRow     = { id: string; name: string; email: string; destination: string; created_at: string; status: LeadStatus; contacted_at: string | null };

      const sentinelLeads: UnifiedLead[] = ((sentinelRes.data ?? []) as SentinelRow[]).map((r) => ({
        id: `s-${r.id}`,
        dbId: r.id,
        email: r.email,
        source: "sentinel",
        createdAt: r.created_at,
        status: r.status,
        contactedAt: r.contacted_at,
      }));

      const quizLeads: UnifiedLead[] = ((quizRes.data ?? []) as QuizRow[]).flatMap((r) =>
        r.email
          ? [{
              id: `q-${r.id}`,
              dbId: r.id,
              email: r.email,
              source: "quiz" as const,
              destination: r.recommended_destinations?.[0]
                ? fmtSlug(r.recommended_destinations[0])
                : undefined,
              createdAt: r.created_at,
              status: r.status,
              contactedAt: r.contacted_at,
            }]
          : []
      );

      const itinLeads: UnifiedLead[] = ((itinRes.data ?? []) as ItinRow[]).map((r) => ({
        id: `i-${r.id}`,
        dbId: r.id,
        email: r.email,
        name: r.name,
        source: "itinerary",
        destination: r.destination,
        createdAt: r.created_at,
        status: r.status,
        contactedAt: r.contacted_at,
      }));

      const merged = [...sentinelLeads, ...quizLeads, ...itinLeads].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(merged);
      setLoading(false);
    };
    load();
  }, []);

  const handleStatusUpdate = (id: string, newStatus: LeadStatus) => {
    setItems((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          status: newStatus,
          contactedAt:
            newStatus === "contactado"
              ? (l.contactedAt ?? new Date().toISOString())
              : newStatus === "nuevo"
              ? null
              : l.contactedAt,
        };
      })
    );
  };

  const handleWhatsApp = (lead: UnifiedLead) => {
    if (lead.status === "nuevo") {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: "contactado", contactedAt: now } : l))
      );
      db.from(SOURCE_TABLE[lead.source])
        .update({ status: "contactado", contacted_at: now })
        .eq("id", lead.dbId)
        .then(({ error }) => {
          if (error) console.warn("[WA] status update failed:", error.message);
        });
    }
    window.open(
      buildWhatsAppLink(buildWaMessage(lead)),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const totalLeads    = items.length;
  const recentLeads   = items.filter((l) => new Date(l.createdAt).getTime() >= sevenDaysAgo).length;
  const sentinelCount = items.filter((l) => l.source === "sentinel").length;
  const quizCount     = items.filter((l) => l.source === "quiz").length;
  const itinCount     = items.filter((l) => l.source === "itinerary").length;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (l) =>
          l.email.toLowerCase().includes(q) ||
          (l.destination ?? "").toLowerCase().includes(q)
      )
    : items;
  const sorted    = applySortable(filtered, sortState, getLeadValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged     = sorted.slice((page - 1) * 25, page * 25);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-foreground">Leads</h1>
        {!loading && (
          <p className="text-sm text-muted-foreground mt-1">
            Bandeja unificada · {totalLeads} lead{totalLeads !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total leads</p>
              <p className="text-3xl font-bold text-foreground">{totalLeads}</p>
              <p className="text-xs text-muted-foreground mt-1">todos los tiempos</p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Últimos 7 días</p>
              <p className="text-3xl font-bold text-foreground">{recentLeads}</p>
              <p className="text-xs text-muted-foreground mt-1">leads recientes</p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Por fuente</p>
              <div className="flex flex-col gap-1.5">
                {(["sentinel", "quiz", "itinerary"] as const).map((src) => {
                  const cfg = SOURCE_CONFIG[src];
                  const count = src === "sentinel" ? sentinelCount : src === "quiz" ? quizCount : itinCount;
                  return (
                    <div key={src} className="flex items-center justify-between">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", cfg.cls)}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inline search */}
      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por correo o destino…"
              className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            Mostrando {filtered.length} de {items.length}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground w-12" />
              <SortableHeader label="Email"   sortKey="email"       activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fuente"  sortKey="source"      activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Estado"  sortKey="status"      activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Destino" sortKey="destination" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fecha"   sortKey="createdAt"   activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Inbox}
                    title="Bandeja vacía"
                    description="Los leads de Alerta, Quiz e Itinerario aparecerán aquí en cuanto lleguen."
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro correo o destino."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((lead) => {
                const srcCfg    = SOURCE_CONFIG[lead.source];
                const statusCfg = STATUS_CONFIG[lead.status];
                return (
                  <TableRow key={lead.id} className="border-border">
                    <TableCell>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        lead.status === "convertido"
                          ? "bg-green-900/50 text-green-300"
                          : lead.status === "contactado"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-stone-800 text-stone-300"
                      )}>
                        {lead.email.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-sm">{lead.email}</span>
                        {lead.name && (
                          <span className="text-xs text-muted-foreground">{lead.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", srcCfg.cls)}>
                        {srcCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge
                        id={lead.dbId}
                        table={SOURCE_TABLE[lead.source]}
                        status={lead.status}
                        onUpdate={(newStatus) => handleStatusUpdate(lead.id, newStatus)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.destination ?? <span className="text-stone-600">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {relDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs"
                        onClick={() => handleWhatsApp(lead)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        WA
                      </Button>
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

export default AdminLeads;
