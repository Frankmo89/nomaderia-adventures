import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Mountain, ArrowLeft } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/use-seo";

const NotFound = () => {
  const location = useLocation();

  usePageMeta({
    title: "Página no encontrada | Nomaderia",
    description: "La ruta que buscas no existe. Explora destinos, guías de equipo y blog de aventura en Nomaderia.",
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    console.warn("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <Mountain className="h-16 w-16 text-primary mx-auto mb-6 opacity-60" />
          <h1 className="font-serif text-7xl font-bold text-foreground mb-2">404</h1>
          <p className="text-xl text-foreground font-medium mb-3">Página no encontrada</p>
          <p className="text-muted-foreground mb-8">
            La ruta <code className="text-sm bg-accent px-1.5 py-0.5 rounded">{location.pathname}</code> no existe o fue movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/destinos">Ver destinos</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default NotFound;
