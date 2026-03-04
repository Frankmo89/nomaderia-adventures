import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, BookOpen, Users, Plus, FileText, Compass, BarChart3, Mail } from "lucide-react";
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
  emailsSent: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: "destination" | "gear" | "blog";
  is_published: boolean;
  created_at: string;
}

const interestLabels: Record<string, string> = {
  mountains: "🏔️ Montañas", forests: "🌲 Bosques", deserts: "🏜️ Desiertos", cultural: "🏛️ Cultural",
};
const originLabels: Record<string, string> = {
  mexico: "🇲🇽 México", usa: "🇺🇸 USA", spain: "🇪🇸 España", colombia: "🇨🇴 Colombia", other: "🌎 Otro",
};
const budgetLabels: Record<string, string> = {
  low: "🎒 Mochilero", medium: "💰 Balanceado", high: "✨ Cómodo", unlimited: "🚀 Sin límite",
};
const fitnessLabels: Record<string, string> = {
  sedentary: "🚶 Sedentario", light_activity: "🏃 Activo casual", moderate: "💪 Regular", active: "🔥 Muy activo",
};

const MiniBar = ({ data, labels }: { data: Record<string, number>; labels: Record<string, string> }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Sin datos aún</p>;
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  return (
    <div className="space-y-2">
      {sorted.map(([key, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm w-32 truncate">{labels[key] || key}</span>
            <div className="flex-1 bg-border/50 rounded-full h-2.5 overflow-hidden">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    destinations: 0, destinationDrafts: 0,
    gear: 0, gearDrafts: 0,
    blog: 0, blogDrafts: 0,
    quiz: 0, subscribers: 0, itineraryRequests: 0, emailsSent: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [quizAnalytics, setQuizAnalytics] = useState<{
    interests: Record<string, number>;
    origins: Record<string, number>;
    budgets: Record<string, number>;
    fitness: Record<string, number>;
  }>({ interests: {}, origins: {}, budgets: {}, fitness: {} });

  useEffect(() => {
    const load = async () => {
      const [dPub, dDraft, gPub, gDraft, bPub, bDraft, q, s, ir, emailsSent, recentD, recentG, recentB] = await Promise.all([
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("quiz_responses").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("itinerary_requests").select("id", { count: "exact", head: true }),
        (supabase as unknown as { from: (t: string) => { select: (q: string, opts: object) => Promise<{ count: number | null }> } }).from("email_drip_log").select("id", { count: "exact", head: true }),
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
        emailsSent: emailsSent.count || 0,
      });
      const combined: RecentItem[] = [
        ...(recentD.data || []).map((r) => ({ ...r, type: "destination" as const, is_published: r.is_published ?? false })),
        ...(recentG.data || []).map((r) => ({ ...r, type: "gear" as const, is_published: r.is_published ?? false })),
        ...(recentB.data || []).map((r) => ({ ...r, type: "blog" as const, is_published: r.is_published ?? false })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      setRecent(combined);

      const quizData = await supabase.from("quiz_responses").select("interest, fitness_level, budget_range, travel_style, created_at").order("created_at", { ascending: false }).limit(200);
      if (quizData.data) {
        const interests: Record<string, number> = {};
        const origins: Record<string, number> = {};
        const budgets: Record<string, number> = {};
        const fitness: Record<string, number> = {};
        quizData.data.forEach((r) => {
          if (r.interest) interests[r.interest] = (interests[r.interest] || 0) + 1;
          if (r.travel_style) origins[r.travel_style] = (origins[r.travel_style] || 0) + 1;
          if (r.budget_range) budgets[r.budget_range] = (budgets[r.budget_range] || 0) + 1;
          if (r.fitness_level) fitness[r.fitness_level] = (fitness[r.fitness_level] || 0) + 1;
        });
        setQuizAnalytics({ interests, origins, budgets, fitness });
      }
    };
    load();
  }, []);

  const typeLabel: Record<RecentItem["type"], string> = { destination: "Destino", gear: "Gear", blog: "Blog" };
  const typeHref: Record<RecentItem["type"], string> = { destination: "/admin/destinations", gear: "/admin/gear-articles", blog: "/admin/blog-posts" };

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Emails Enviados</CardTitle>
            <Mail className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.emailsSent}</p>
            <p className="text-xs text-muted-foreground mt-1">drip sequence</p>
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

      {stats.quiz > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl text-foreground">Analytics del Quiz</h2>
            <span className="text-xs text-muted-foreground">({stats.quiz} respuestas)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-card-foreground/70">Paisaje Favorito</CardTitle></CardHeader>
              <CardContent><MiniBar data={quizAnalytics.interests} labels={interestLabels} /></CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-card-foreground/70">Origen de Audiencia</CardTitle></CardHeader>
              <CardContent><MiniBar data={quizAnalytics.origins} labels={originLabels} /></CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-card-foreground/70">Presupuesto</CardTitle></CardHeader>
              <CardContent><MiniBar data={quizAnalytics.budgets} labels={budgetLabels} /></CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-card-foreground/70">Nivel Físico</CardTitle></CardHeader>
              <CardContent><MiniBar data={quizAnalytics.fitness} labels={fitnessLabels} /></CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
