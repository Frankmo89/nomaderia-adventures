import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Download, MessageCircle, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import LeadStatusBadge from "@/components/admin/LeadStatusBadge";
import type { LeadStatus } from "@/components/admin/LeadStatusBadge";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackAdminEvent } from "@/lib/admin-tracking";

interface SentinelLead {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
  status: LeadStatus;
  contacted_at: string | null;
}

type LeadSortKey = "email" | "created_at" | "source" | "status";

const COL_COUNT = 5;

const db = supabase as unknown as SupabaseClient;

const lastContactAge = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1d";
  return `hace ${days}d`;
};

const getLeadValue = (lead: SentinelLead, key: LeadSortKey): string => {
  switch (key) {
    case "email":      return lead.email;
    case "created_at": return lead.created_at;
    case "source":     return lead.source ?? "";
    case "status":     return lead.status;
  }
};

const exportCSV = (items: SentinelLead[]) => {
  const headers = ["Email", "Fuente", "Estado", "Fecha"];
  const rows = items.map((s) => [
    s.email,
    s.source || "",
    s.status,
    new Date(s.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sentinel-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminSentinelLeads = () => {
  const [items, setItems] = useState<SentinelLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastContactMap, setLastContactMap] = useState<Record<string, string>>({});
  const { sortState, handleSort } = useSortable<LeadSortKey>();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((lead) => lead.email.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getLeadValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  useEffect(() => {
    const load = async () => {
      const { data } = await db
        .from("sentinel_leads")
        .select("id, email, source, created_at, status, contacted_at")
        .order("created_at", { ascending: false });
      setItems((data as SentinelLead[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    supabase
      .from("admin_events")
      .select("lead_email, created_at")
      .eq("event_type", "whatsapp_click")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const row of (data as Array<{ lead_email: string | null; created_at: string }>)) {
          if (row.lead_email && !map[row.lead_email]) {
            map[row.lead_email] = row.created_at;
          }
        }
        setLastContactMap(map);
      });
  }, []);

  const handleStatusUpdate = (id: string, newStatus: LeadStatus) => {
    setItems((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          status: newStatus,
          contacted_at:
            newStatus === "contactado"
              ? (l.contacted_at ?? new Date().toISOString())
              : newStatus === "nuevo"
              ? null
              : l.contacted_at,
        };
      })
    );
  };

  const handleWhatsApp = (lead: SentinelLead) => {
    if (lead.status === "nuevo") {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: "contactado", contacted_at: now } : l))
      );
      db.from("sentinel_leads")
        .update({ status: "contactado", contacted_at: now })
        .eq("id", lead.id)
        .then(({ error }) => {
          if (error) console.warn("[WA] status update failed:", error.message);
        });
    }
    trackAdminEvent("whatsapp_click", lead.email, "sentinel", { destination: null });
    setLastContactMap((prev) => ({ ...prev, [lead.email]: new Date().toISOString() }));
    window.open(
      buildWhatsAppLink(
        `Hola, vi que te interesaste en la alerta de permisos de Yosemite. ¿Tienes dudas? Con gusto te ayudo. — Frank, Nomaderia`
      ),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Leads de Alerta</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} lead{items.length !== 1 ? "s" : ""} · alerta de permisos Yosemite
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
              <SortableHeader label="Email"  sortKey="email"      activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fuente" sortKey="source"     activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Estado" sortKey="status"     activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fecha"  sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Target}
                    title="Aún no hay leads de Sentinel"
                    description="Los leads de la alerta de permisos de Yosemite aparecerán aquí."
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
              paged.map((lead) => (
                <TableRow key={lead.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{lead.email}</span>
                      {lastContactMap[lead.email] && (
                        <span className="text-[11px] text-stone-500 mt-0.5">
                          Último contacto: {lastContactAge(lastContactMap[lead.email])}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {lead.source || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge
                      id={lead.id}
                      table="sentinel_leads"
                      status={lead.status}
                      onUpdate={(newStatus) => handleStatusUpdate(lead.id, newStatus)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs"
                      onClick={() => handleWhatsApp(lead)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
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

export default AdminSentinelLeads;
