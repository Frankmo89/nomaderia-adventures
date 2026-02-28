import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface EmailLog {
  id: string;
  email: string;
  email_type: string;
  sent_at: string;
  status: string;
  error_message: string | null;
}

const typeLabels: Record<string, string> = {
  quiz_results: "Quiz",
  gear_guide: "Gear Guide",
  itinerary_cta: "Itinerario CTA",
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

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as unknown as { from: (t: string) => { select: (q: string) => { order: (col: string, opts: object) => Promise<{ data: EmailLog[] | null }> } } })
        .from("email_drip_log")
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

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Tipo</TableHead>
              <TableHead className="text-foreground">Estado</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
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
            ) : (
              items.map((l) => (
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
