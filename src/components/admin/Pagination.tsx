import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({ page, pageCount, total, onPageChange }: AdminPaginationProps) => {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Anterior
      </Button>
      <span className="text-xs text-muted-foreground text-center">
        Página {page} de {pageCount} · {total} resultado{total !== 1 ? "s" : ""}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default AdminPagination;
