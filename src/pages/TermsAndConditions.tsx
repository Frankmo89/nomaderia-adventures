import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCanonical } from "@/hooks/use-seo";
import { useEffect } from "react";

const TermsAndConditions = () => {
  useCanonical();

  useEffect(() => {
    document.title = "Términos y Condiciones — Nomaderia";
    return () => { document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando"; };
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <h1 className="font-serif text-4xl text-foreground mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: marzo de 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar el sitio web de <strong className="text-foreground">Nomaderia Adventures</strong> («Nomaderia», «nosotros»), aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices el sitio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">2. Descripción del servicio</h2>
            <p>
              Nomaderia es una plataforma informativa orientada a viajeros hispanohablantes que desean planear aventuras outdoor (trekking, mochilero). Ofrecemos guías de destinos, recomendaciones de equipo, una calculadora de presupuesto, un quiz de destinos y, a través de agentes certificados, itinerarios personalizados de pago.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">3. Aviso de afiliados</h2>
            <p>
              Nomaderia participa en programas de afiliados con terceros (entre otros, Travelpayouts y Amazon Associates). Esto significa que podemos recibir una comisión cuando realizas una compra o reserva a través de los enlaces publicados en el sitio, <strong className="text-foreground">sin costo adicional para ti</strong>.
            </p>
            <p className="mt-2">
              Las comisiones recibidas nos permiten mantener el sitio activo y seguir produciendo contenido gratuito de calidad. Nuestras opiniones y recomendaciones son independientes y no están condicionadas por dichas comisiones.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">4. Uso del contenido</h2>
            <p>
              Todo el contenido publicado en Nomaderia (textos, imágenes, guías, itinerarios) es propiedad de Nomaderia Adventures o de sus respectivos titulares y está protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización previa por escrito.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">5. Exención de responsabilidad</h2>
            <p>
              La información publicada en Nomaderia tiene carácter orientativo. Las aventuras outdoor conllevan riesgos inherentes; el usuario es responsable de evaluar su condición física, contratar seguros de viaje adecuados y cumplir con las regulaciones locales de cada destino. Nomaderia no se hace responsable por daños, pérdidas o accidentes que puedan derivarse del uso de la información proporcionada.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">6. Itinerarios personalizados</h2>
            <p>
              Los itinerarios personalizados son elaborados por agentes de viajes certificados y tienen un costo adicional. La contratación de estos servicios queda sujeta a las condiciones específicas acordadas entre el usuario y el agente al momento de la solicitud.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">7. Modificaciones</h2>
            <p>
              Nomaderia se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. La fecha de última actualización siempre estará visible al inicio de esta página. El uso continuado del sitio después de cualquier cambio implica tu aceptación de los términos actualizados.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">8. Legislación aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, incluyendo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Para cualquier controversia, las partes se someten a los tribunales competentes de México.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">9. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos términos, escríbenos a{" "}
              <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a>.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </main>
  );
};

export default TermsAndConditions;
