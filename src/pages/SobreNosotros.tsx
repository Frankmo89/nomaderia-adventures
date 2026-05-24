import { Link } from "react-router-dom";
import { BadgeCheck, Mail, Mountain, ShieldCheck } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { usePageMeta, SITE_URL } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/JsonLd";

const SobreNosotros = () => {
  usePageMeta({
    title: "Sobre Nomaderia — Agente de Viajes TAP Certificado",
    description: "Conoce a Frank, agente TAP certificado que ayuda a hispanos en EE. UU. a planear su primera aventura en parques nacionales. En español.",
  });

  const profileLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Frank",
      jobTitle: "Agente de Viajes TAP Certificado",
      worksFor: {
        "@type": "TravelAgency",
        name: "Nomaderia Adventures",
        url: SITE_URL,
      },
      knowsAbout: ["Hiking", "Trekking", "National Parks", "Travel Planning"],
    },
    url: `${SITE_URL}/sobre-nosotros`,
    inLanguage: "es",
  };

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={profileLd} />

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
          Somos Nomaderia: una plataforma creada por un agente de viajes certificado para ayudarte a planear tu primera aventura de trekking o mochilero, sin perderte en la información y sin gastar de más.
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
              <h2 className="font-serif text-2xl text-foreground mb-2">Plataforma respaldada por Agentes Certificados</h2>
              <p className="text-stone-800 leading-relaxed">
                Contamos con certificación oficial como Agentes de Viajes, lo que nos permite orientarte con fundamentos reales: desde cómo conseguir los mejores precios en vuelos hasta qué equipaje llevar según el clima del destino.
              </p>
            </div>
          </div>

          {/* Imagen del diploma */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Nuestra certificación como Agentes de Viajes:</p>
            {/* TODO: replace with <img> once Frank uploads the file */}
            <div className="rounded-xl border border-secondary bg-secondary/10 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-full bg-secondary/20 p-3">
                  <ShieldCheck className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-foreground mb-1">
                    Agente de Viajes Certificado TAP
                  </h3>
                  <p className="text-foreground/80">
                    The Travel Institute — National TAP Test
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
          Queremos que cualquier persona, sin importar su experiencia previa, pueda planear una aventura segura, significativa y dentro de su presupuesto. Combinamos el conocimiento de un agente de viajes con herramientas digitales —quiz de destinos, guías de gear, calculadora de presupuesto e itinerarios personalizados— para que tú solo te preocupes por disfrutar el camino.
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
            Escríbenos directamente. Estamos aquí para ayudarte a planear tu próxima aventura.
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
