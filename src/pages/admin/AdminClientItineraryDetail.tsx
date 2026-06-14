import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Copy, MessageCircle, FileText, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ItineraryBlockEditor, { type ContentV1, type BlockTipo } from "@/components/admin/ItineraryBlockEditor";

type ClientRow = Tables<"client_itineraries"> & {
  itinerary_templates: {
    destinations: { title: string } | null;
  } | null;
};

interface PartyShape {
  adultos?: number;
  ninos?: number;
  nivel?: string;
  miedos?: string[];
  presupuesto_usd?: number | null;
  notas?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  borrador:     { label: "Borrador",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  entregado:    { label: "Entregado",  className: "bg-green-100  text-green-800  border-green-200"  },
  viaje_activo: { label: "En viaje",   className: "bg-blue-100   text-blue-800   border-blue-200"   },
  completado:   { label: "Completado", className: "bg-gray-100   text-gray-700   border-gray-200"   },
  archivado:    { label: "Archivado",  className: "bg-stone-100  text-stone-600  border-stone-200"  },
};

const TIPO_EMOJI: Record<BlockTipo, string> = {
  ruta:         "🥾",
  comida:       "🍽️",
  alojamiento:  "🏕️",
  traslado:     "🚗",
  tip_seguridad:"⚠️",
  permiso:      "🎫",
  costo:        "💰",
  nota:         "📝",
};

function formatDates(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start ? fmt(start) : fmt(end!);
}

function getPark(row: ClientRow, content: ContentV1): string {
  if (content.parque) return content.parque;
  return row.itinerary_templates?.destinations?.title ?? "";
}

function generateTextVersion(row: ClientRow, content: ContentV1): string {
  const parque = getPark(row, content) || "Tu destino";
  const dias = content.dias.length;
  const identifier = row.friendly_slug ?? row.share_token;
  const link = `https://nomaderia.com/i/${identifier}`;

  const lines: string[] = [];
  lines.push(`🏔️ Tu itinerario — ${parque} (${dias} ${dias === 1 ? "día" : "días"})`);
  lines.push("");

  for (const day of content.dias) {
    lines.push(`📅 *Día ${day.dia}: ${day.titulo}*`);
    for (const block of day.bloques) {
      const emoji = TIPO_EMOJI[block.tipo as BlockTipo] ?? "•";
      let line = `${emoji} ${block.titulo}`;
      if (block.horario) line += ` | ${block.horario}`;
      if (block.precio_usd != null) {
        line += ` | $${block.precio_usd} USD`;
        if (block.precio_nota) line += ` (${block.precio_nota})`;
      }
      lines.push(line);
      if (block.contenido_md) {
        const firstPara = block.contenido_md.split("\n\n")[0].replace(/[#*_`]/g, "").trim();
        if (firstPara) lines.push(`   ${firstPara}`);
      }
      if (block.fuente_url) lines.push(`   🔗 ${block.fuente_url}`);
    }
    lines.push("");
  }

  const costos = content.dias
    .flatMap((d) => d.bloques)
    .filter((b) => b.precio_usd != null && b.precio_usd > 0);

  if (costos.length > 0) {
    lines.push("💰 *Costos incluidos en el itinerario:*");
    let total = 0;
    for (const b of costos) {
      lines.push(`• ${b.titulo} — $${b.precio_usd} USD`);
      total += b.precio_usd!;
    }
    lines.push(`*Total estimado: $${total} USD*`);
    lines.push("");
  }

  lines.push("🔗 Ver tu itinerario completo (mapa, fotos y detalles):");
  lines.push(link);
  lines.push("");
  lines.push("¿Tienes preguntas? ¡Escríbeme aquí mismo! 🙌");
  lines.push("— Frank, Nomaderia Adventures 🌿");

  return lines.join("\n");
}

const AdminClientItineraryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [row, setRow] = useState<ClientRow | null>(null);
  const [content, setContent] = useState<ContentV1 | null>(null);
  const [status, setStatus] = useState("borrador");
  const [loading, setLoading] = useState(true);
  const [copyLinkDone, setCopyLinkDone] = useState(false);
  const [copyTextDone, setCopyTextDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("client_itineraries")
      .select("*, itinerary_templates(destinations(title))")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const r = data as unknown as ClientRow;
        setRow(r);
        setStatus(r.status);
        const raw = r.content as unknown as ContentV1;
        setContent(
          raw?.version === 1 && Array.isArray(raw.dias)
            ? raw
            : { version: 1, dias: [] },
        );
        setLoading(false);
      });
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "entregado") update.delivered_at = new Date().toISOString();
    const { error } = await supabase
      .from("client_itineraries")
      .update(update)
      .eq("id", id!);
    if (error) {
      toast({ title: "Error al actualizar estado", description: error.message, variant: "destructive" });
      setStatus(row?.status ?? "borrador");
    } else {
      toast({ title: `Estado actualizado: ${STATUS_CONFIG[newStatus]?.label ?? newStatus}` });
    }
  };

  const handleCopyLink = async () => {
    if (!row) return;
    const identifier = row.friendly_slug ?? row.share_token;
    const link = `https://nomaderia.com/i/${identifier}`;
    await navigator.clipboard.writeText(link);
    setCopyLinkDone(true);
    toast({ title: "Link copiado", description: link });
    setTimeout(() => setCopyLinkDone(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!row) return;
    const identifier = row.friendly_slug ?? row.share_token;
    const link = `https://nomaderia.com/i/${identifier}`;
    const msg = `Hola ${row.client_name}, aquí está tu itinerario personalizado de Nomaderia 🏔️\n\nVer todos los detalles: ${link}\n\n¿Tienes preguntas? ¡Escríbeme aquí mismo! — Frank, Nomaderia Adventures 🌿`;
    const phone = row.client_whatsapp?.replace(/\D/g, "") ?? "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyText = async () => {
    if (!row || !content) return;
    const text = generateTextVersion(row, content);
    await navigator.clipboard.writeText(text);
    setCopyTextDone(true);
    toast({ title: "Versión texto copiada", description: "Lista para pegar en WhatsApp." });
    setTimeout(() => setCopyTextDone(false), 2000);
  };

  const handleSave = async (newContent: ContentV1) => {
    const { error } = await supabase
      .from("client_itineraries")
      .update({ content: JSON.parse(JSON.stringify(newContent)) })
      .eq("id", id!);
    if (error) throw error;
    setContent(newContent);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!row || !content) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Itinerario no encontrado.
      </div>
    );
  }

  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.borrador;
  const park = getPark(row, content);
  const party = row.party as unknown as PartyShape;
  const dateStr = formatDates(row.trip_start, row.trip_end);

  return (
    <div>
      {/* Delivery panel */}
      <div className="rounded-lg border border-border bg-card p-4 mb-2">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="font-serif text-xl text-foreground">{row.client_name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {row.client_email && (
                <span className="text-sm text-muted-foreground">{row.client_email}</span>
              )}
              {row.client_whatsapp && (
                <span className="text-sm text-muted-foreground">+{row.client_whatsapp}</span>
              )}
            </div>
            {(dateStr || party?.adultos != null) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {[
                  dateStr,
                  party?.adultos != null
                    ? `${party.adultos} adulto${party.adultos !== 1 ? "s" : ""}${party.ninos ? `, ${party.ninos} niño${party.ninos !== 1 ? "s" : ""}` : ""}`
                    : null,
                  party?.presupuesto_usd ? `$${party.presupuesto_usd} USD` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {park && (
              <p className="text-xs text-muted-foreground mt-0.5">{park}</p>
            )}
          </div>

          {/* Status select */}
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px] bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>
                  <Badge
                    variant="outline"
                    className={`text-xs mr-2 ${cfg.className}`}
                  >
                    {cfg.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delivery buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted"
            onClick={handleCopyLink}
          >
            {copyLinkDone
              ? <><CheckCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copiado</>
              : <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar link</>
            }
          </Button>

          <Button
            size="sm"
            className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Enviar por WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-muted"
            onClick={handleCopyText}
          >
            {copyTextDone
              ? <><CheckCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copiada</>
              : <><FileText className="h-3.5 w-3.5 mr-1.5" /> Copiar versión texto</>
            }
          </Button>
        </div>
      </div>

      {/* Block editor */}
      <ItineraryBlockEditor
        key={id}
        content={content}
        title={row.client_name}
        subtitle={[park, dateStr].filter(Boolean).join(" · ") || "Itinerario"}
        backHref="/admin/client-itineraries"
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminClientItineraryDetail;
