import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { MapPin, BookOpen, Users, Plus, FileText, Compass, BarChart3, Mail, Bell, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

interface Stats {
  destinations: number;
  destinationDrafts: number;
  aiGeneratedDestinations: number;
  aiGeneratedGear: number;
  aiGeneratedBlog: number;
  gear: number;
  gearDrafts: number;
  blog: number;
  blogDrafts: number;
  quiz: number;
  sentinelLeads: number;
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

interface SentinelLead {
  email: string;
  source: string | null;
  created_at: string;
}

interface RecentQuizResponse {
  id: string;
  email: string | null;
  interest: string | null;
  recommended_destinations: string[] | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  return `hace ${Math.floor(diffHours / 24)}d`;
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

const db = supabase as unknown as SupabaseClient;

const MiniBar = ({ data, labels }: { data: Record<string, number>; labels: Record<string, string> }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">Sin datos aún</p>;
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  return (
    <div className="space-y-2">
      {sorted.map(([key, count], idx) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm w-32 truncate">{labels[key] || key}</span>
            <div className="flex-1 overflow-hidden" style={{ background: '#F0EBE0', height: 7, borderRadius: 4 }}>
              <div
                className="transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  height: 7,
                  borderRadius: 4,
                  background: idx === 0 ? 'linear-gradient(90deg,#D97706,#F59E0B)' : '#E2D9C5',
                }}
              />
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
    aiGeneratedDestinations: 0,
    aiGeneratedGear: 0,
    aiGeneratedBlog: 0,
    gear: 0, gearDrafts: 0,
    blog: 0, blogDrafts: 0,
    quiz: 0, sentinelLeads: 0, subscribers: 0, itineraryRequests: 0, emailsSent: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [sentinelRecent, setSentinelRecent] = useState<SentinelLead[]>([]);
  const [quizRecent, setQuizRecent] = useState<RecentQuizResponse[]>([]);
  const [quizAnalytics, setQuizAnalytics] = useState<{
    interests: Record<string, number>;
    origins: Record<string, number>;
    budgets: Record<string, number>;
    fitness: Record<string, number>;
  }>({ interests: {}, origins: {}, budgets: {}, fitness: {} });

  useEffect(() => {
    const load = async () => {
      const [dPub, dDraft, aiGenerated, aiContentMeta, gPub, gDraft, bPub, bDraft, q, sentinelLeads, s, ir, emailsSent, recentD, recentG, recentB] = await Promise.all([
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", false),
        db.from("destination_ai_meta").select("id", { count: "exact", head: true }),
        db.from("ai_content_meta").select("content_type").in("content_type", ["gear", "blog"]),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", false),
        supabase.from("quiz_responses").select("id", { count: "exact", head: true }),
        supabase.from("sentinel_leads").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("itinerary_requests").select("id", { count: "exact", head: true }),
        db.from("email_drip_log").select("id", { count: "exact", head: true }),
        supabase.from("destinations").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("gear_articles").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("blog_posts").select("id, title, is_published, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      let aiGeneratedGear = 0;
      let aiGeneratedBlog = 0;

      // Si ai_content_meta falla o viene vacío, mantenemos destino y dejamos gear/blog en 0 sin romper UI.
      if (!aiContentMeta.error && aiContentMeta.data) {
        for (const row of aiContentMeta.data as Array<{ content_type: string | null }>) {
          if (row.content_type === "gear") aiGeneratedGear += 1;
          if (row.content_type === "blog") aiGeneratedBlog += 1;
        }
      }

      setStats({
        destinations: dPub.count || 0,
        destinationDrafts: dDraft.count || 0,
        aiGeneratedDestinations: aiGenerated.count || 0,
        aiGeneratedGear,
        aiGeneratedBlog,
        gear: gPub.count || 0,
        gearDrafts: gDraft.count || 0,
        blog: bPub.count || 0,
        blogDrafts: bDraft.count || 0,
        quiz: q.count || 0,
        sentinelLeads: sentinelLeads.count || 0,
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

      // 48h panels
      const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const [sentinelRecentRes, quizRecentRes] = await Promise.all([
        supabase
          .from("sentinel_leads")
          .select("email, source, created_at")
          .gte("created_at", cutoff48h)
          .eq("source", "sentinel-landing")
          .order("created_at", { ascending: false }),
        supabase
          .from("quiz_responses")
          .select("id, email, interest, recommended_destinations, created_at")
          .gte("created_at", cutoff48h)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (sentinelRecentRes.data) setSentinelRecent(sentinelRecentRes.data as SentinelLead[]);
      if (quizRecentRes.data) setQuizRecent(quizRecentRes.data as RecentQuizResponse[]);

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
  const aiGeneratedTotal = stats.aiGeneratedDestinations + stats.aiGeneratedGear + stats.aiGeneratedBlog;

  return (
    <div>
      {/* CHANGE 1: Top header bar */}
      <header className="flex items-center justify-between -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 md:mb-8 px-7 py-5 border-b border-[#E7E2D9] bg-[#FAFAFA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold text-[#1C1917] tracking-tight">Buenos días, Frank</h1>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#E6F0E9] text-[#166534] border border-[rgba(22,101,52,0.18)] tracking-widest">NOMADERIA · PRODUCCIÓN</span>
          </div>
          <p className="text-[12.5px] text-[#6B6660] mt-0.5">
            {new Date().toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
          </p>
        </div>
      </header>

      {/* CHANGE 2: Atención hoy — restyled */}
      <div
        className="mb-8"
        style={{
          border: '1px solid #F5C36B',
          borderLeft: '4px solid #F59E0B',
          background: 'linear-gradient(180deg,#FFF8EE,#FFFCF5)',
          borderRadius: 12,
          padding: '18px 20px 20px',
          boxShadow: '0 1px 0 rgba(245,158,11,0.12), 0 8px 24px -16px rgba(245,158,11,0.25)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B] flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-[#1C1917]" />
            </div>
            <span className="text-base font-bold text-[#1C1917]">Atención hoy</span>
            <span className="text-[11.5px] text-[#6B6660]">· {sentinelRecent.length + quizRecent.length} cosas pendientes</span>
          </div>
          <span className="text-[11px] text-[#9A938B]">Actualizado hace 2 min</span>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-2 gap-[18px]">
          {/* a) Sentinel leads últimas 48h */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10.5px] font-bold text-[#6B6660] tracking-[0.14em] uppercase">Leads de alerta · últimas 48h</p>
              <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1C1917]">{sentinelRecent.length}</span>
            </div>
            {sentinelRecent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin leads nuevos · Buen trabajo 👌</p>
            ) : (
              <div className="space-y-2">
                {sentinelRecent.map((lead) => (
                  <div
                    key={lead.email}
                    className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 bg-white border border-[#E7E2D9] rounded-lg"
                    style={{ padding: '10px 12px' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}
                    >
                      {lead.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1C1917] truncate">{lead.email}</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#6B6660]" />
                        <p className="text-[11.5px] text-[#6B6660]">{timeAgo(lead.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3E2] text-[#B45309] border border-[#F5C36B] animate-pulse shrink-0">Sin contactar</span>
                    <Button
                      size="sm"
                      className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border border-[#15803D] shrink-0"
                      onClick={() =>
                        window.open(
                          buildWhatsAppLink(
                            `Hola, vi que te interesaste en la alerta de permisos de Yosemite. ¿Tienes dudas? Con gusto te ayudo. — Frank, Nomaderia`
                          ),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* b) Quiz completados últimas 48h */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10.5px] font-bold text-[#6B6660] tracking-[0.14em] uppercase">Quiz completados · últimas 48h</p>
              <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#1C1917] text-white">{quizRecent.length}</span>
            </div>
            {quizRecent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin quizzes nuevos · Buen trabajo 👌</p>
            ) : (
              <div className="space-y-2">
                {quizRecent.map((q) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 bg-white border border-[#E7E2D9] rounded-lg"
                    style={{ padding: '10px 12px' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#1C1917,#374151)' }}
                    >
                      {(q.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1C1917] truncate">{q.email ?? "Sin email"}</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#6B6660]" />
                        <p className="text-[11.5px] text-[#6B6660]">
                          {q.recommended_destinations?.[0] ?? interestLabels[q.interest ?? ""] ?? q.interest ?? "—"} · {timeAgo(q.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3E2] text-[#B45309] border border-[#F5C36B] animate-pulse shrink-0">Sin contactar</span>
                    {q.email ? (
                      <Button
                        size="sm"
                        className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border border-[#15803D] shrink-0"
                        onClick={() =>
                          window.open(
                            buildWhatsAppLink(
                              `Hola 👋 Vi que completaste el quiz de Nomaderia y tu destino ideal es ${q.recommended_destinations?.[0] ?? q.interest ?? "un parque nacional"}. ¿Te ayudo a planear tu aventura? — Frank, Nomaderia`
                            ),
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        WhatsApp
                      </Button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
            <CardTitle className="text-sm font-medium text-card-foreground/70">Generación con IA</CardTitle>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{aiGeneratedTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Destinos: {stats.aiGeneratedDestinations} · Gear: {stats.aiGeneratedGear} · Blog: {stats.aiGeneratedBlog}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {aiGeneratedTotal} generados con IA · ≈ {(aiGeneratedTotal * 2.5).toLocaleString("es-MX", { maximumFractionDigits: 1 })} h ahorradas (estimado)
            </p>
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

        <Card
          className={cn("border", stats.sentinelLeads > 0 ? "bg-[#FFF8EE] border-[#F5C36B]" : "bg-card border-border")}
          style={stats.sentinelLeads > 0 ? { boxShadow: '0 1px 0 rgba(245,158,11,0.15)' } : undefined}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground/70">Leads de Alerta</CardTitle>
            <Bell className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-card-foreground">{stats.sentinelLeads}</p>
              {stats.sentinelLeads > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#1C1917] tracking-wide">NUEVO</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">sentinel_leads</p>
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
        <Button asChild className="bg-[#D97706] hover:bg-[#D97706]/90 text-white">
          <Link to="/admin/destinations/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Destino</Link>
        </Button>
        <Button asChild variant="outline" className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#F5F0E8]">
          <Link to="/admin/gear-articles/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Artículo</Link>
        </Button>
        <Button asChild variant="outline" className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#F5F0E8]">
          <Link to="/admin/blog-posts/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Post</Link>
        </Button>
      </div>

      {/* CHANGE 5: Activity + Analytics side by side */}
      <div className="grid grid-cols-[1.15fr_1fr] gap-4">
        {/* CHANGE 4: Analytics 2×2 grid */}
        {stats.quiz > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl text-foreground">Analytics del Quiz</h2>
              <span className="text-xs text-muted-foreground">({stats.quiz} respuestas)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E7E2D9] rounded-xl p-3.5">
                <p className="text-sm font-medium text-card-foreground/70 mb-3">Paisaje Favorito</p>
                <MiniBar data={quizAnalytics.interests} labels={interestLabels} />
              </div>
              <div className="bg-white border border-[#E7E2D9] rounded-xl p-3.5">
                <p className="text-sm font-medium text-card-foreground/70 mb-3">Origen de Audiencia</p>
                <MiniBar data={quizAnalytics.origins} labels={originLabels} />
              </div>
              <div className="bg-white border border-[#E7E2D9] rounded-xl p-3.5">
                <p className="text-sm font-medium text-card-foreground/70 mb-3">Presupuesto</p>
                <MiniBar data={quizAnalytics.budgets} labels={budgetLabels} />
              </div>
              <div className="bg-white border border-[#E7E2D9] rounded-xl p-3.5">
                <p className="text-sm font-medium text-card-foreground/70 mb-3">Nivel Físico</p>
                <MiniBar data={quizAnalytics.fitness} labels={fitnessLabels} />
              </div>
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <div>
            <h2 className="font-serif text-xl text-foreground mb-3">Actividad Reciente</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              {recent.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* CHANGE 6: type badge colors */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0",
                        item.type === "blog" && "bg-[#F0EBE0] text-[#78350F] border-transparent",
                        item.type === "destination" && "bg-[#FEF3E2] text-[#B45309] border-transparent",
                        item.type === "gear" && "bg-[#E6F0E9] text-[#166534] border-transparent",
                      )}
                    >
                      {typeLabel[item.type]}
                    </Badge>
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
    </div>
  );
};

export default AdminDashboard;
