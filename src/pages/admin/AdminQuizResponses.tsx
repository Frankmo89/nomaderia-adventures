import { useEffect, useState } from "react";
import { Download, Search, ClipboardList, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type QuizResponse = Tables<"quiz_responses">;

type QuizSortKey = "created_at" | "fitness_level" | "budget_range" | "recommended_destinations";

const COL_COUNT = 10;

const fitnessLabels: Record<string, string> = {
  sedentary: "🚶 Sedentario",
  light_activity: "🏃 Activo casual",
  moderate: "💪 Regular",
  active: "🔥 Muy activo",
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
// Legacy raw keys are mapped to friendly labels — any unrecognised key falls back to raw value (see pending-tasks).
const originLabels: Record<string, string> = {
  tijuana_baja: "🇲🇽 Tijuana/Baja", sandiego_socal: "🇺🇸 San Diego/SoCal", cdmx: "🇲🇽 CDMX",
  resto_mx: "🇲🇽 Resto MX", resto_usa: "🇺🇸 Resto USA", otro: "🌎 Otro",
  mx_border: "🇲🇽 Frontera MX", mx_center: "🇲🇽 Centro MX",
  mx_south: "🇲🇽 Sur MX", us_southwest: "🇺🇸 Suroeste USA",
  us_other: "🇺🇸 Resto USA", spain: "🇪🇸 España",
  south_america: "🌎 Sudamérica", other: "🌎 Otro",
};
const barrierLabels: Record<string, string> = {
  lack_info: "🗺️ Falta Info", fitness_doubt: "❤️ Condición", no_gear: "🎒 Equipo", comfort: "⛺ Comodidad",
};

const fmtSlug = (slug: string): string =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const getQuizValue = (r: QuizResponse, key: QuizSortKey): string => {
  switch (key) {
    case "created_at": return r.created_at;
    case "fitness_level": return r.fitness_level ?? "";
    case "budget_range": return r.budget_range ?? "";
    case "recommended_destinations": return r.recommended_destinations?.[0] ?? "";
  }
};

const exportCSV = (items: QuizResponse[]) => {
  const headers = ["Email", "Fitness", "Paisaje", "Duración", "Presupuesto", "Origen", "Barrera", "Recomendado", "Fecha"];
  const rows = items.map((r) => [
    r.email || "",
    fitnessLabels[r.fitness_level || ""] || r.fitness_level || "",
    interestLabels[r.interest || ""] || r.interest || "",
    durationLabels[r.trip_duration || ""] || r.trip_duration || "",
    budgetLabels[r.budget_range || ""] || r.budget_range || "",
    originLabels[r.travel_style || ""] || r.travel_style || "",
    barrierLabels[r.main_barrier || ""] || r.main_barrier || "",
    (r.recommended_destinations ?? []).map(fmtSlug).join(", "),
    new Date(r.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiz-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-stone-800 border border-stone-700 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
    )}
  >
    {label}
  </button>
);

const AdminQuizResponses = () => {
  const [items, setItems] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fitnessFilter, setFitnessFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [page, setPage] = useState(1);
  const { sortState, handleSort } = useSortable<QuizSortKey>();

  // Pipeline: email search → fitness filter → budget filter → sort → paginate
  const q = search.trim().toLowerCase();
  const byEmail = q ? items.filter((r) => (r.email ?? "").toLowerCase().includes(q)) : items;
  const byFitness = fitnessFilter ? byEmail.filter((r) => r.fitness_level === fitnessFilter) : byEmail;
  const filtered = budgetFilter ? byFitness.filter((r) => r.budget_range === budgetFilter) : byFitness;
  const sorted = applySortable(filtered, sortState, getQuizValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

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

      {!loading && items.length > 0 && (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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

          <div className="mb-4 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-stone-500 w-20 shrink-0">Fitness:</span>
              <Chip label="Todos" active={!fitnessFilter} onClick={() => { setFitnessFilter(""); setPage(1); }} />
              {Object.entries(fitnessLabels).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={fitnessFilter === key}
                  onClick={() => { setFitnessFilter(fitnessFilter === key ? "" : key); setPage(1); }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-stone-500 w-20 shrink-0">Presupuesto:</span>
              <Chip label="Todos" active={!budgetFilter} onClick={() => { setBudgetFilter(""); setPage(1); }} />
              {Object.entries(budgetLabels).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={budgetFilter === key}
                  onClick={() => { setBudgetFilter(budgetFilter === key ? "" : key); setPage(1); }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <SortableHeader label="Fitness" sortKey="fitness_level" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Paisaje</TableHead>
              <TableHead className="text-foreground">Duración</TableHead>
              <SortableHeader label="Presupuesto" sortKey="budget_range" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Origen</TableHead>
              <TableHead className="text-foreground">Barrera</TableHead>
              <SortableHeader label="Recomendado" sortKey="recommended_destinations" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Acción</TableHead>
              <SortableHeader label="Fecha" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: COL_COUNT }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={ClipboardList}
                    title="Todavía nadie ha completado el quiz"
                    description="Cuando alguien complete el quiz, sus respuestas aparecerán aquí."
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={q ? `Sin resultados para "${search}"` : "Sin resultados para el filtro seleccionado"}
                    description="Prueba ajustando los filtros o el término de búsqueda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((r) => {
                const dests = r.recommended_destinations ?? [];
                const firstDest = dests[0];
                const extraCount = dests.length - 1;
                const waMessage = firstDest
                  ? `Hola, vi que te recomendamos ${fmtSlug(firstDest)}. ¿Te ayudo a planear tu viaje? 🏔️ — Frank, Nomaderia`
                  : `Hola, vi que completaste el quiz de Nomaderia. ¿Te ayudo a planear tu próxima aventura? 🏔️ — Frank, Nomaderia`;
                return (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="text-foreground">{r.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fitnessLabels[r.fitness_level || ""] || r.fitness_level || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{interestLabels[r.interest || ""] || r.interest || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{durationLabels[r.trip_duration || ""] || r.trip_duration || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{budgetLabels[r.budget_range || ""] || r.budget_range || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{originLabels[r.travel_style || ""] || r.travel_style || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{barrierLabels[r.main_barrier || ""] || r.main_barrier || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {firstDest ? (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <span className="text-sm">{fmtSlug(firstDest)}</span>
                          {extraCount > 0 && (
                            <Badge variant="outline" className="text-xs border-stone-700 text-stone-500 px-1.5 py-0">
                              +{extraCount}
                            </Badge>
                          )}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.email ? (
                        <Button
                          size="sm"
                          className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs"
                          onClick={() => window.open(buildWhatsAppLink(waMessage), "_blank", "noopener,noreferrer")}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          WA
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("es-MX")}
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

export default AdminQuizResponses;
