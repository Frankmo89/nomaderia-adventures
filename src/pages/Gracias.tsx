import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-seo";

const Gracias = () => {
  usePageMeta({
    title: "¡Gracias por tu compra!",
    description: "Confirmación de compra de la alerta de permisos de Nomaderia.",
    robots: "noindex, nofollow",
  });

  return (
    <main className="bg-background min-h-screen text-foreground">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <Card className="mx-auto max-w-2xl border-border/60">
          <CardContent className="p-6 md:p-10 space-y-6">
            <div className="space-y-3">
              <h1 className="font-serif text-3xl md:text-4xl leading-tight">
                ¡Listo, eres parte de Nomaderia!
              </h1>
              <p className="text-base md:text-lg text-foreground/80">
                Ya recibimos tu pago correctamente. En las próximas 24 horas te
                vamos a contactar por WhatsApp para empezar a trabajar en tu spot
                de Yosemite y ayudarte a aumentar tus probabilidades de conseguir
                permiso.
              </p>
            </div>

            <div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a
                  href="https://nomaderia.com/sentinel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Compartir la alerta con alguien más
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
};

export default Gracias;
