import { Badge } from "@/components/ui/badge";

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderado",
  challenging: "Desafiante",
};

interface DifficultyBadgeProps {
  difficultyLevel: string;
  beginnerFriendly?: boolean | null;
}

export default function DifficultyBadge({ difficultyLevel, beginnerFriendly }: DifficultyBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={difficultyColor[difficultyLevel] ?? "bg-muted text-muted-foreground"}>
        {difficultyLabel[difficultyLevel] ?? difficultyLevel}
      </Badge>
      {beginnerFriendly && (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-secondary/15 text-secondary border border-secondary/30 rounded-full">
          Apto para principiantes
        </span>
      )}
    </div>
  );
}
