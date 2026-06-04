import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CtaConfig {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: CtaConfig;
}

const AdminEmptyState = ({ icon: Icon, title, description, cta }: AdminEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-stone-800/70">
      <Icon className="h-7 w-7 text-stone-400" strokeWidth={1.5} />
    </div>
    <div className="flex flex-col gap-1.5 max-w-xs">
      <h3 className="font-serif text-lg text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-stone-400 leading-relaxed">{description}</p>
      )}
    </div>
    {cta && (
      cta.href ? (
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground mt-1">
          <Link to={cta.href}>
            <Plus className="h-4 w-4 mr-2" />
            {cta.label}
          </Link>
        </Button>
      ) : (
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground mt-1"
          onClick={cta.onClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          {cta.label}
        </Button>
      )
    )}
  </div>
);

export default AdminEmptyState;
