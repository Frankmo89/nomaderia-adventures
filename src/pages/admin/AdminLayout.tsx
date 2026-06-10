import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  Mountain, LayoutDashboard, MapPin, BookOpen, MessageSquare, Users,
  LogOut, FileText, Compass, Mail, ImageIcon, ShieldCheck, ChevronDown,
  BellRing, BellPlus, Target, Menu, Inbox, Sparkles, LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  alert?: boolean;
};

type NavGroup = {
  label: string;
  links: NavItem[];
};

const dashboardLink: NavItem = { label: "Dashboard", href: "/admin", icon: LayoutDashboard };

const navGroups: NavGroup[] = [
  {
    label: "Contenido",
    links: [
      { label: "Destinos", href: "/admin/destinations", icon: MapPin },
      { label: "Gear Articles", href: "/admin/gear-articles", icon: BookOpen },
      { label: "Blog Posts", href: "/admin/blog-posts", icon: FileText },
    ],
  },
  {
    label: "Leads",
    links: [
      { label: "Todos los Leads", href: "/admin/leads", icon: Inbox },
      { label: "Leads de Alerta", href: "/admin/sentinel-leads", icon: Target, alert: true },
      { label: "Quiz Responses", href: "/admin/quiz-responses", icon: MessageSquare },
      { label: "Solicitudes", href: "/admin/itinerary-requests", icon: Compass },
      { label: "Plantillas de Itinerario", href: "/admin/itinerary-templates", icon: LayoutList },
      { label: "Alertas de Permiso", href: "/admin/permit-alerts", icon: BellPlus },
      { label: "Ventanas de Permiso", href: "/admin/permit-windows", icon: BellRing },
    ],
  },
  {
    label: "Datos",
    links: [
      { label: "Subscribers", href: "/admin/subscribers", icon: Users },
      { label: "Email Logs", href: "/admin/email-logs", icon: Mail },
      { label: "Galería", href: "/admin/gallery", icon: ImageIcon },
    ],
  },
  {
    label: "Sistema",
    links: [
      { label: "Auditoría", href: "/admin/audit", icon: ShieldCheck },
      { label: "Nuestro SOUL", href: "/admin/soul", icon: Sparkles },
    ],
  },
];

type NavItemLinkProps = {
  item: NavItem;
  active: boolean;
  recentLeadCount: number;
  onNavigate?: () => void;
};

const NavItemLink = ({ item, active, recentLeadCount, onNavigate }: NavItemLinkProps) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        active
          ? "bg-[rgba(217,119,6,0.10)] text-[#FBBF24] font-semibold"
          : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50"
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-sm bg-primary" />}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : item.alert ? "text-[#F59E0B]" : "")} />
      {item.label}
      {item.alert && recentLeadCount > 0 && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
          {recentLeadCount}
        </span>
      )}
    </Link>
  );
};

type GroupedNavProps = {
  currentPath: string;
  recentLeadCount: number;
  onNavigate?: () => void;
};

const GroupedNav = ({ currentPath, recentLeadCount, onNavigate }: GroupedNavProps) => {
  const isActive = (href: string) =>
    currentPath === href || (href !== "/admin" && currentPath.startsWith(href));
  return (
    <nav className="flex-1 py-2">
      <NavItemLink
        item={dashboardLink}
        active={isActive(dashboardLink.href)}
        recentLeadCount={recentLeadCount}
        onNavigate={onNavigate}
      />
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="text-xs tracking-wide uppercase text-stone-500 mb-1 mt-4 px-4">
            {group.label}
          </p>
          {group.links.map((link) => (
            <NavItemLink
              key={link.href}
              item={link}
              active={isActive(link.href)}
              recentLeadCount={recentLeadCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
};

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [recentLeadCount, setRecentLeadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      setUserEmail(session.user.email ?? null);
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

  const avatarInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  const UserSection = () => (
    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
          {avatarInitials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] text-sidebar-foreground/55 truncate">{userEmail ?? "Admin"}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
      </Button>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      Verificando sesión...
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 hidden md:flex">
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
        <div className="flex items-center justify-between px-3 py-2 mx-3 mt-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534] shadow-[0_0_0_3px_rgba(22,101,52,0.18)]" />
            <span className="text-[12px] font-medium text-sidebar-foreground">Producción</span>
          </div>
          <ChevronDown className="h-3 w-3 text-sidebar-foreground/55" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <GroupedNav currentPath={location.pathname} recentLeadCount={recentLeadCount} />
        </div>
        <UserSection />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border p-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Mountain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-widest text-sidebar-foreground">NOMADERIA</span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-0 gap-0 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col"
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <div className="p-4 pr-10 border-b border-sidebar-border shrink-0">
              <Link
                to="/admin"
                className="flex items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-[30px] h-[30px] rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Mountain className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-widest text-sidebar-foreground">NOMADERIA</span>
                  <span className="text-[10px] text-sidebar-foreground/55 tracking-[0.18em] uppercase">Admin</span>
                </div>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GroupedNav
                currentPath={location.pathname}
                recentLeadCount={recentLeadCount}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <UserSection />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto md:p-8 p-4 pt-16 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
