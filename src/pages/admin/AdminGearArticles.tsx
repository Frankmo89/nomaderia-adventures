import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrendingGearCard } from "@/components/admin/TrendingGearCard";
import { useTrendingGear } from "@/hooks/use-trending-gear";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type GearArticle = Tables<"gear_articles">;

const AdminGearArticles = () => {
  const [items, setItems] = useState<GearArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const { toast } = useToast();
  const {
    mutate: discoverTrending,
    data: discoveryData,
    error: discoveryError,
    isPending: discoveryPending,
    reset: resetDiscovery,
  } = useTrendingGear();

  const discoveryStatuses = [
    "Buscando gear en tendencia…",
    "Filtrando opciones para principiantes…",
    "Reuniendo fuentes…",
  ];

  const load = async () => {
    const { data } = await supabase.from("gear_articles").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!discoveryPending) {
      setStatusIndex(0);
      return;
    }

    // Progreso por etapas en cliente (no es streaming real del backend).
    const intervalId = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % discoveryStatuses.length);
    }, 2200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [discoveryPending, discoveryStatuses.length]);

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

  const handleDiscoverTrending = () => {
    setShowDiscoveryPanel(true);
    resetDiscovery();
    discoverTrending();
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Artículos de Gear</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleDiscoverTrending}
            disabled={discoveryPending}
          >
            <Sparkles className="h-4 w-4 mr-2" /> ✦ Descubrir Gear Trending
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/admin/gear-articles/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Artículo</Link>
          </Button>
        </div>
      </div>

      {showDiscoveryPanel && (
        <section className="mb-8 rounded-xl border border-border bg-card/40 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-serif text-2xl text-foreground">Sugerencias IA de Gear Trending</h2>
            {discoveryPending && (
              <Badge variant="outline" className="text-primary border-primary/30">
                {discoveryStatuses[statusIndex]}
              </Badge>
            )}
          </div>

          {discoveryError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium mb-3">
                No pudimos descubrir temas de gear en este momento. Intenta de nuevo.
              </p>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/20"
                onClick={handleDiscoverTrending}
                disabled={discoveryPending}
              >
                Reintentar
              </Button>
            </div>
          )}

          {!discoveryPending && !discoveryError && discoveryData?.candidates?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No encontramos candidatos nuevos por ahora. Prueba de nuevo en unos minutos.
            </p>
          )}

          {discoveryData?.candidates && discoveryData.candidates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {discoveryData.candidates.map((candidate) => (
                <TrendingGearCard
                  key={`${candidate.suggested_slug}-${candidate.title}`}
                  candidate={candidate}
                />
              ))}
            </div>
          )}
        </section>
      )}

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
                      <Button asChild variant="ghost" size="icon" aria-label={`Editar artículo ${a.title}`} title={`Editar artículo ${a.title}`}>
                        <Link to={`/admin/gear-articles/${a.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar artículo ${a.title}`} title={`Eliminar artículo ${a.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
