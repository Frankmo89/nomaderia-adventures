import { type ReactNode } from "react";
import { NOMADERIA_SOUL_DATA } from "@/data/soul.generated";
import { cn } from "@/lib/utils";

// ─── Inline markdown parser: **bold** and `code` only ───────────────────────

function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold text-stone-100">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="text-xs font-mono bg-stone-800 text-amber-400 px-1 py-0.5 rounded"
        >
          {match[2]}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

// Split "**Bold statement.** Body text." into { statement, body }
function parsePrinciple(text: string): { statement: string; body: string } {
  const match = text.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
  if (match) return { statement: match[1], body: match[2].trim() };
  return { statement: text, body: "" };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-px bg-amber-600 shrink-0" />
        <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-amber-500">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-serif text-2xl font-semibold text-stone-100">{title}</h2>
    </div>
  );
}

function PrincipleCard({
  num,
  statement,
  body,
}: {
  num: string;
  statement: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 md:gap-6 py-6 border-b border-stone-800 last:border-0">
      <div className="relative shrink-0 flex items-start">
        <span className="absolute inset-y-0 left-0 w-0.5 bg-amber-600 rounded-sm" />
        <span className="pl-3 font-serif text-5xl md:text-6xl font-bold leading-none text-stone-800 select-none tabular-nums">
          {num}
        </span>
      </div>
      <div className="pt-1 min-w-0">
        <p className="font-serif text-[19px] md:text-[21px] font-semibold text-stone-100 leading-snug">
          {statement}
        </p>
        {body && (
          <p className="text-sm md:text-[15px] text-stone-400 leading-relaxed mt-2">{body}</p>
        )}
      </div>
    </div>
  );
}

function VoiceRule({ text, isLast }: { text: string; isLast: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3.5",
        !isLast && "border-b border-stone-800"
      )}
    >
      <span className="text-amber-600/70 mt-[3px] shrink-0 text-[10px]">◆</span>
      <p className="text-[15px] text-stone-300 leading-relaxed">{parseInline(text)}</p>
    </div>
  );
}

function BannedPhraseRow({ phrase, isLast }: { phrase: string; isLast: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        !isLast && "border-b border-stone-800"
      )}
    >
      <span className="w-5 h-5 rounded-full bg-red-900/60 flex items-center justify-center shrink-0">
        <span className="text-red-400 text-[10px] font-bold leading-none">✕</span>
      </span>
      <p className="text-[15px] text-stone-300 italic">{phrase}</p>
    </div>
  );
}

function ExamplePair({
  question,
  bad,
  good,
}: {
  question: string;
  bad: string;
  good: string;
}) {
  const hasBad = bad.trim() !== "";
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-400">
        <span className="text-stone-600 mr-1.5">Pregunta:</span>
        <span className="text-stone-300 italic">"{question}"</span>
      </p>
      <div
        className={cn(
          "grid gap-3",
          hasBad ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {hasBad && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-900/40">
              <span className="text-base leading-none">❌</span>
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-red-400">
                Así No
              </span>
            </div>
            <p className="px-4 py-3 text-[15px] italic text-stone-500 leading-relaxed whitespace-pre-line">
              {bad}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-900/40">
            <span className="text-base leading-none">✅</span>
            <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-emerald-500">
              Así Sí
            </span>
          </div>
          <p className="px-4 py-3 text-[15px] italic text-stone-300 leading-relaxed whitespace-pre-line">
            {good}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const AdminSoul = () => {
  const { version, updatedAt, coreTruths, voice, petPeeves, examples } =
    NOMADERIA_SOUL_DATA;

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-px bg-amber-600 shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-amber-500">
            Documento Interno · Solo Lectura
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-[36px] font-bold text-stone-100 leading-tight">
          Nuestro SOUL
        </h1>
        <p className="text-stone-600 text-sm mt-2">
          v{version} · Última actualización: {updatedAt}
        </p>
      </header>

      <div className="space-y-16">
        {/* Verdades Centrales */}
        <section>
          <SectionHeader eyebrow="Las 5 verdades centrales" title="Lo que no negociamos" />
          <div>
            {coreTruths.map((truth, i) => {
              const { statement, body } = parsePrinciple(truth);
              return (
                <PrincipleCard
                  key={i}
                  num={String(i + 1).padStart(2, "0")}
                  statement={statement}
                  body={body}
                />
              );
            })}
          </div>
        </section>

        {/* Cómo Hablamos */}
        <section>
          <SectionHeader eyebrow="Tono y voz" title="Cómo hablamos" />
          <div className="rounded-xl border border-stone-800 bg-stone-900/30 overflow-hidden">
            {voice.map((rule, i) => (
              <VoiceRule key={i} text={rule} isLast={i === voice.length - 1} />
            ))}
          </div>
        </section>

        {/* Nunca Decimos */}
        <section>
          <SectionHeader eyebrow="Palabras prohibidas" title="Nunca decimos" />
          <p className="font-serif text-[17px] italic text-stone-500 mb-5">
            Estas frases rompen la voz. Si las ves en un draft, cámbialas.
          </p>
          <div className="rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden mb-4">
            {petPeeves.never.map((phrase, i) => (
              <BannedPhraseRow
                key={i}
                phrase={phrase}
                isLast={i === petPeeves.never.length - 1}
              />
            ))}
          </div>
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30">
            <p className="text-[13px] text-stone-400 leading-relaxed">
              {petPeeves.avoid}
            </p>
          </div>
        </section>

        {/* Ejemplos */}
        <section>
          <SectionHeader eyebrow="En la práctica" title="Ejemplos reales" />
          <div className="space-y-8">
            {examples.map((ex, i) => (
              <ExamplePair key={i} question={ex.question} bad={ex.bad} good={ex.good} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSoul;
