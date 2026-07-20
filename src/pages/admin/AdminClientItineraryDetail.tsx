import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check, CheckCheck, Copy, ExternalLink, FileText, MessageCircle, Pencil, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  destinations: { title: string } | null;
};

interface PartyShape {
  adultos?: number;
  ninos?: number;
  nivel?: string;
  miedos?: string[];
  presupuesto_usd?: number | null;
  notas?: string | null;
}

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
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
  if (row.destinations?.title) return row.destinations.title;
  if (content.parque) return content.parque;
  return row.itinerary_templates?.destinations?.title ?? "";
}

function tripTotal(content: ContentV1): number {
  return Math.round(
    content.dias
      .flatMap((d) => d.bloques)
      .reduce((sum, b) => sum + (typeof b.precio_usd === "number" ? b.precio_usd : 0), 0),
  );
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
    if (day.bloques.length === 0) continue;
    const isDefaultTitle = day.titulo === `Día ${day.dia}`;
    lines.push(
      isDefaultTitle ? `📅 *Día ${day.dia}*` : `📅 *Día ${day.dia}: ${day.titulo}*`,
    );
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [row, setRow] = useState<ClientRow | null>(null);
  const [content, setContent] = useState<ContentV1 | null>(null);
  const [status, setStatus] = useState("borrador");
  const [loading, setLoading] = useState(true);
  const [copyTextDone, setCopyTextDone] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("client_itineraries")
      .select("*, itinerary_templates(destinations(title)), destinations(title)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const r = data as unknown as ClientRow;
        setRow(r);
        setStatus(r.status);
        setTitleValue(r.title ?? "");
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

  const commitTitle = async () => {
    setEditingTitle(false);
    if (!row) return;
    const value = titleValue.trim() || null;
    if (value === row.title) return;
    const { error } = await supabase
      .from("client_itineraries")
      .update({ title: value })
      .eq("id", id!);
    if (error) {
      toast({ title: "Error al guardar el título", description: error.message, variant: "destructive" });
      setTitleValue(row.title ?? "");
    } else {
      setRow({ ...row, title: value });
    }
  };

  const handleShare = async () => {
    if (!row) return;
    const identifier = row.friendly_slug ?? row.share_token;
    const link = `https://nomaderia.com/i/${identifier}`;
    // "Compartir" = status entregado (equivalente v1 de 'shared') + link al portapapeles
    if (status === "borrador" || status === "archivado") {
      await handleStatusChange("entregado");
    }
    await navigator.clipboard.writeText(link);
    setShareDone(true);
    toast({ title: "Link copiado", description: link });
    setTimeout(() => setShareDone(false), 2000);
  };

  const handleShowCosts = async (checked: boolean) => {
    if (!row) return;
    setRow({ ...row, show_costs: checked });
    const { error } = await supabase
      .from("client_itineraries")
      .update({ show_costs: checked })
      .eq("id", id!);
    if (error) {
      setRow({ ...row, show_costs: !checked });
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: checked ? "Costos visibles para el cliente" : "Costos ocultos para el cliente",
        description: checked ? undefined : "El RPC público los elimina server-side.",
      });
    }
  };

  // Mismo set de estados que la condición WHERE de get_itinerary_by_token —
  // fuera de estos, el RPC público devuelve 0 filas ("no disponible").
  const PUBLIC_STATUSES = ["entregado", "viaje_activo", "completado"];

  const handleViewAsClient = () => {
    if (!row) return;
    if (PUBLIC_STATUSES.includes(status)) {
      const identifier = row.friendly_slug ?? row.share_token;
      window.open(`/i/${identifier}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`/admin/client-itineraries/${row.id}/preview`, "_blank", "noopener,noreferrer");
    }
  };

  const handleDuplicate = async () => {
    if (!row) return;
    setDuplicating(true);
    const { data, error } = await supabase
      .from("client_itineraries")
      .insert({
        title: `${row.title ?? row.client_name} (copia)`,
        template_id: row.template_id,
        request_id: row.request_id,
        destination_id: row.destination_id,
        client_name: row.client_name,
        client_email: row.client_email,
        client_whatsapp: row.client_whatsapp,
        trip_start: row.trip_start,
        trip_end: row.trip_end,
        party: JSON.parse(JSON.stringify(row.party)),
        content: JSON.parse(JSON.stringify(content ?? row.content)),
        show_costs: row.show_costs,
        internal_notes: row.internal_notes,
        status: "borrador",
      })
      .select("id")
      .single();
    setDuplicating(false);
    if (error || !data) {
      toast({ title: "Error al duplicar", description: error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Itinerario duplicado", description: "Abriendo la copia…" });
    navigate(`/admin/client-itineraries/${data.id}`);
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

  const park = getPark(row, content);
  const party = row.party as unknown as PartyShape;
  const dateStr = formatDates(row.trip_start, row.trip_end);
  const total = tripTotal(content);
  const displayTitle = row.title ?? `Viaje de ${row.client_name}`;

  return (
    <div className="pb-16">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4 mb-2">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            {/* Título editable inline */}
            {editingTitle ? (
              <Input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") { setEditingTitle(false); setTitleValue(row.title ?? ""); }
                }}
                placeholder={`Viaje de ${row.client_name}`}
                className="h-9 max-w-md font-serif text-lg"
              />
            ) : (
              <button
                className="group flex items-center gap-2 text-left"
                onClick={() => setEditingTitle(true)}
                title="Editar título"
              >
                <h2 className="font-serif text-xl text-foreground truncate">{displayTitle}</h2>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            <p className="text-sm text-muted-foreground mt-1">
              {[
                row.client_name,
                park || null,
                dateStr || null,
                party?.adultos != null
                  ? `${party.adultos} adulto${party.adultos !== 1 ? "s" : ""}${party.ninos ? `, ${party.ninos} niño${party.ninos !== 1 ? "s" : ""}` : ""}`
                  : null,
              ].filter(Boolean).join(" · ")}
            </p>
            {(row.client_email || row.client_whatsapp) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[row.client_email, row.client_whatsapp ? `+${row.client_whatsapp}` : null]
                  .filter(Boolean).join(" · ")}
              </p>
            )}
            {total > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 mt-2 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                Total del viaje: ~${total} USD
              </span>
            )}
          </div>

          {/* Estado */}
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px] bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>
                  <Badge variant="outline" className={`text-xs mr-2 ${cfg.className}`}>
                    {cfg.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Acciones de entrega */}
        <div className="flex flex-wrap gap-2">
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

      {/* ── Builder ─────────────────────────────────────────────────────────── */}
      <ItineraryBlockEditor
        key={id}
        content={content}
        title={displayTitle}
        subtitle={[park, dateStr].filter(Boolean).join(" · ") || "Itinerario"}
        backHref="/admin/client-itineraries"
        onSave={handleSave}
        destinationId={row.destination_id}
        tripStart={row.trip_start}
      />

      {/* ── Footer sticky ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            onClick={handleViewAsClient}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Vista cliente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            onClick={handleDuplicate}
            disabled={duplicating}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicar
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            onClick={handleShare}
          >
            {shareDone
              ? <><Check className="h-3.5 w-3.5 mr-1.5" /> Copiado</>
              : <><Share2 className="h-3.5 w-3.5 mr-1.5" /> Compartir</>
            }
          </Button>
          <label className="flex items-center gap-2 ml-auto pl-2 shrink-0 cursor-pointer">
            <span className="text-[11px] text-sidebar-foreground/70 whitespace-nowrap">
              Mostrar costos al cliente
            </span>
            <Switch checked={row.show_costs} onCheckedChange={handleShowCosts} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdminClientItineraryDetail;
