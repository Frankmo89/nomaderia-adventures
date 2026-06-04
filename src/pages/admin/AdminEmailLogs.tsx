import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";

interface EmailLog {
  id: string;
  email: string;
  email_type: string;
  sent_at: string;
  status: string;
  error_message: string | null;
}

type EmailLogSortKey = "email" | "email_type" | "status" | "sent_at";

const typeLabels: Record<string, string> = {
  quiz_results: "Quiz",
  gear_guide: "Guía de Equipo",
  itinerary_cta: "Itinerario CTA",
};

const getEmailLogValue = (l: EmailLog, key: EmailLogSortKey): string => {
  switch (key) {
    case "email": return l.email;
    case "email_type": return l.email_type;
    case "status": return l.status;
    case "sent_at": return l.sent_at;
  }
};

const exportCSV = (items: EmailLog[]) => {
  const headers = ["Email", "Tipo", "Estado", "Fecha", "Error"];
  const rows = items.map((l) => [
    l.email,
    typeLabels[l.email_type] || l.email_type,
    l.status,
    new Date(l.sent_at).toLocaleDateString("es-MX"),
    l.error_message || "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `email-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    quiz_results: "bg-primary/20 text-primary border-primary/30",
    gear_guide: "bg-secondary/20 text-secondary border-secondary/30",
    itinerary_cta: "bg-accent/20 text-accent border-accent/30",
  };
  return (
    <Badge variant="outline" className={colors[type] || "border-border text-foreground"}>
      {typeLabels[type] || type}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "sent") {
    return <Badge className="bg-green-700/30 text-green-400 border-green-700/40 border">Enviado</Badge>;
  }
  return <Badge className="bg-red-700/30 text-red-400 border-red-700/40 border">Fallido</Badge>;
};

const AdminEmailLogs = () => {
  const [items, setItems] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { sortState, handleSort } = useSortable<EmailLogSortKey>();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((l) => l.email.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getEmailLogValue);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from<EmailLog>("email_drip_log")
        .select("*")
        .order("sent_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Email Logs</h1>
          {!loading && <p className="text-sm text-muted-foreground mt-1">{items.length} email{items.length !== 1 ? "s" : ""} enviado{items.length !== 1 ? "s" : ""}</p>}
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por correo…" className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">Mostrando {filtered.length} de {items.length}</p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader label="Email" sortKey="email" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Tipo" sortKey="email_type" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Estado" sortKey="status" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fecha" sortKey="sent_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No hay emails enviados todavía.
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Sin resultados para esta búsqueda.</TableCell>
              </TableRow>
            ) : (
              sorted.map((l) => (
                <TableRow key={l.id} className="border-border">
                  <TableCell className="text-foreground">{l.email}</TableCell>
                  <TableCell><TypeBadge type={l.email_type} /></TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(l.sent_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
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

export default AdminEmailLogs;
