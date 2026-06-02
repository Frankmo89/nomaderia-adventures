import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DraftLikeSource {
  title: string;
  url: string;
  used_for: string;
}

interface AIDraftSourcesPanelProps {
  sources: DraftLikeSource[];
}

export function AIDraftSourcesPanel({ sources }: AIDraftSourcesPanelProps) {
  const [open, setOpen] = useState(false);

  if (!sources.length) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-card-foreground font-serif text-xl flex items-center gap-2">
            <Lock className="h-4 w-4 text-secondary" />
            Fuentes (privado)
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Estas fuentes se guardan de forma privada para el admin solamente.
          </p>
        </div>
        <Button type="button" variant="outline" className="border-border text-foreground" onClick={() => setOpen((prev) => !prev)}>
          {open ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
          {open ? "Ocultar" : "Ver fuentes"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {sources.map((source) => (
            <div key={`${source.title}-${source.url}-${source.used_for}`} className="rounded-lg border border-border p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {source.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1 break-all">{source.url}</p>
                </div>
                <span className="inline-flex rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary whitespace-nowrap">
                  {source.used_for}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
