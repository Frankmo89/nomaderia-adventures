import { useEffect, useState } from "react";
import { RefreshCw, Check, X, RotateCcw, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

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
  notified_at?: string | null;
}

const statusOptions: Array<{ value: PermitAlertStatus; label: string }> = [
  { value: "active", label: "Activa" },
  { value: "notified", label: "Notificada" },
  { value: "expired", label: "Expirada" },
];

function getStatusLabel(status: PermitAlertStatus): string {
  return statusOptions.find((o) => o.value === status)?.label ?? status;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<PermitAlertStatus, string> = {
  active: "bg-blue-700/20 text-blue-400 border-blue-700/30",
  notified: "bg-green-700/20 text-green-400 border-green-700/30",
  expired: "bg-stone-700/20 text-stone-400 border-stone-700/30",
};

const STATUS_BTN: Record<PermitAlertStatus, { icon: React.ElementType; label: string; color: string }> = {
  notified: { icon: Check,      label: "Marcar notificada", color: "border-green-700/40 text-green-400 bg-green-700/20" },
  expired:  { icon: X,          label: "Marcar expirada",   color: "border-red-700/40 text-red-400 bg-red-700/20" },
  active:   { icon: RotateCcw,  label: "Reactivar",         color: "border-primary/30 text-primary bg-primary/20" },
};

const StatusActions = ({
  alertId, current, updating, onUpdate,
}: {
  alertId: string;
  current: PermitAlertStatus;
  updating: boolean;
  onUpdate: (id: string, s: PermitAlertStatus) => void;
}) => (
  <div className="flex items-center gap-1">
    {(["notified", "expired", "active"] as PermitAlertStatus[]).map((s) => {
      const { icon: Icon, label, color } = STATUS_BTN[s];
      const isActive = current === s;
      return (
        <Button
          key={s}
          type="button"
          variant="outline"
          size="icon"
          disabled={updating}
          title={label}
          aria-label={label}
          onClick={() => !isActive && onUpdate(alertId, s)}
          className={cn(
            "h-7 w-7 border",
            isActive
              ? cn(color, "cursor-default")
              : "border-border text-stone-500 hover:text-foreground hover:border-stone-600",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      );
    })}
  </div>
);

const COL_COUNT = 8;

const AdminPermitAlerts = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<PermitAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PermitAlertStatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((a) => a.email.toLowerCase().includes(q) || a.park.toLowerCase().includes(q))
    : items;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    let query = supabase
      .from("permit_alerts")
      .select("id, email, park, permit_name, target_year, status, created_at, notified_at")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error al cargar alertas", description: error.message, variant: "destructive" });
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
      toast({ title: "No se pudo actualizar el estado", description: error.message, variant: "destructive" });
      setUpdatingId(null);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    setUpdatingId(null);
    toast({ title: "Estado actualizado" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          className="w-full sm:w-auto border-border text-foreground hover:bg-muted"
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

      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o parque…"
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[160px]">
          <Label htmlFor="status-filter" className="text-xs text-muted-foreground">Estado</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PermitAlertStatusFilter)}>
            <SelectTrigger id="status-filter" className="bg-card border-border text-foreground">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/70">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card className="border-border/70">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No hay alertas para este filtro." : `Sin resultados para "${search}".`}
            </CardContent>
          </Card>
        ) : (
          filtered.map((alert) => (
            <Card key={alert.id} className="border-border/70">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm text-foreground break-all">{alert.email}</p>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground shrink-0">
                    {alert.target_year}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="text-foreground">Parque:</span> {alert.park}</p>
                  <p><span className="text-foreground">Permiso:</span> {alert.permit_name}</p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-foreground">Estado:</span>
                    <Badge variant="outline" className={cn("text-xs border", STATUS_BADGE[alert.status])}>
                      {getStatusLabel(alert.status)}
                    </Badge>
                  </p>
                  {alert.notified_at && (
                    <p><span className="text-foreground">Notificada:</span> {formatDate(alert.notified_at)}</p>
                  )}
                  <p><span className="text-foreground">Creada:</span> {formatDate(alert.created_at)}</p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <StatusActions
                    alertId={alert.id}
                    current={alert.status}
                    updating={updatingId === alert.id}
                    onUpdate={handleStatusChange}
                  />
                  <Button
                    size="sm"
                    className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs px-3 py-1.5 h-7 rounded-lg border border-[#15803D]"
                    onClick={() =>
                      window.open(
                        buildWhatsAppLink(`Hola, tenemos una actualización sobre el permiso para ${alert.park} (${alert.target_year}). ¿Tienes dudas? — Frank, Nomaderia`),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Parque</TableHead>
              <TableHead className="text-muted-foreground">Permiso</TableHead>
              <TableHead className="text-muted-foreground">Año</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Acciones</TableHead>
              <TableHead className="text-muted-foreground">Notificada</TableHead>
              <TableHead className="text-muted-foreground">Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">
                  {items.length === 0 ? "No hay alertas para este filtro." : `Sin resultados para "${search}".`}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((alert) => (
                <TableRow key={alert.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{alert.email}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.park}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.permit_name}</TableCell>
                  <TableCell className="text-muted-foreground">{alert.target_year}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs border", STATUS_BADGE[alert.status])}>
                      {getStatusLabel(alert.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <StatusActions
                        alertId={alert.id}
                        current={alert.status}
                        updating={updatingId === alert.id}
                        onUpdate={handleStatusChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="WhatsApp follow-up"
                        aria-label="WhatsApp follow-up"
                        className="h-7 w-7 text-[#16A34A] hover:bg-[#16A34A]/10"
                        onClick={() =>
                          window.open(
                            buildWhatsAppLink(`Hola, tenemos una actualización sobre el permiso para ${alert.park} (${alert.target_year}). ¿Tienes dudas? — Frank, Nomaderia`),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(alert.notified_at)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(alert.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && (
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {items.length} alerta{items.length !== 1 ? "s" : ""}
          {statusFilter !== "all" && ` · estado: ${getStatusLabel(statusFilter)}`}
          {q && ` · búsqueda: "${search}"`}
        </p>
      )}
    </div>
  );
};

export default AdminPermitAlerts;
