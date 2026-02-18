import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ItineraryRequest {
  id: string;
  name: string;
  email: string;
  destination: string;
  estimated_budget: string | null;
  message: string | null;
  created_at: string;
}

const budgetLabel: Record<string, string> = {
  "menos-de-500": "< $500",
  "500-1000": "$500–$1,000",
  "1000-2500": "$1,000–$2,500",
  "2500-5000": "$2,500–$5,000",
  "mas-de-5000": "> $5,000",
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

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
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
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
            onClick={() => exportCSV(items)}
          >
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Nombre</TableHead>
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Destino</TableHead>
              <TableHead className="text-foreground">Presupuesto</TableHead>
              <TableHead className="text-foreground">Mensaje</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No hay solicitudes todavía.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
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
                    <span className="line-clamp-2 text-sm">{r.message || "—"}</span>
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
    </div>
  );
};

export default AdminItineraryRequests;
