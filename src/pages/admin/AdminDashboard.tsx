import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, BookOpen, Users, Plus, FileText, Compass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  destinations: number;
  destinationDrafts: number;
  gear: number;
  gearDrafts: number;
  blog: number;
  blogDrafts: number;
  quiz: number;
  subscribers: number;
  itineraryRequests: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: "destination" | "gear" | "blog";
  is_published: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    destinations: 0, destinationDrafts: 0,
    gear: 0, gearDrafts: 0,
    blog: 0, blogDrafts: 0,
    quiz: 0, subscribers: 0, itineraryRequests: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [dPub, dDraft, gPub, gDraft, bPub, bDraft, q, s, ir, recentD, recentG, recentB] = await Promise.all([
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("quiz_responses").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("itinerary_requests").select("id", { count: "exact", head: true }),
        supabase.from("destinations").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("gear_articles").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("blog_posts").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
      ]);
      setStats({
        destinations: dPub.count || 0,
        destinationDrafts: dDraft.count || 0,
        gear: gPub.count || 0,
        gearDrafts: gDraft.count || 0,
        blog: bPub.count || 0,
        blogDrafts: bDraft.count || 0,
        quiz: q.count || 0,
        subscribers: s.count || 0,
        itineraryRequests: ir.count || 0,
      });
      const combined: RecentItem[] = [
        ...(recentD.data || []).map((r) => ({ ...r, type: "destination" as const, is_published: r.is_published ?? false })),
        ...(recentG.data || []).map((r) => ({ ...r, type: "gear" as const, is_published: r.is_published ?? false })),
        ...(recentB.data || []).map((r) => ({ ...r, type: "blog" as const, is_published: r.is_published ?? false })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      setRecent(combined);
    };
    load();
  }, []);

  const typeLabel: Record<RecentItem["type"], string> = { destination: "Destino", gear: "Gear", blog: "Blog" };
  const typeHref: Record<RecentItem["type"], string> = { destination: "/admin/destinations", gear: "/admin/gear-articles", blog: "/admin/blog-posts" };

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Destinos</CardTitle>
            <MapPin className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.destinations}</p>
            {stats.destinationDrafts > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{stats.destinationDrafts} borrador{stats.destinationDrafts !== 1 ? "es" : ""}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Gear Articles</CardTitle>
            <BookOpen className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.gear}</p>
            {stats.gearDrafts > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{stats.gearDrafts} borrador{stats.gearDrafts !== 1 ? "es" : ""}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Blog Posts</CardTitle>
            <FileText className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.blog}</p>
            {stats.blogDrafts > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{stats.blogDrafts} borrador{stats.blogDrafts !== 1 ? "es" : ""}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Itinerarios</CardTitle>
            <Compass className="h-5 w-5 text-trail" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.itineraryRequests}</p>
            <p className="text-xs text-muted-foreground mt-1">solicitud{stats.itineraryRequests !== 1 ? "es" : ""} recibida{stats.itineraryRequests !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Suscriptores</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.subscribers}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.quiz} quiz response{stats.quiz !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap mb-8">
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/admin/destinations/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Destino</Link>
        </Button>
        <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted">
          <Link to="/admin/gear-articles/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Artículo</Link>
        </Button>
        <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted">
          <Link to="/admin/blog-posts/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Post</Link>
        </Button>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <h2 className="font-serif text-xl text-foreground mb-3">Actividad Reciente</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            {recent.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0 border-border">{typeLabel[item.type]}</Badge>
                  <Link to={`${typeHref[item.type]}/${item.id}/edit`} className="text-sm text-foreground truncate hover:underline">
                    {item.title}
                  </Link>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Badge className={item.is_published ? "bg-secondary text-secondary-foreground text-xs" : "bg-muted text-muted-foreground text-xs"}>
                    {item.is_published ? "Publicado" : "Borrador"}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(item.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
