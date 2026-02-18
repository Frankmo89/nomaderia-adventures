import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

const AdminGearArticles = () => {
  const [items, setItems] = useState<GearArticle[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("gear_articles").select("*").order("created_at", { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    const { error } = await supabase.from("gear_articles").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Gear Articles</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/admin/gear-articles/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Artículo</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Título</TableHead>
              <TableHead className="text-foreground">Categoría</TableHead>
              <TableHead className="text-foreground">Estado</TableHead>
              <TableHead className="text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id} className="border-border">
                <TableCell className="text-foreground font-medium">{a.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-foreground border-border">{a.category}</Badge></TableCell>
                <TableCell>
                  <Badge className={a.is_published ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}>
                    {a.is_published ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="icon"><Link to={`/admin/gear-articles/${a.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminGearArticles;
