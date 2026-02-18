import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Mail, Mountain } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCanonical } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";

const SobreNosotros = () => {
  useCanonical();

  useEffect(() => {
    document.title = "Sobre Nosotros — Nomaderia";
    return () => { document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando"; };
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-28 pb-12 max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-widest">Nomaderia Adventures</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Sobre Nosotros
        </h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          Somos Nomaderia: una plataforma creada por una agente de viajes certificado para ayudarte a planear tu primera aventura de trekking o mochilero, sin perderte en la información y sin gastar de más.
        </p>
      </section>

      {/* Agente certificado */}
      <section className="container mx-auto px-4 pb-16 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl p-8 space-y-8">

          {/* Badge de credencial */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
              <BadgeCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Credencial oficial</p>
              <h2 className="font-serif text-2xl text-foreground mb-2">Agente de Viajes Certificada</h2>
              <p className="text-stone-800 leading-relaxed">
                Cuento con diploma oficial como Agente de Viajes, lo que me permite orientarte con fundamentos reales: desde cómo conseguir los mejores precios en vuelos hasta qué equipaje llevar según el clima del destino.
              </p>
            </div>
          </div>

          {/* Imagen del diploma */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Mi diploma como Agente de Viajes:</p>
            <div className="rounded-xl overflow-hidden border border-border bg-muted">
              <img
                src="/diploma.jpg"
                alt="Diploma de Agente de Viajes — Nomaderia"
                className="w-full object-contain max-h-[480px]"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              {/* Placeholder visible solo si la imagen no carga */}
              <div
                className="hidden items-center justify-center py-16 px-8 text-center"
                aria-hidden="true"
              >
                <div>
                  <BadgeCheck className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Coloca tu imagen en <code className="bg-muted-foreground/10 px-1 rounded text-xs">public/diploma.jpg</code> para que aparezca aquí.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="container mx-auto px-4 pb-16 max-w-3xl space-y-6">
        <h2 className="font-serif text-2xl text-foreground">Nuestra misión</h2>
        <p className="text-foreground/70 leading-relaxed">
          Queremos que cualquier persona, sin importar su experiencia previa, pueda planear una aventura segura, significativa y dentro de su presupuesto. Combinamos el conocimiento de una agente de viajes con herramientas digitales —quiz de destinos, guías de gear, calculadora de presupuesto e itinerarios personalizados— para que tú solo te preocupes por disfrutar el camino.
        </p>

        <ul className="space-y-3">
          {[
            "Información honesta y sin relleno.",
            "Recomendaciones basadas en experiencia real de campo.",
            "Accesible para quienes viajan por primera vez.",
            "Sin vender sueños: solo rutas reales y presupuestos alcanzables.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground/70">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA contacto */}
      <section className="container mx-auto px-4 pb-20 max-w-3xl">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl text-foreground mb-3">¿Tienes alguna pregunta?</h2>
          <p className="text-foreground/70 mb-6">
            Escríbeme directamente. Estoy aquí para ayudarte a planear tu próxima aventura.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <a href="mailto:nomaderia.travel@gmail.com" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                nomaderia.travel@gmail.com
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/calculadora">Calcular mi presupuesto</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default SobreNosotros;
