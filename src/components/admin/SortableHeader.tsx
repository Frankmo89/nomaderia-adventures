import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/use-sortable";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeSortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}

const SortableHeader = ({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className,
}: SortableHeaderProps) => {
  const isActive = activeSortKey === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none group", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span
          className={cn(
            "shrink-0 transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
          )}
        >
          {isActive && sortDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : isActive && sortDir === "desc" ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5" />
          )}
        </span>
      </div>
    </TableHead>
  );
};

export default SortableHeader;
