import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { Mountain, Instagram, Facebook } from "lucide-react";
import { BRAND_ASSETS } from "@/config/assets";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer ref={ref} className="mt-10 rounded-t-[2.5rem] border-t border-stone/20 bg-walnut py-12 text-sand sm:mt-14">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              {BRAND_ASSETS.logo && !logoError ? (
                <img src={BRAND_ASSETS.logo} alt="Nomaderia" loading="lazy" className="h-7 w-auto" onError={() => setLogoError(true)} />
              ) : (
                <>
                  <Mountain className="h-5 w-5 text-clay" />
                  <span className="font-serif text-lg font-bold text-sand">NOMADERIA</span>
                </>
              )}
            </Link>
            <p className="text-sm text-stone/80">Tu primera aventura empieza aquí.</p>
          </div>

          {/* Links */}
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <Link to="/destinos" className="text-sm text-stone/80 transition-colors hover:text-sand">Destinos</Link>
              <Link to="/gear" className="text-sm text-stone/80 transition-colors hover:text-sand">Guía de Equipo</Link>
              <Link to="/blog" className="text-sm text-stone/80 transition-colors hover:text-sand">Blog</Link>
              <Link to="/calculadora" className="text-sm text-stone/80 transition-colors hover:text-sand">Calculadora</Link>
              <Link to="/sobre-nosotros" className="text-sm text-stone/80 transition-colors hover:text-sand">Sobre Nosotros</Link>
            </div>
            <div className="flex flex-col gap-2">
              <a href="mailto:nomaderia.travel@gmail.com" className="text-sm text-stone/80 transition-colors hover:text-sand">Contacto</a>
              <Link to="/privacidad" className="text-sm text-stone/80 transition-colors hover:text-sand">Política de Privacidad</Link>
              <Link to="/terminos" className="text-sm text-stone/80 transition-colors hover:text-sand">Términos y Condiciones</Link>
            </div>
          </div>

          {/* Social */}
          <div className="flex gap-4">
            <a href="https://www.instagram.com/nomaderia.mx?igsh=cXo4ZGJtNzVlYmg0&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-stone/80 transition-colors hover:text-clay"><Instagram className="h-5 w-5" /></a>
            <a href="https://www.facebook.com/share/18TEHSVdRh/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-stone/80 transition-colors hover:text-clay"><Facebook className="h-5 w-5" /></a>
            <a href="https://www.tiktok.com/@nomaderia.mx?_r=1&_t=ZS-942FckLgcsS" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-stone/80 transition-colors hover:text-clay">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.03a8.16 8.16 0 0 0 4.77 1.52V7.11a4.85 4.85 0 0 1-1-.42z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 space-y-2 border-t border-stone/20 pt-8 text-center">
          <p className="text-xs text-stone/75">Aviso de Afiliados: Nomaderia puede recibir una comisión por las compras realizadas a través de nuestros enlaces recomendados, sin costo adicional para ti.</p>
          <p className="text-xs text-stone/75">© {new Date().getFullYear()} Nomaderia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
