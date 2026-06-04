import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Sub = Tables<"newsletter_subscribers">;

type SubSortKey = "email" | "created_at" | "source";

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
  const [search, setSearch] = useState("");
  const { sortState, handleSort } = useSortable<SubSortKey>();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((s) => s.email.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getSubValue);

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
              <SortableHeader label="Fuente" sortKey="source" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Fecha" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
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
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Sin resultados para esta búsqueda.</TableCell>
              </TableRow>
            ) : (
              sorted.map((s) => (
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
