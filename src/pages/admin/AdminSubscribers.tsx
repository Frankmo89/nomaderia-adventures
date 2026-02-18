import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Sub = Tables<"newsletter_subscribers">;

const exportCSV = (items: Sub[]) => {
  const headers = ["Email", "Fuente", "Fecha"];
  const rows = items.map((s) => [
    s.email,
    s.source || "",
    new Date(s.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminSubscribers = () => {
  const [items, setItems] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      setItems(data || []);
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

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Fuente</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  No hay suscriptores todavía.
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.id} className="border-border">
                  <TableCell className="text-foreground">{s.email}</TableCell>
                  <TableCell className="text-muted-foreground">{s.source || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString("es-MX")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSubscribers;
