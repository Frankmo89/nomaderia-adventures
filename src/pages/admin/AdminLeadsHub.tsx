import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLeads from "./AdminLeads";
import AdminQuizResponses from "./AdminQuizResponses";
import AdminItineraryRequests from "./AdminItineraryRequests";
import AdminPermitAlerts from "./AdminPermitAlerts";

// Bandeja unificada de leads — 4 tabs, cada uno envuelve la página existente
// tal cual (mismo patrón que AdminCorreos.tsx). "Alertas" (sentinel_leads) no
// tiene tab propio: era 100% redundante con lo que ya muestra "Todos" — su
// único valor agregado (export CSV) se migró directamente a AdminLeads.tsx.
// Sin <h1> propio aquí: AdminLeads.tsx (tab "Todos", el default) ya renderiza
// su propio "Leads" — un segundo encabezado idéntico arriba sería redundante.
const TABS = ["todos", "quiz", "solicitudes", "alertas-permiso"] as const;
type TabValue = (typeof TABS)[number];

const isTabValue = (v: string | null): v is TabValue =>
  v !== null && (TABS as readonly string[]).includes(v);

const AdminLeadsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabValue = isTabValue(searchParams.get("tab")) ? (searchParams.get("tab") as TabValue) : "todos";

  const handleTabChange = (value: string) => {
    if (value === "todos") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  return (
    <div>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="alertas-permiso">Alertas de Permiso</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <AdminLeads />
        </TabsContent>
        <TabsContent value="quiz">
          <AdminQuizResponses />
        </TabsContent>
        <TabsContent value="solicitudes">
          <AdminItineraryRequests />
        </TabsContent>
        <TabsContent value="alertas-permiso">
          <AdminPermitAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLeadsHub;
