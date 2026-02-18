import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

const AdminGearArticles = () => {
  const [items, setItems] = useState<GearArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("gear_articles").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gear_articles").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Artículo eliminado" }); load(); }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("gear_articles").update({ is_published: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.map((a) => a.id === id ? { ...a, is_published: !current } : a));
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
              <TableHead className="text-foreground">Publicado</TableHead>
              <TableHead className="text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No hay artículos. <Link to="/admin/gear-articles/new" className="underline text-primary">Crea el primero.</Link>
                </TableCell>
              </TableRow>
            ) : (
              items.map((a) => (
                <TableRow key={a.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{a.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-foreground border-border">{a.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={a.is_published ?? false}
                      onCheckedChange={() => handleTogglePublish(a.id, a.is_published ?? false)}
                      aria-label={a.is_published ? "Publicado" : "Borrador"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/admin/gear-articles/${a.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{a.title}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(a.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminGearArticles;
