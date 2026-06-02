import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PermitAlertStatus = "active" | "notified" | "expired";
type PermitAlertStatusFilter = "all" | PermitAlertStatus;

interface PermitAlertRow {
  id: string;
  email: string;
  park: string;
  permit_name: string;
  target_year: number;
  status: PermitAlertStatus;
  created_at: string;
}

const statusOptions: Array<{ value: PermitAlertStatus; label: string }> = [
  { value: "active", label: "Activa" },
  { value: "notified", label: "Notificada" },
  { value: "expired", label: "Expirada" },
];

function getStatusLabel(status: PermitAlertStatus): string {
  const match = statusOptions.find((item) => item.value === status);
  return match ? match.label : status;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AdminPermitAlerts = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<PermitAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PermitAlertStatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    let query = supabase
      .from("permit_alerts")
      .select("id, email, park, permit_name, target_year, status, created_at")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error al cargar alertas",
        description: error.message,
        variant: "destructive",
      });
      setItems([]);
    } else {
      setItems((data || []) as PermitAlertRow[]);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, nextStatus: PermitAlertStatus) => {
    setUpdatingId(id);

    const { error } = await supabase
      .from("permit_alerts")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "No se pudo actualizar el estado",
        description: error.message,
        variant: "destructive",
      });
      setUpdatingId(null);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    setUpdatingId(null);
    toast({ title: "Estado actualizado" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Alertas de Permiso</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra alertas capturadas después de la compra y su seguimiento manual.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => load(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {refreshing ? "Recargando..." : "Recargar"}
        </Button>
      </div>

      <Card className="border-border/60 bg-background">
        <CardContent className="p-4 md:p-5">
          <p className="text-sm text-muted-foreground">
            Nota: antes de enviar una notificación, valida el email contra Stripe para confirmar que el cobro manual sí está registrado.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="status-filter" className="text-foreground">Filtrar por estado</Label>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PermitAlertStatusFilter)}>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-border/70">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card className="border-border/70">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No hay alertas para este filtro.
            </CardContent>
          </Card>
        ) : (
          items.map((alert) => (
            <Card key={alert.id} className="border-border/70">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm text-foreground break-all">{alert.email}</p>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    {alert.target_year}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="text-foreground">Parque:</span> {alert.park}</p>
                  <p><span className="text-foreground">Permiso:</span> {alert.permit_name}</p>
                  <p><span className="text-foreground">Creada:</span> {formatDate(alert.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`mobile-status-${alert.id}`} className="text-foreground">Estado</Label>
                  <Select
                    value={alert.status}
                    onValueChange={(value) => handleStatusChange(alert.id, value as PermitAlertStatus)}
                    disabled={updatingId === alert.id}
                  >
                    <SelectTrigger id={`mobile-status-${alert.id}`}>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="hidden md:block rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Parque</TableHead>
              <TableHead className="text-foreground">Permiso</TableHead>
              <TableHead className="text-foreground">Año</TableHead>
              <TableHead className="text-foreground">Estado</TableHead>
              <TableHead className="text-foreground">Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No hay alertas para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              items.map((alert) => (
                <TableRow key={alert.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{alert.email}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.park}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.permit_name}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.target_year}</TableCell>
                  <TableCell>
                    <Select
                      value={alert.status}
                      onValueChange={(value) => handleStatusChange(alert.id, value as PermitAlertStatus)}
                      disabled={updatingId === alert.id}
                    >
                      <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(alert.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          Mostrando {items.length} alerta{items.length !== 1 ? "s" : ""} {statusFilter === "all" ? "en total" : `con estado ${getStatusLabel(statusFilter)}` }.
        </p>
      )}
    </div>
  );
};

export default AdminPermitAlerts;
