import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-serif font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl text-foreground">Página no encontrada</p>
        <p className="mb-8 text-muted-foreground">La página que buscas no existe o fue movida.</p>
        <Link to="/" className="text-primary underline hover:text-primary/90 font-medium">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
