import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type QuizResponse = Tables<"quiz_responses">;

const AdminQuizResponses = () => {
  const [items, setItems] = useState<QuizResponse[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("quiz_responses").select("*").order("created_at", { ascending: false });
      setItems(data || []);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-6">Quiz Responses</h1>
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Interés</TableHead>
              <TableHead className="text-foreground">Fitness</TableHead>
              <TableHead className="text-foreground">Duración</TableHead>
              <TableHead className="text-foreground">Estilo</TableHead>
              <TableHead className="text-foreground">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id} className="border-border">
                <TableCell className="text-foreground">{r.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.interest || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.fitness_level || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.trip_duration || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.travel_style || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminQuizResponses;
