import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type LeadStatus = "nuevo" | "contactado" | "convertido";
export type LeadTable = "sentinel_leads" | "quiz_responses" | "itinerary_requests";

const db = supabase as unknown as SupabaseClient;

export const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string }> = {
  nuevo:      { label: "Nuevo",      cls: "bg-stone-700/60 text-stone-300 border-stone-600" },
  contactado: { label: "Contactado", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  convertido: { label: "Convertido", cls: "bg-green-900/50 text-green-400 border-green-700/50" },
};

interface LeadStatusBadgeProps {
  id: string;
  table: LeadTable;
  status: LeadStatus;
  onUpdate: (newStatus: LeadStatus) => void;
}

const LeadStatusBadge = ({ id, table, status, onUpdate }: LeadStatusBadgeProps) => {
  const { toast } = useToast();
  const [displayStatus, setDisplayStatus] = useState<LeadStatus>(status);

  useEffect(() => { setDisplayStatus(status); }, [status]);

  const cfg = STATUS_CONFIG[displayStatus];

  const handleChange = async (nextStatus: LeadStatus) => {
    const prev = displayStatus;
    setDisplayStatus(nextStatus); // optimistic

    const payload: Record<string, string | null> = { status: nextStatus };
    if (nextStatus === "contactado") payload.contacted_at = new Date().toISOString();
    if (nextStatus === "nuevo") payload.contacted_at = null;

    const { error } = await db.from(table).update(payload).eq("id", id);
    if (error) {
      setDisplayStatus(prev); // rollback
      toast({ title: "No se pudo actualizar el estado", description: error.message, variant: "destructive" });
      return;
    }

    onUpdate(nextStatus);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap",
            cfg.cls
          )}
        >
          {cfg.label}
          <ChevronDown className="h-2.5 w-2.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-border text-foreground w-44" align="start">
        {displayStatus !== "contactado" && (
          <DropdownMenuItem
            className="text-amber-400 focus:text-amber-400 focus:bg-amber-500/10 cursor-pointer"
            onClick={() => handleChange("contactado")}
          >
            Marcar contactado
          </DropdownMenuItem>
        )}
        {displayStatus !== "convertido" && (
          <DropdownMenuItem
            className="text-green-400 focus:text-green-400 focus:bg-green-500/10 cursor-pointer"
            onClick={() => handleChange("convertido")}
          >
            Marcar convertido
          </DropdownMenuItem>
        )}
        {displayStatus !== "nuevo" && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-muted-foreground cursor-pointer"
              onClick={() => handleChange("nuevo")}
            >
              Reabrir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LeadStatusBadge;
