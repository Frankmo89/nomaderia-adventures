import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type QuizResponse = Tables<"quiz_responses">;

const exportCSV = (items: QuizResponse[]) => {
  const headers = ["Email", "Interés", "Fitness", "Duración", "Estilo", "Fecha"];
  const rows = items.map((r) => [
    r.email || "",
    r.interest || "",
    r.fitness_level || "",
    r.trip_duration || "",
    r.travel_style || "",
    new Date(r.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiz-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminQuizResponses = () => {
  const [items, setItems] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("quiz_responses").select("*").order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Quiz Responses</h1>
          {!loading && <p className="text-sm text-muted-foreground mt-1">{items.length} respuesta{items.length !== 1 ? "s" : ""}</p>}
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
              <TableHead className="text-foreground">Interés</TableHead>
              <TableHead className="text-foreground">Fitness</TableHead>
              <TableHead className="text-foreground">Duración</TableHead>
              <TableHead className="text-foreground">Estilo</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No hay respuestas del quiz todavía.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="text-foreground">{r.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.interest || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.fitness_level || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.trip_duration || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.travel_style || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-MX")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminQuizResponses;
