import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Sparkles, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrendingBlogCard } from "@/components/admin/TrendingBlogCard";
import { DirectTopicCard } from "@/components/admin/DirectTopicCard";
import SortableHeader from "@/components/admin/SortableHeader";
import AdminPagination from "@/components/admin/Pagination";
import AdminEmptyState from "@/components/admin/EmptyState";
import { useTrendingBlog } from "@/hooks/use-trending-blog";
import { useSortable, applySortable } from "@/hooks/use-sortable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type BlogPost = Pick<Tables<"blog_posts">, "id" | "title" | "category" | "is_published" | "created_at">;

type BlogSortKey = "title" | "category" | "created_at";

const titleCase = (s: string | null): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

const getBlogValue = (a: BlogPost, key: BlogSortKey): string => {
  switch (key) {
    case "title": return a.title;
    case "category": return a.category ?? "";
    case "created_at": return a.created_at;
  }
};

const AdminBlogPosts = () => {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [focusInput, setFocusInput] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { sortState, handleSort } = useSortable<BlogSortKey>();
  const {
    mutate: discoverTrending,
    data: discoveryData,
    error: discoveryError,
    isPending: discoveryPending,
    reset: resetDiscovery,
  } = useTrendingBlog();

  const discoveryStatuses = [
    "Buscando intención de búsqueda real…",
    "Filtrando temas long-tail para principiantes…",
    "Reuniendo fuentes para validar demanda…",
  ];

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((a) => `${a.title} ${a.category ?? ""}`.toLowerCase().includes(q))
    : items;
  const sorted = applySortable(filtered, sortState, getBlogValue);
  const pageCount = Math.max(1, Math.ceil(sorted.length / 25));
  const paged = sorted.slice((page - 1) * 25, page * 25);

  const load = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, category, is_published, created_at")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!discoveryPending) { setStatusIndex(0); return; }
    // Progreso por etapas en cliente (no es streaming real del backend).
    const intervalId = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % discoveryStatuses.length);
    }, 2200);
    return () => { window.clearInterval(intervalId); };
  }, [discoveryPending, discoveryStatuses.length]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Post eliminado" }); load(); }
  };

  const handleTogglePublish = async (id: string, current: boolean | null) => {
    const { error } = await supabase.from("blog_posts").update({ is_published: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setItems((prev) => prev.map((a) => a.id === id ? { ...a, is_published: !current } : a));
  };

  const handleDiscoverTrending = () => {
    setShowDiscoveryPanel(true);
    resetDiscovery();
    discoverTrending(focusInput.trim() || undefined);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl text-foreground">Posts del Blog</h1>
        <div className="flex items-center gap-2">
          <Input
            value={focusInput}
            onChange={(e) => setFocusInput(e.target.value)}
            placeholder="Enfoque (opcional): permisos, invierno, Joshua Tree…"
            className="w-64 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button type="button" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={handleDiscoverTrending} disabled={discoveryPending}>
            <Sparkles className="h-4 w-4 mr-2" /> ✦ Descubrir Temas SEO
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/admin/blog-posts/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Post</Link>
          </Button>
        </div>
      </div>

      <DirectTopicCard />

      {showDiscoveryPanel && (
        <section className="mb-8 rounded-xl border border-border bg-card/40 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-serif text-2xl text-foreground">Sugerencias IA para Blog</h2>
            {discoveryPending && <Badge variant="outline" className="text-primary border-primary/30">{discoveryStatuses[statusIndex]}</Badge>}
          </div>
          {discoveryError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium mb-3">No pudimos descubrir temas SEO en este momento. Intenta de nuevo.</p>
              <Button type="button" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/20" onClick={handleDiscoverTrending} disabled={discoveryPending}>Reintentar</Button>
            </div>
          )}
          {!discoveryPending && !discoveryError && discoveryData?.candidates?.length === 0 && (
            <p className="text-sm text-muted-foreground">No encontramos candidatos nuevos por ahora. Prueba de nuevo en unos minutos.</p>
          )}
          {discoveryData?.candidates && discoveryData.candidates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {discoveryData.candidates.map((candidate) => (
                <TrendingBlogCard key={`${candidate.suggested_slug}-${candidate.title}`} candidate={candidate} />
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por título o categoría…" className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground shrink-0">Mostrando {filtered.length} de {items.length}</p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <SortableHeader label="Título" sortKey="title" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <SortableHeader label="Categoría" sortKey="category" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
              <TableHead className="text-foreground">Publicado</TableHead>
              <SortableHeader label="Creado" sortKey="created_at" activeSortKey={sortState.sortKey} sortDir={sortState.sortDir} onSort={handleSort} />
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
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <AdminEmptyState
                    icon={FileText}
                    title="Aún no hay posts"
                    description="Escribe tu primer post para atraer tráfico orgánico al sitio."
                    cta={{ label: "Crear post", href: "/admin/blog-posts/new" }}
                  />
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <AdminEmptyState
                    icon={Search}
                    title={`Sin resultados para "${search}"`}
                    description="Intenta con otro término de búsqueda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((a) => (
                <TableRow key={a.id} className="border-border">
                  <TableCell className="text-foreground font-medium">{a.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-foreground border-border">
                      {titleCase(a.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={a.is_published ?? false} onCheckedChange={() => handleTogglePublish(a.id, a.is_published)} aria-label={a.is_published ? "Publicado" : "Borrador"} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(a.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" aria-label={`Editar post ${a.title}`} title={`Editar post ${a.title}`}>
                        <Link to={`/admin/blog-posts/${a.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Eliminar post ${a.title}`} title={`Eliminar post ${a.title}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{a.title}</strong>.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(a.id)}>Eliminar</AlertDialogAction>
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
      <AdminPagination page={page} pageCount={pageCount} total={sorted.length} onPageChange={setPage} />
    </div>
  );
};

export default AdminBlogPosts;
