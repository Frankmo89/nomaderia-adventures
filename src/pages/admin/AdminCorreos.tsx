import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSubscribers from "./AdminSubscribers";
import AdminEmailLogs from "./AdminEmailLogs";

// Suscriptores + Logs de Envío fusionados en una sola página con tabs.
// Los dos componentes internos no se tocan — solo se envuelven aquí.
const AdminCorreos = () => {
  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-6">Correos</h1>
      <Tabs defaultValue="suscriptores">
        <TabsList>
          <TabsTrigger value="suscriptores">Suscriptores</TabsTrigger>
          <TabsTrigger value="logs">Logs de Envío</TabsTrigger>
        </TabsList>
        <TabsContent value="suscriptores">
          <AdminSubscribers />
        </TabsContent>
        <TabsContent value="logs">
          <AdminEmailLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCorreos;
