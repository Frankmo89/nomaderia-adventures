import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useCanonical } from "@/hooks/use-seo";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  useCanonical();

  useEffect(() => {
    document.title = "Política de Privacidad — Nomaderia";
    return () => { document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando"; };
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <h1 className="font-serif text-4xl text-foreground mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: febrero de 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong className="text-foreground">Nomaderia Adventures</strong> («Nomaderia», «nosotros») es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.
            </p>
            <p className="mt-2">
              Contacto: <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">2. Datos que recopilamos</h2>
            <p>Recopilamos únicamente los datos que tú nos proporcionas de forma voluntaria:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-foreground">Newsletter:</strong> dirección de correo electrónico.</li>
              <li><strong className="text-foreground">Quiz de destinos:</strong> preferencias de viaje (nivel físico, tipo de experiencia, duración, estilo) y, opcionalmente, correo electrónico.</li>
              <li><strong className="text-foreground">Solicitud de itinerario personalizado:</strong> nombre, correo electrónico, destino de interés, presupuesto estimado y mensaje opcional.</li>
            </ul>
            <p className="mt-2">No recopilamos datos de pago ni datos sensibles.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">3. Finalidad del tratamiento</h2>
            <p>Utilisamos tus datos para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enviarte contenido de valor sobre aventura y trekking (newsletter).</li>
              <li>Recomendarte destinos según tu perfil (quiz).</li>
              <li>Elaborar y enviarte un itinerario de viaje personalizado (solicitud de itinerario).</li>
              <li>Mejorar el contenido del sitio basándonos en las preferencias de nuestros usuarios.</li>
            </ul>
            <p className="mt-2">No vendemos, rentamos ni compartimos tus datos con terceros para fines de marketing.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">4. Links de afiliados</h2>
            <p>
              Nomaderia incluye enlaces de afiliados a servicios de terceros (vuelos, hoteles, seguros de viaje, equipo outdoor). Si realizas una compra a través de estos enlaces, podemos recibir una comisión sin costo adicional para ti. Estos enlaces están claramente identificados en el sitio.
            </p>
            <p className="mt-2">
              No compartimos tus datos personales con los proveedores afiliados. La comisión se genera únicamente a partir de la visita al enlace, no de tu información personal.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">5. Servicios de terceros</h2>
            <p>Utilizamos los siguientes servicios para operar el sitio:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-foreground">Supabase</strong> — almacenamiento seguro de datos (base de datos cifrada en reposo y en tránsito).</li>
            </ul>
            <p className="mt-2">
              Estos proveedores actúan como encargados del tratamiento y están obligados contractualmente a proteger tus datos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">6. Conservación de datos</h2>
            <p>
              Conservamos tus datos mientras sean necesarios para la finalidad con la que fueron recabados o hasta que solicites su eliminación. Los suscriptores al newsletter pueden darse de baja en cualquier momento escribiendo a <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">7. Derechos ARCO</h2>
            <p>
              De conformidad con la LFPDPPP, tienes derecho de <strong className="text-foreground">Acceso, Rectificación, Cancelación y Oposición</strong> (derechos ARCO) al tratamiento de tus datos personales.
            </p>
            <p className="mt-2">
              Para ejercer estos derechos, envía un correo a <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a> con el asunto «Derechos ARCO» indicando tu nombre y la solicitud específica. Responderemos en un plazo máximo de 20 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad en cualquier momento. La fecha de última actualización siempre estará visible al inicio de esta página. El uso continuado del sitio después de cualquier cambio implica tu aceptación de la política actualizada.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">9. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos, escríbenos a{" "}
              <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a>.
            </p>
          </section>

        </div>
      </div>
      <Footer />
    </main>
  );
};

export default PrivacyPolicy;
