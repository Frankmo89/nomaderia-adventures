import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Route,
  UtensilsCrossed,
  Tent,
  Car,
  Plane,
  TriangleAlert,
  Ticket,
  DollarSign,
  StickyNote,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItineraryBlock, ItineraryDay, BlockType, ClientItinerary } from "@/hooks/use-itinerary";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Layout compartido entre la vista pública (/i/:token, ClientItineraryView),
// la vista previa admin (/admin/client-itineraries/:id/preview,
// AdminClientItineraryPreview) y la versión imprimible
// (/i/:token/print, ClientItineraryPrintView) — mismo render de día/bloque,
// distinta fuente de datos y distinto `variant` de presentación (screen|print).

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function domainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "fuente oficial";
  }
}

function isMapUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes("maps.google") || host.includes("goo.gl") || host.includes("maps.app.goo.gl");
  } catch {
    return false;
  }
}

function linkLabel(url: string): string {
  return isMapUrl(url) ? "Mapa" : "Sitio";
}

const DOT_COLOR: Record<BlockType, string> = {
  traslado: "#6B7280",
  ruta: "#166534",
  comida: "#D97706",
  alojamiento: "#4B5563",
  tip_seguridad: "#B45309",
  permiso: "#D97706",
  costo: "#4B5563",
  nota: "transparent",
};

const TIPO_LABEL: Record<BlockType, string> = {
  ruta: "RUTA",
  comida: "COMIDA",
  alojamiento: "ALOJAMIENTO",
  traslado: "TRASLADO",
  tip_seguridad: "SEGURIDAD",
  permiso: "PERMISO",
  costo: "COSTO",
  nota: "NOTA",
};

type MDComponents = React.ComponentProps<typeof ReactMarkdown>["components"];

const MD_COMPONENTS: MDComponents = {
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#166534" }}
    >
      {children}
    </a>
  ),
};

// ─── loading state ────────────────────────────────────────────────────────────

export function ItinerarySkeleton() {
  return (
    <div className="min-h-screen bg-cloud">
      <Skeleton className="w-full rounded-none" style={{ height: "min(40vh, 220px)" }} />
      <div className="px-4 py-4 space-y-3">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-7 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-3 h-3 rounded-full shrink-0 mt-1" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── unavailable / expired token state (compartido screen + print) ───────────

export function ItineraryUnavailable() {
  const link = buildWhatsAppLink("Hola, no puedo ver mi itinerario. ¿Pueden ayudarme?");
  return (
    <div className="min-h-screen bg-cloud flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-green-wash">
        <Info size={24} className="text-green" />
      </div>
      <h1 className="font-serif text-xl mb-2 text-ink">Este itinerario no está disponible</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        El link puede haber vencido o no ser válido. Escríbenos y te ayudamos.
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white no-underline bg-green hover:bg-green-dark"
      >
        Escríbenos por WhatsApp
      </a>
    </div>
  );
}

// ─── tiny shared pieces ───────────────────────────────────────────────────────

function VolatilityNote({ text }: { text: string }) {
  return (
    <p
      className="flex items-start gap-1 mt-2 m-0"
      style={{ fontSize: "11.5px", color: "#78716C", lineHeight: 1.4 }}
    >
      <Info size={11} className="shrink-0 mt-0.5 text-amber-600" />
      {text}
    </p>
  );
}

function BlockIcon({ tipo, className }: { tipo: BlockType; className?: string }) {
  const props = { size: 14, className };
  switch (tipo) {
    case "ruta":          return <Route {...props} />;
    case "comida":        return <UtensilsCrossed {...props} />;
    case "alojamiento":   return <Tent {...props} />;
    case "traslado":      return <Car {...props} />;
    case "tip_seguridad": return <TriangleAlert {...props} />;
    case "permiso":       return <Ticket {...props} />;
    case "costo":         return <DollarSign {...props} />;
    case "nota":          return <StickyNote {...props} />;
    default:              return null;
  }
}

function LinkButton({
  href,
  label,
  variant = "secondary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-medium no-underline transition-colors",
        variant === "primary"
          ? "bg-green text-white hover:bg-green-dark"
          : "border border-stone text-slate hover:bg-green-wash",
      )}
    >
      {label}
      <ExternalLink size={12} />
    </a>
  );
}

/** Botones de enlace de un bloque: fuente_url (Mapa/Sitio) + afiliado_url (Reservar, si aplica). */
function BlockLinks({ block }: { block: ItineraryBlock }) {
  if (!block.fuente_url && !block.afiliado_url) return null;
  const showFuente = block.fuente_url && block.fuente_url !== block.afiliado_url;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {showFuente && <LinkButton href={block.fuente_url!} label={linkLabel(block.fuente_url!)} />}
      {block.afiliado_url && (
        <LinkButton
          href={block.afiliado_url}
          label={block.tipo === "alojamiento" ? `Reservar en ${domainLabel(block.afiliado_url)}` : linkLabel(block.afiliado_url)}
          variant="primary"
        />
      )}
    </div>
  );
}

// ─── block card ───────────────────────────────────────────────────────────────

function BlockCard({ block }: { block: ItineraryBlock }) {
  // tip_seguridad — amber card, border-left 3px
  if (block.tipo === "tip_seguridad") {
    return (
      <div className="relative mb-5">
        <div
          className="timeline-dot absolute -left-[27px] top-[18px] w-3 h-3 rounded-full ring-2 ring-cloud"
          style={{ backgroundColor: "#B45309" }}
        />
        <div
          className="px-3 py-2.5"
          style={{ backgroundColor: "#FEF3C7", borderLeft: "3px solid #D97706" }}
        >
          <div className="flex items-start gap-1.5 mb-1.5">
            <TriangleAlert size={14} className="shrink-0 mt-0.5" style={{ color: "#633806" }} />
            <p
              className="text-[14px] font-medium leading-tight"
              style={{ color: "#633806" }}
            >
              {block.titulo}
            </p>
          </div>
          {block.contenido_md && (
            <div style={{ fontSize: "12.5px", color: "#854F0B", lineHeight: 1.5 }}>
              <ReactMarkdown components={MD_COMPONENTS}>{block.contenido_md}</ReactMarkdown>
            </div>
          )}
          {block.verify_flag && (
            <VolatilityNote text="Dato volátil — verifica en nps.gov / recreation.gov" />
          )}
        </div>
      </div>
    );
  }

  // permiso — white card, amber border
  if (block.tipo === "permiso") {
    return (
      <div className="relative mb-5">
        <div
          className="timeline-dot absolute -left-[27px] top-[18px] w-3 h-3 rounded-full ring-2 ring-cloud"
          style={{ backgroundColor: "#D97706" }}
        />
        <div
          className="bg-white rounded px-3 py-2.5"
          style={{ border: "0.5px solid #FAC775" }}
        >
          <div className="flex items-start gap-1.5 mb-1.5">
            <Ticket size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[14px] font-medium leading-tight text-foreground">
              {block.titulo}
            </p>
          </div>
          {block.precio_usd != null && (
            <div className="flex items-baseline gap-2 mb-1">
              <span style={{ fontSize: "17px", fontWeight: 500, color: "#1C1917" }}>
                ~${block.precio_usd} USD
              </span>
              {block.precio_nota && (
                <span style={{ fontSize: "11px", color: "#78716C" }}>
                  {block.precio_nota}
                </span>
              )}
            </div>
          )}
          {block.contenido_md && (
            <div
              style={{ fontSize: "12.5px", color: "#5F5E5A", lineHeight: 1.5 }}
              className="mb-1"
            >
              <ReactMarkdown components={MD_COMPONENTS}>{block.contenido_md}</ReactMarkdown>
            </div>
          )}
          <VolatilityNote text="Este precio puede cambiar · verifica en nps.gov antes de pagar" />
          <BlockLinks block={block} />
        </div>
      </div>
    );
  }

  // nota — no dot, editorial text only
  if (block.tipo === "nota") {
    return (
      <div className="mb-5">
        <p className="text-[14px] font-medium text-foreground mb-1">{block.titulo}</p>
        {block.contenido_md && (
          <div style={{ fontSize: "12.5px", color: "#5F5E5A", lineHeight: 1.5 }}>
            <ReactMarkdown components={MD_COMPONENTS}>{block.contenido_md}</ReactMarkdown>
          </div>
        )}
        <BlockLinks block={block} />
        {block.verify_flag && (
          <VolatilityNote text="Dato volátil — verifica en nps.gov / recreation.gov" />
        )}
      </div>
    );
  }

  // default layout — ruta, comida, alojamiento, traslado, costo
  const isVuelo = block.tipo === "traslado" && block.modo === "vuelo";
  const eyebrowParts = [block.horario, TIPO_LABEL[block.tipo]].filter(
    (v): v is string => !!v,
  );
  const eyebrow = eyebrowParts.join(" · ");

  return (
    <div className="relative mb-5">
      {/* colored dot on timeline rail */}
      <div
        className="timeline-dot absolute -left-[27px] top-[18px] w-3 h-3 rounded-full ring-2 ring-cloud"
        style={{ backgroundColor: DOT_COLOR[block.tipo] }}
      />

      {eyebrow && (
        <p
          className="text-[11px] tracking-widest uppercase mb-1"
          style={{ color: "#9CA3AF" }}
        >
          {eyebrow}
        </p>
      )}

      <div className="flex items-start gap-1.5 mb-1.5">
        {isVuelo ? (
          <Plane size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
        ) : (
          <BlockIcon tipo={block.tipo} className="shrink-0 mt-0.5 text-muted-foreground" />
        )}
        <p className="text-[14px] font-medium leading-tight text-foreground">
          {block.titulo}
        </p>
        {block.tipo === "alojamiento" && block.extra?.reservado && (
          <span className="shrink-0 inline-flex items-center rounded-full bg-green-wash px-2 py-0.5 text-[10.5px] font-medium text-green">
            Reservado
          </span>
        )}
      </div>

      {/* alojamiento — número de confirmación */}
      {block.tipo === "alojamiento" && block.extra?.confirmacion_ref && (
        <p className="text-[11.5px] text-sage mb-1">
          Confirmación: <span className="font-medium text-slate">{block.extra.confirmacion_ref}</span>
        </p>
      )}

      {/* costo — price prominent */}
      {block.tipo === "costo" && block.precio_usd != null && (
        <div className="flex items-baseline gap-2 mb-1.5">
          <span style={{ fontSize: "17px", fontWeight: 500, color: "#1C1917" }}>
            ~${block.precio_usd} USD
          </span>
          {block.precio_nota && (
            <span style={{ fontSize: "11px", color: "#78716C" }}>{block.precio_nota}</span>
          )}
        </div>
      )}

      {/* alojamiento — price inline */}
      {block.tipo === "alojamiento" && block.precio_usd != null && !block.contenido_md && (
        <p style={{ fontSize: "12.5px", color: "#5F5E5A" }} className="mb-1">
          Precio: ~${block.precio_usd} USD
          {block.precio_nota && ` · ${block.precio_nota}`}
        </p>
      )}

      {/* ruta — stats chips (senderos curados de signature_hikes o de park_things_to_do
          via NPS — misma forma de bloque, sin distinción visual para el cliente) */}
      {block.tipo === "ruta" &&
        (block.distancia_km != null || block.desnivel_m != null) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {block.distancia_km != null && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#EAF3DE", color: "#27500A" }}
              >
                {block.distancia_km} km
              </span>
            )}
            {block.desnivel_m != null && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#EAF3DE", color: "#27500A" }}
              >
                {block.desnivel_m} m desnivel
              </span>
            )}
          </div>
        )}

      {/* traslado — ruta origen→destino, duración, modo (vuelo ya lo indica el ícono) */}
      {block.tipo === "traslado" && (block.extra?.origen || block.extra?.destino || block.duracion || block.modo) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(block.extra?.origen || block.extra?.destino) && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-mist text-slate">
              {block.extra?.origen ?? "?"} → {block.extra?.destino ?? "?"}
            </span>
          )}
          {block.duracion && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {block.duracion}
            </span>
          )}
          {block.modo && block.modo !== "vuelo" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {block.modo}
            </span>
          )}
        </div>
      )}

      {block.contenido_md && (
        <div style={{ fontSize: "12.5px", color: "#5F5E5A", lineHeight: 1.5 }}>
          <ReactMarkdown components={MD_COMPONENTS}>{block.contenido_md}</ReactMarkdown>
        </div>
      )}

      <BlockLinks block={block} />

      {block.verify_flag && (
        <VolatilityNote text="Dato volátil — verifica en nps.gov / recreation.gov" />
      )}
    </div>
  );
}

// ─── day section ──────────────────────────────────────────────────────────────

function DaySection({ day }: { day: ItineraryDay }) {
  return (
    <section
      id={`dia-${day.dia}`}
      className="px-4 pt-8 pb-2 scroll-mt-12 print:break-before-page"
    >
      <h2
        className="font-serif mb-5"
        style={{ fontSize: "19px", color: "#1C1917" }}
      >
        Día {day.dia} · {day.titulo}
      </h2>

      {/* timeline rail */}
      <div
        className="border-l-2 border-[#D3D1C7] ml-1.5 pl-5"
      >
        {day.bloques.map((block) => (
          <BlockCard key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}

// ─── main layout ────────────────────────────────────────────────────────────

interface ClientItineraryLayoutProps {
  itinerary: ClientItinerary;
  /** Banner opcional renderizado arriba de todo (ej. aviso de vista previa admin, o la barra "Descargar PDF" en /print). */
  banner?: React.ReactNode;
  /** Token/slug de la URL actual — solo se usa para el link "Versión PDF" del footer. Opcional (la vista previa admin no lo pasa). */
  token?: string;
  /** "screen" (default): vista interactiva completa. "print": portada + días en una sola columna, sin nav/CTAs. */
  variant?: "screen" | "print";
}

export default function ClientItineraryLayout({ itinerary, banner, token, variant = "screen" }: ClientItineraryLayoutProps) {
  const [activeDay, setActiveDay] = useState(1);
  const navRef = useRef<HTMLDivElement>(null);
  const isPrint = variant === "print";

  const content = itinerary.content;
  const dias = content?.dias ?? [];
  const parque = content?.parque ?? null;
  const heroImageUrl = content?.hero_image_url;
  const tripTitle = itinerary.title?.trim() || (parque ? `Tu ${parque}` : "Tu itinerario");

  const estimatedTotal = dias
    .flatMap((d) => d.bloques)
    .reduce(
      (sum, b) => sum + (typeof b.precio_usd === "number" ? b.precio_usd : 0),
      0,
    );

  const dateChip =
    itinerary.trip_start && itinerary.trip_end
      ? `${formatDate(itinerary.trip_start)} – ${formatDate(itinerary.trip_end)}`
      : itinerary.trip_start
        ? `Desde ${formatDate(itinerary.trip_start)}`
        : null;

  const metaLine = [
    dias.length > 0 ? `${dias.length} ${dias.length === 1 ? "día" : "días"}` : null,
    dateChip,
    itinerary.client_name || null,
  ]
    .filter((v): v is string => !!v)
    .join(" · ");

  const whatsappHref = buildWhatsAppLink(`Hola, tengo una pregunta sobre mi itinerario "${tripTitle}"`);
  const handleWhatsAppClick = () => {
    trackEvent("itinerario_cliente_whatsapp_click", token ? { token } : {});
  };

  // IntersectionObserver: update active day as user scrolls (solo screen)
  useEffect(() => {
    if (isPrint || dias.length === 0) return;
    const observers: IntersectionObserver[] = [];

    dias.forEach((day) => {
      const el = document.getElementById(`dia-${day.dia}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveDay(day.dia);
        },
        { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [dias, isPrint]);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (isPrint) return;
    const pill = navRef.current?.querySelector(`[data-day="${activeDay}"]`);
    pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeDay, isPrint]);

  const handlePillClick = (dayNum: number) => {
    setActiveDay(dayNum);
    document.getElementById(`dia-${dayNum}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={cn("min-h-screen font-sans", isPrint ? "itin-print bg-white" : "bg-cloud")}>
      {isPrint && (
        <style>{`
          @media print {
            .itin-print, .itin-print * { color: #111111 !important; }
            .itin-print .font-serif { font-family: Georgia, "Times New Roman", Times, serif !important; }
            .itin-print .font-sans, .itin-print .font-condensed { font-family: Arial, Helvetica, sans-serif !important; }
          }
        `}</style>
      )}
      {banner}
      <div className="max-w-xl mx-auto">
      {/* ── HERO IMAGE (solo screen) ─────────────────────────────────── */}
      {!isPrint && (
        <div className="w-full overflow-hidden" style={{ height: "min(40vh, 220px)" }}>
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={parque ?? ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(160deg, #1a4d35 0%, #0f3d27 55%, #062616 100%)",
              }}
            />
          )}
        </div>
      )}

      {/* ── HEADER / PORTADA ─────────────────────────────────────────── */}
      <div className={cn("px-4 py-5", isPrint ? "print:break-after-page" : "bg-forest-dark")}>
        <p className="font-condensed text-[11px] tracking-widest uppercase mb-2 text-green">
          NOMADERIA{isPrint ? " · ITINERARIO DE VIAJE" : " · ITINERARIO PRIVADO"}
        </p>
        <h1
          className={cn("font-serif leading-tight mb-2", isPrint ? "text-ink" : "text-white")}
          style={{ fontSize: isPrint ? "28px" : "25px" }}
        >
          {tripTitle}
        </h1>
        {metaLine && (
          <p className={cn("text-[12.5px] mb-2", isPrint ? "text-slate" : "text-mist/85")}>
            {metaLine}
          </p>
        )}
        {estimatedTotal > 0 && (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium bg-amber/15 text-amber-800">
            ~${estimatedTotal} USD estimado
          </span>
        )}
      </div>

      {/* ── STICKY DAY NAV (solo screen) ─────────────────────────────── */}
      {!isPrint && dias.length > 0 && (
        <div
          ref={navRef}
          className="sticky top-0 z-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-cloud border-y border-stone print:hidden"
        >
          <div className="flex gap-2 px-4 py-2.5 w-max">
            {dias.map((day) => (
              <button
                key={day.dia}
                data-day={day.dia}
                onClick={() => handlePillClick(day.dia)}
                className={cn(
                  "flex-none px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap",
                  activeDay === day.dia
                    ? "bg-green text-white"
                    : "border border-stone text-slate bg-transparent",
                )}
              >
                Día {day.dia}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── DAY SECTIONS ─────────────────────────────────────────────── */}
      {dias.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Tu itinerario está siendo preparado.
        </div>
      ) : (
        <div>
          {dias.map((day) => (
            <DaySection key={day.dia} day={day} />
          ))}
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      {isPrint ? (
        <div className="px-4 py-8 text-center text-[11px] text-slate">
          Hecho por Nomaderia · nomaderia.com
        </div>
      ) : (
        <div className="px-4 pt-6 pb-10 space-y-4 print:hidden">
          <div className="text-center">
            <p className="font-serif text-sm text-ink mb-1">Hecho por Nomaderia</p>
            <p className="inline-flex items-center gap-1 text-[11px] text-sage">
              <ShieldCheck size={12} className="text-green" />
              Agente de Viajes Certificado TAP · The Travel Institute
            </p>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex items-start gap-3 p-4 rounded-xl no-underline bg-green hover:bg-green-dark"
          >
            {/* WhatsApp icon */}
            <svg
              viewBox="0 0 175.216 175.552"
              fill="white"
              aria-hidden="true"
              style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }}
            >
              <path d="M87.882 14.093c-40.626 0-73.678 33.052-73.678 73.678 0 13.013 3.386 25.263 9.322 35.89L14.093 161.46l39.197-10.283a73.345 73.345 0 0 0 34.592 8.593c40.626 0 73.678-33.052 73.678-73.678S128.508 14.093 87.882 14.093zm0 134.98a61.33 61.33 0 0 1-31.265-8.559l-2.24-1.33-23.2 6.088 6.195-22.622-1.46-2.322a61.212 61.212 0 0 1-9.388-32.65c0-33.88 27.57-61.45 61.45-61.45 33.88 0 61.45 27.57 61.45 61.45-.093 33.88-27.662 61.395-61.542 61.395z" />
              <path d="M126.145 101.393c-2.1-1.05-12.425-6.132-14.35-6.832-1.925-.7-3.325-1.05-4.725 1.05s-5.425 6.832-6.65 8.232c-1.225 1.4-2.45 1.575-4.55.525-2.1-1.05-8.862-3.266-16.879-10.414-6.24-5.564-10.452-12.432-11.677-14.532-1.225-2.1-.131-3.237.92-4.282.944-.94 2.1-2.45 3.15-3.675 1.05-1.225 1.4-2.1 2.1-3.5.7-1.4.35-2.625-.175-3.675s-4.725-11.392-6.475-15.592c-1.706-4.094-3.44-3.54-4.725-3.607-1.225-.062-2.625-.075-4.025-.075s-3.675.525-5.6 2.625c-1.925 2.1-7.35 7.182-7.35 17.518s7.525 20.318 8.575 21.718c1.05 1.4 14.8 22.6 35.862 31.693 5.012 2.162 8.925 3.456 11.975 4.422 5.031 1.6 9.607 1.374 13.222.832 4.034-.6 12.425-5.082 14.175-9.99 1.75-4.91 1.75-9.113 1.225-9.988-.525-.875-1.925-1.4-4.025-2.45z" />
            </svg>
            <p className="m-0" style={{ color: "#E1F5EE", fontSize: "14px", lineHeight: 1.5 }}>
              ¿Dudas durante el viaje?{" "}
              <strong>Escríbenos</strong> — tu concierge sigue contigo.
            </p>
          </a>

          {token && (
            <p className="text-center">
              <Link to={`/i/${token}/print`} className="text-[12px] text-sage underline">
                Versión PDF
              </Link>
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
