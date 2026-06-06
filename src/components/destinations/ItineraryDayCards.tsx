import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type MDComponents = React.ComponentProps<typeof ReactMarkdown>["components"];

interface Props {
  markdown: string;
  components?: MDComponents;
}

interface DaySection {
  title: string;
  body: string;
}

interface ParseResult {
  preamble: string;
  days: DaySection[];
}

const DIA_HEADER_RE = /^### (Día .+)/;

const PROSE =
  "prose prose-stone max-w-none text-foreground/90 leading-relaxed prose-headings:font-serif prose-headings:text-foreground";

function parseDays(markdown: string): ParseResult | null {
  const lines = markdown.split("\n");
  const days: DaySection[] = [];
  const preambleLines: string[] = [];
  let current: DaySection | null = null;

  for (const line of lines) {
    const match = line.match(DIA_HEADER_RE);
    if (match) {
      if (current) days.push({ ...current, body: current.body.trimEnd() });
      current = { title: match[1], body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else {
      preambleLines.push(line);
    }
  }
  if (current) days.push({ ...current, body: current.body.trimEnd() });

  if (days.length === 0) return null;
  return { preamble: preambleLines.join("\n").trim(), days };
}

const ItineraryDayCards = ({ markdown, components }: Props) => {
  const result = parseDays(markdown);

  if (!result) {
    return (
      <div className={PROSE}>
        <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
      </div>
    );
  }

  const { preamble, days } = result;

  return (
    <div>
      {preamble && (
        <div className={`${PROSE} mb-6`}>
          <ReactMarkdown components={components}>{preamble}</ReactMarkdown>
        </div>
      )}
      <Accordion type="single" collapsible defaultValue="day-0" className="w-full">
        {days.map((day, i) => (
          <AccordionItem key={i} value={`day-${i}`} className="border-border">
            <AccordionTrigger className="font-serif text-lg text-foreground hover:text-primary text-left">
              {day.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className={PROSE}>
                <ReactMarkdown components={components}>{day.body}</ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ItineraryDayCards;
