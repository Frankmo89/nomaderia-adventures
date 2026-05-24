import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Download, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface SentinelLead {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

const db = supabase as unknown as SupabaseClient;

const exportCSV = (items: SentinelLead[]) => {
  const headers = ["Email", "Fuente", "Fecha"];
  const rows = items.map((s) => [
    s.email,
    s.source || "",
    new Date(s.created_at).toLocaleDateString("es-MX"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sentinel-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminSentinelLeads = () => {
  const [items, setItems] = useState<SentinelLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await db
        .from("sentinel_leads")
        .select("id, email, source, created_at")
        .order("created_at", { ascending: false });
      setItems((data as SentinelLead[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Leads de Alerta</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} lead{items.length !== 1 ? "s" : ""} · alerta de permisos Yosemite
            </p>
          )}
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
              <TableHead className="text-foreground">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No hay leads todavía.
                </TableCell>
              </TableRow>
            ) : (
              items.map((lead) => (
                <TableRow key={lead.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {lead.source || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-xs"
                      onClick={() =>
                        window.open(
                          buildWhatsAppLink(
                            `Hola, vi que te interesaste en la alerta de permisos de Yosemite. ¿Tienes dudas? Con gusto te ayudo. — Frank, Nomaderia`
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
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

export default AdminSentinelLeads;
