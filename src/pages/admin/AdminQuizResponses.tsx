import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type QuizResponse = Tables<"quiz_responses">;

const fitnessLabels: Record<string, string> = {
  sedentary: "🚶 Sedentario", light_activity: "🏃 Activo casual", moderate: "💪 Regular", active: "🔥 Muy activo",
};
const interestLabels: Record<string, string> = {
  mountains: "🏔️ Montañas", forests: "🌲 Bosques", deserts: "🏜️ Desiertos", cultural: "🏛️ Cultural",
};
const durationLabels: Record<string, string> = {
  weekend: "⚡ Fin de semana", one_week: "🗓️ Una semana", two_weeks: "🌍 2+ semanas",
};
const budgetLabels: Record<string, string> = {
  low: "🎒 Mochilero", medium: "💰 Balanceado", high: "✨ Cómodo", unlimited: "🚀 Sin límite",
};
const originLabels: Record<string, string> = {
  // New market keys
  tijuana_baja: "🇲🇽 Tijuana/Baja", sandiego_socal: "🇺🇸 San Diego/SoCal", cdmx: "🇲🇽 CDMX",
  resto_mx: "🇲🇽 Resto MX", resto_usa: "🇺🇸 Resto USA", otro: "🌎 Otro",
  // Legacy keys kept for backward compatibility with historical data
  mx_border: "🇲🇽 Frontera MX (Legacy)", mx_center: "🇲🇽 Centro MX (Legacy)",
  mx_south: "🇲🇽 Sur MX (Legacy)", us_southwest: "🇺🇸 Suroeste USA (Legacy)",
  us_other: "🇺🇸 Resto USA (Legacy)", spain: "🇪🇸 España (Legacy)",
  south_america: "🌎 Sudamérica (Legacy)", other: "🌎 Otro (Legacy)",
};

const barrierLabels: Record<string, string> = {
  lack_info: "🗺️ Falta Info", fitness_doubt: "❤️ Condición", no_gear: "🎒 Equipo", comfort: "⛺ Comodidad",
};

const exportCSV = (items: QuizResponse[]) => {
  const headers = ["Email", "Fitness", "Paisaje", "Duración", "Presupuesto", "Origen", "Barrera", "Fecha"];
  const rows = items.map((r) => [
    r.email || "",
    fitnessLabels[r.fitness_level || ""] || r.fitness_level || "",
    interestLabels[r.interest || ""] || r.interest || "",
    durationLabels[r.trip_duration || ""] || r.trip_duration || "",
    budgetLabels[r.budget_range || ""] || r.budget_range || "",
    originLabels[r.travel_style || ""] || r.travel_style || "",
    barrierLabels[r.main_barrier || ""] || r.main_barrier || "",
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
              <TableHead className="text-foreground">Fitness</TableHead>
              <TableHead className="text-foreground">Paisaje</TableHead>
              <TableHead className="text-foreground">Duración</TableHead>
              <TableHead className="text-foreground">Presupuesto</TableHead>
              <TableHead className="text-foreground">Origen</TableHead>
              <TableHead className="text-foreground">Barrera</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay respuestas del quiz todavía.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="text-foreground">{r.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fitnessLabels[r.fitness_level || ""] || r.fitness_level || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{interestLabels[r.interest || ""] || r.interest || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{durationLabels[r.trip_duration || ""] || r.trip_duration || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{budgetLabels[r.budget_range || ""] || r.budget_range || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{originLabels[r.travel_style || ""] || r.travel_style || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{barrierLabels[r.main_barrier || ""] || r.main_barrier || "—"}</TableCell>
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
