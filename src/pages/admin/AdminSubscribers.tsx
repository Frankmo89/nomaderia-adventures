import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Sub = Tables<"newsletter_subscribers">;

const AdminSubscribers = () => {
  const [items, setItems] = useState<Sub[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      setItems(data || []);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-6">Subscribers</h1>
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Fuente</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id} className="border-border">
                <TableCell className="text-foreground">{s.email}</TableCell>
                <TableCell className="text-muted-foreground">{s.source || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSubscribers;
