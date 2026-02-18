import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { Mountain, LayoutDashboard, MapPin, BookOpen, MessageSquare, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Destinos", href: "/admin/destinations", icon: MapPin },
  { label: "Gear Articles", href: "/admin/gear-articles", icon: BookOpen },
  { label: "Quiz Responses", href: "/admin/quiz-responses", icon: MessageSquare },
  { label: "Subscribers", href: "/admin/subscribers", icon: Users },
];

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      setLoading(false);
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Verificando sesión...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/admin" className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-sidebar-primary" />
            <span className="font-serif text-lg font-bold text-sidebar-foreground">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {links.map((l) => {
            const active = location.pathname === l.href || (l.href !== "/admin" && location.pathname.startsWith(l.href));
            return (
              <Link key={l.href} to={l.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}>
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border p-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <Mountain className="h-5 w-5 text-sidebar-primary" />
          <span className="font-serif font-bold text-sidebar-foreground">Admin</span>
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
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground/70 shrink-0">
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
