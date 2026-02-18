import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, BookOpen, MessageSquare, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ destinations: 0, gear: 0, quiz: 0, subscribers: 0 });

  useEffect(() => {
    const load = async () => {
      const [d, g, q, s] = await Promise.all([
        supabase.from("destinations").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("gear_articles").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("quiz_responses").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        destinations: d.count || 0,
        gear: g.count || 0,
        quiz: q.count || 0,
        subscribers: s.count || 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Destinos Publicados", value: stats.destinations, icon: MapPin, color: "text-primary" },
    { label: "Gear Articles", value: stats.gear, icon: BookOpen, color: "text-secondary" },
    { label: "Quiz Responses", value: stats.quiz, icon: MessageSquare, color: "text-accent" },
    { label: "Subscribers", value: stats.subscribers, icon: Users, color: "text-trail" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground/70">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-card-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/admin/destinations/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Destino</Link>
        </Button>
        <Button asChild variant="outline" className="border-border text-foreground hover:bg-muted">
          <Link to="/admin/gear-articles/new"><Plus className="h-4 w-4 mr-2" /> Nuevo Artículo</Link>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
