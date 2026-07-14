// src/components/ConciergeChat.tsx
// Concierge IA — panel flotante controlado por ConciergeLauncher (global, todas las rutas).
// Diseño: light theme editorial — Trail Green primario (docs/design-system.md).
// Mobile: sheet de altura completa. Desktop: tarjeta flotante sobre el launcher.
// No reconstruye el wiring de RAG (useConcierge) ni el contrato de concierge-agent.

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { useConcierge, type ConciergeMessage } from "@/hooks/use-concierge";

// ─── Escalación contextual por intención de compra (frontend-only, sin tocar concierge-agent) ──

const PURCHASE_INTENT_PATTERN =
  /\$49|itinerario completo|precio|cu[aá]nto cuesta|contratar|comprar/i;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConciergeChatProps {
  open: boolean;
  onClose: () => void;
  destinationSlug?: string;
  destinationTitle?: string;
  className?: string;
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-green"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function SourcePill({ title, section, url }: { title: string; section: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-green-wash text-green-dark border border-green/20 rounded-full px-2 py-0.5 hover:bg-green/10 transition-colors"
    >
      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
      <span className="truncate max-w-[160px]">{section}</span>
    </a>
  );
}

function MessageBubble({ message }: { message: ConciergeMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}
    >
      {/* Burbuja */}
      <div
        className={cn(
          "max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-green text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
            : "bg-stone-100 text-stone-800 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl"
        )}
      >
        <span dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>

      {/* Fuentes */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {message.sources.slice(0, 3).map((source) => (
            <SourcePill
              key={`${source.slug}-${source.section}`}
              title={source.title}
              section={source.section}
              url={source.url}
            />
          ))}
        </div>
      )}

      {/* CTA WhatsApp cuando escala (backend) o hay intención de compra (frontend) */}
      {!isUser && message.escalate && message.whatsapp_url && (
        <a
          href={message.whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("concierge_escalate_whatsapp_click", { source: "chat_thread" })}
          className="inline-flex items-center gap-2 bg-green hover:bg-green-dark text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Hablar con Frank
        </a>
      )}
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConciergeChat({
  open,
  onClose,
  destinationSlug,
  destinationTitle,
  className,
}: ConciergeChatProps) {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [input, setInput]       = useState("");
  const messagesEndRef           = useRef<HTMLDivElement>(null);
  const inputRef                 = useRef<HTMLInputElement>(null);
  const { mutate, isPending }    = useConcierge();

  // Scroll al último mensaje
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, isPending]);

  // Focus al abrir + lock de scroll de fondo en el sheet mobile
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSend() {
    const question = input.trim();
    if (!question || isPending) return;

    const purchaseIntent = PURCHASE_INTENT_PATTERN.test(question);

    const userMsg: ConciergeMessage = {
      id:      crypto.randomUUID(),
      role:    "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    mutate(
      { question, destination_slug: destinationSlug },
      {
        onSuccess(data) {
          // Intención de compra detectada en el mensaje del usuario: si el backend
          // no escaló, forzamos el CTA de WhatsApp igual (sin tocar concierge-agent).
          const escalate = data.escalate || purchaseIntent;
          const whatsappUrl =
            data.whatsapp_url ??
            (purchaseIntent
              ? buildWhatsAppLink(
                  destinationTitle
                    ? `Hola Frank, quiero el itinerario completo para ${destinationTitle}`
                    : "Hola Frank, quiero el itinerario completo de Nomaderia"
                )
              : undefined);

          const assistantMsg: ConciergeMessage = {
            id:           crypto.randomUUID(),
            role:         "assistant",
            content:      data.answer,
            sources:      data.sources,
            escalate,
            whatsapp_url: whatsappUrl,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError() {
          const errorMsg: ConciergeMessage = {
            id:      crypto.randomUUID(),
            role:    "assistant",
            content: "Hubo un error al conectarme. Intenta de nuevo.",
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      }
    );
  }

  // Saludo de dos capas (patrón Deel): explica desde el primer mensaje que la IA
  // resuelve dudas 24/7 y que WhatsApp queda reservado para cerrar con Frank.
  const greeting = destinationTitle
    ? `Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda sobre ${destinationTitle} — rutas, campamentos, presupuesto. Y cuando quieras tu itinerario completo, te conecto con Frank por WhatsApp.`
    : "Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda de los 63 parques — rutas, campamentos, presupuestos. Y cuando quieras tu itinerario completo, te conecto con Frank por WhatsApp.";

  const footerWhatsappUrl = buildWhatsAppLink(
    destinationTitle
      ? `Hola Frank, tengo una pregunta sobre ${destinationTitle}.`
      : "Hola Frank, tengo una pregunta sobre mi próxima aventura."
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            // z-[1200]: matches ConciergeLauncher.tsx — stays above Leaflet's
            // zoom-control pane (z-index 1000) on destination pages with a trail map.
            "fixed inset-0 z-[1200] flex flex-col bg-white shadow-2xl",
            "sm:inset-auto sm:bottom-24 sm:right-5 sm:w-[400px] sm:h-[620px] sm:max-h-[80vh] sm:rounded-3xl sm:overflow-hidden",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-green/15 bg-green-wash sm:rounded-t-3xl shrink-0 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:pt-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green flex items-center justify-center shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink font-serif">Concierge Nomaderia</p>
                <p className="text-xs text-sage">Responde desde guías verificadas por Frank</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-sage hover:text-ink transition-colors text-2xl sm:text-lg leading-none px-2 py-1 -mr-2"
              aria-label="Cerrar concierge"
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-start"
              >
                <div className="max-w-[90%] px-4 py-2.5 text-sm leading-relaxed bg-green-wash text-ink rounded-tr-2xl rounded-tl-2xl rounded-br-2xl">
                  {greeting}
                </div>
              </motion.div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isPending && (
              <div className="flex items-start">
                <div className="bg-stone-100 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + escalación secundaria persistente (patrón Zendesk) */}
          <div className="border-t border-stone-100 shrink-0 pb-[calc(env(safe-area-inset-bottom,0px))] sm:pb-0">
            <div className="flex gap-2 p-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="¿Qué tan difícil es? ¿Qué llevo?..."
                disabled={isPending}
                className="flex-1 text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-green focus:ring-1 focus:ring-green/30 disabled:opacity-50 transition"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                size="sm"
                className="bg-green hover:bg-green-dark text-white rounded-xl px-3 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <a
              href={footerWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("concierge_escalate_whatsapp_click", { source: "chat_footer_link" })}
              className="block text-center text-xs text-sage hover:text-green pb-3 transition-colors"
            >
              Hablar por WhatsApp →
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
