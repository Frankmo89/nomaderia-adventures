import { Link } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlogCandidate } from "@/types/ai-blog";

interface TrendingBlogCardProps {
  candidate: BlogCandidate;
}

export function TrendingBlogCard({ candidate }: TrendingBlogCardProps) {
  const candidatePayload = encodeURIComponent(
    JSON.stringify({
      title: candidate.title,
      category: candidate.category,
      suggested_slug: candidate.suggested_slug,
    }),
  );

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl text-card-foreground leading-tight">{candidate.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{candidate.category}</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-1" />
      </div>

      <p className="text-sm text-card-foreground/90 mt-4 leading-relaxed">{candidate.search_intent}</p>

      <div className="mt-4">
        <Badge variant="outline" className="text-foreground border-border">
          {candidate.category}
        </Badge>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Fuentes</p>
        {candidate.sources.slice(0, 3).map((source) => (
          <a
            key={`${source.title}-${source.url}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mr-3"
          >
            <span className="truncate max-w-[180px]">{source.title}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>

      <div className="mt-5">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to={`/admin/blog-posts/new?candidate=${candidatePayload}`}>Desarrollar este →</Link>
        </Button>
      </div>
    </article>
  );
}
