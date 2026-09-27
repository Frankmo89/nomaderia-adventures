// src/components/ConciergeChat.tsx
// Concierge IA — panel flotante controlado por ConciergeLauncher (global, todas las rutas).
// Diseño: light theme editorial — Trail Green primario (docs/design-system.md).
// Mobile: sheet de altura completa. Desktop: tarjeta flotante sobre el launcher.
// No reconstruye el wiring de RAG (useConcierge) ni el contrato de concierge-agent.
//
// Producto: WhatsApp es solo para clientes que ya pagaron (botón propio en
// /i/:token) — este chat es de visitantes anónimos y NUNCA lo ofrece. Cuando
// escala (backend: escalate + quiz_url), se ofrece el quiz gratuito + captura
// de correo (mismo patrón de inserción que NewsletterSignup.tsx).

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, ExternalLink, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useConcierge, type ConciergeMessage } from "@/hooks/use-concierge";

const NEWSLETTER_UNIQUE_VIOLATION = "23505";

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

/**
 * Escalación de visitante: quiz gratuito + captura de correo. Nunca WhatsApp
 * (producto: WhatsApp es solo para clientes que ya pagaron, vía /i/:token).
 * Inserta en newsletter_subscribers con el mismo patrón que NewsletterSignup.tsx
 * (23505 = ya suscrito, se trata como éxito silencioso).
 */
function EscalationCTA({ quizUrl, source }: { quizUrl: string; source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "concierge_escalation" });
      if (error && error.code !== NEWSLETTER_UNIQUE_VIOLATION) throw error;
      setStatus("done");
      trackEvent("concierge_email_capture_submit", { source });
      if (!error) {
        supabase.functions.invoke("send-welcome-email", { body: { email } }).catch(() => undefined);
      }
    } catch {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-2 max-w-[85%]">
      <Link
        to={quizUrl}
        onClick={() => trackEvent("concierge_escalate_quiz_click", { source })}
        className="inline-flex items-center gap-2 bg-green hover:bg-green-dark text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors w-fit"
      >
        <Compass className="w-4 h-4" />
        Descubre tu aventura ideal (quiz gratis)
      </Link>

      {status === "done" ? (
        <p className="text-xs text-green-dark px-1">¡Gracias! Te escribimos con ideas para tu próxima aventura 🏔️</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-sage px-1">¿Prefieres que te escribamos por correo?</p>
          <form onSubmit={handleEmailSubmit} className="flex gap-1.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={status === "loading"}
              aria-label="Correo para seguir ayudándote"
              className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-green focus:ring-1 focus:ring-green/30 disabled:opacity-50 transition"
            />
            <Button
              type="submit"
              disabled={!email || status === "loading"}
              size="sm"
              variant="outline"
              className="text-xs h-auto px-2.5 py-1.5 border-green/30 text-green-dark hover:bg-green-wash shrink-0"
            >
              {status === "loading" ? "..." : "Enviar"}
            </Button>
          </form>
        </div>
      )}
    </div>
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

      {/* Escalación: quiz + captura de correo (nunca WhatsApp — ver header del archivo) */}
      {!isUser && message.escalate && message.quiz_url && (
        <EscalationCTA quizUrl={message.quiz_url} source="chat_thread" />
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
          const assistantMsg: ConciergeMessage = {
            id:        crypto.randomUUID(),
            role:      "assistant",
            content:   data.answer,
            sources:   data.sources,
            escalate:  data.escalate,
            quiz_url:  data.quiz_url,
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
  // resuelve dudas 24/7. El itinerario completo ($49) se cierra por WhatsApp desde
  // /servicios o /i/:token — no desde este chat, así que el saludo ya no lo promete.
  const greeting = destinationTitle
    ? `Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda sobre ${destinationTitle} — rutas, campamentos, presupuesto.`
    : "Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda de los 63 parques — rutas, campamentos, presupuestos. Y si buscas tu destino ideal, prueba nuestro quiz gratuito 🧭";

  const quizFooterUrl = "/#quiz";

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

          {/* Input + nudge secundario persistente al quiz (patrón Zendesk, antes apuntaba a WhatsApp) */}
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
            <Link
              to={quizFooterUrl}
              onClick={() => trackEvent("concierge_escalate_quiz_click", { source: "chat_footer_link" })}
              className="block text-center text-xs text-sage hover:text-green pb-3 transition-colors"
            >
              Descubre tu aventura ideal (quiz gratis) →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
