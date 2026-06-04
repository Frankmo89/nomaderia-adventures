import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { Mountain, LayoutDashboard, MapPin, BookOpen, MessageSquare, Users, LogOut, FileText, Compass, Mail, ImageIcon, ShieldCheck, ChevronDown, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Destinos", href: "/admin/destinations", icon: MapPin },
  { label: "Gear Articles", href: "/admin/gear-articles", icon: BookOpen },
  { label: "Blog Posts", href: "/admin/blog-posts", icon: FileText },
  { label: "Ventanas de Permiso", href: "/admin/permit-windows", icon: BellRing },
  { label: "Alertas de Permiso", href: "/admin/permit-alerts", icon: Bell },
  { label: "Itinerarios", href: "/admin/itinerary-requests", icon: Compass },
  { label: "Leads de Alerta", href: "/admin/sentinel-leads", icon: Bell, alert: true },
  { label: "Quiz Responses", href: "/admin/quiz-responses", icon: MessageSquare },
  { label: "Subscribers", href: "/admin/subscribers", icon: Users },
  { label: "Email Logs", href: "/admin/email-logs", icon: Mail },
  { label: "Galería", href: "/admin/gallery", icon: ImageIcon },
  { label: "Auditoría", href: "/admin/audit", icon: ShieldCheck },
];

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [recentLeadCount, setRecentLeadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (!isAdmin) { await supabase.auth.signOut(); navigate("/admin/login"); return; }
      setLoading(false);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    supabase
      .from("sentinel_leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff)
      .then(({ count }) => {
        if (count !== null) setRecentLeadCount(count);
      });
  }, [loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Verificando sesión...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 hidden md:flex">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-[30px] h-[30px] rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Mountain className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-widest text-sidebar-foreground">NOMADERIA</span>
              <span className="text-[10px] text-sidebar-foreground/55 tracking-[0.18em] uppercase">Admin</span>
            </div>
          </Link>
        </div>
        {/* Workspace pill */}
        <div className="flex items-center justify-between px-3 py-2 mx-3 mt-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] shadow-[0_0_0_3px_rgba(22,101,52,0.18)]" />
            <span className="text-[12px] font-medium text-sidebar-foreground">Producción</span>
          </div>
          <ChevronDown className="h-3 w-3 text-sidebar-foreground/55" />
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4">
          {links.map((l) => {
            const active = location.pathname === l.href || (l.href !== "/admin" && location.pathname.startsWith(l.href));
            return (
              <Link key={l.href} to={l.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[rgba(217,119,6,0.10)] text-[#FBBF24] font-semibold"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50"
                )}>
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-sm bg-primary" />
                )}
                <l.icon className={cn("h-4 w-4", active ? "text-primary" : l.alert ? "text-[#F59E0B]" : "")} />
                {l.label}
                {l.alert && recentLeadCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{recentLeadCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* User + Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              FR
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-sidebar-foreground">Frank</span>
              <span className="text-[11px] text-sidebar-foreground/55 truncate">frank@nomaderia.travel</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border p-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Mountain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-widest text-sidebar-foreground">NOMADERIA</span>
        </Link>
        <div className="flex gap-2 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.href} to={l.href}
              className={cn("text-xs px-2 py-1 rounded",
                location.pathname === l.href ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60"
              )}>
              {l.label}
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground/70 shrink-0" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
