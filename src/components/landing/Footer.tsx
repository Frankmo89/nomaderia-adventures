import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Mountain, Instagram, Youtube } from "lucide-react";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Mountain className="h-5 w-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">NOMADERIA</span>
            </Link>
            <p className="text-sm text-muted-foreground">Tu primera aventura empieza aquí.</p>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <a href="#destinos" className="text-sm text-muted-foreground hover:text-foreground">Destinos</a>
              <Link to="/gear" className="text-sm text-muted-foreground hover:text-foreground">Gear Guide</Link>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground">Sobre Nosotros</a>
            </div>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contacto</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Política de Privacidad</a>
            </div>
          </div>

          {/* Social */}
          <div className="flex gap-4">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube" className="text-muted-foreground hover:text-primary"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">© 2025 Nomaderia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
