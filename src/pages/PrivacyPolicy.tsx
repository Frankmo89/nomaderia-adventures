import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { usePageMeta } from "@/hooks/use-seo";

const PrivacyPolicy = () => {
  usePageMeta({
    title: "Política de Privacidad | Nomaderia",
    description: "Política de privacidad de Nomaderia Adventures.",
  });

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <h1 className="font-serif text-4xl text-foreground mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: septiembre de 2026</p>

        <div className="space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">1. Responsable del tratamiento</h2>
            <p>
              <strong className="text-foreground">Nomaderia Adventures</strong> («Nomaderia», «nosotros») es responsable del tratamiento de tus datos personales. Operamos un servicio con sede en Estados Unidos, orientado a hispanos residentes en EE. UU. (mercado primario: Sur de California / San Diego).
            </p>
            <p className="mt-2">
              {/* ⚠️ VERIFICAR: entidad legal exacta, dirección comercial y si aplica CCPA/CPRA como «business» vs. umbral de ingresos. */}
              Esta política se interpreta conforme a las leyes de privacidad aplicables de los Estados Unidos y del Estado de California.{" "}
              <span className="text-sage text-sm">⚠️ VERIFICAR</span>
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
            <p className="mt-2">
              El pago del Itinerario Completo Nomaderia ($49 USD) se procesa en la página de checkout alojada por <strong className="text-foreground">Stripe</strong>. Nomaderia no almacena números de tarjeta ni datos sensibles de pago.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">3. Finalidad del tratamiento</h2>
            <p>Utilizamos tus datos para:</p>
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
              <li><strong className="text-foreground">Resend</strong> — envío de correos transaccionales y de newsletter.</li>
            </ul>
            <p className="mt-2">
              Estos proveedores actúan como proveedores de servicio y están obligados contractualmente a proteger tus datos.{" "}
              <span className="text-sage text-sm">⚠️ VERIFICAR</span>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">6. Conservación de datos</h2>
            <p>
              Conservamos tus datos mientras sean necesarios para la finalidad con la que fueron recabados o hasta que solicites su eliminación. Los suscriptores al newsletter pueden darse de baja en cualquier momento escribiendo a <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a> o usando el enlace de baja en nuestros correos.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">7. Tus derechos de privacidad</h2>
            <p>
              {/* ⚠️ VERIFICAR: alcance exacto CCPA/CPRA (acceso, eliminación, corrección, opt-out de venta/compartición, no discriminación) y plazos de respuesta. */}
              Según las leyes de privacidad de California y otras normas aplicables en EE. UU., puedes solicitar acceso a la información personal que tenemos sobre ti, pedir su corrección o eliminación, y oponerte a ciertos usos.{" "}
              <span className="text-sage text-sm">⚠️ VERIFICAR</span>
            </p>
            <p className="mt-2">
              Para ejercer estos derechos, envía un correo a{" "}
              <a href="mailto:nomaderia.travel@gmail.com" className="text-primary hover:underline">nomaderia.travel@gmail.com</a>{" "}
              con el asunto «Privacidad» indicando tu nombre y la solicitud específica. Responderemos en un plazo razonable conforme a la ley aplicable.{" "}
              <span className="text-sage text-sm">⚠️ VERIFICAR</span>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">8. Legislación aplicable</h2>
            <p>
              Esta política se rige por las leyes de los Estados Unidos de América y del Estado de California, sin perjuicio de las normas de protección al consumidor que te correspondan por tu lugar de residencia. Para cualquier controversia relacionada con el tratamiento de datos o con esta política, las partes se someten a los tribunales competentes del Condado de San Diego, California, salvo que la ley aplicable exija otro foro.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad en cualquier momento. La fecha de última actualización siempre estará visible al inicio de esta página. El uso continuado del sitio después de cualquier cambio implica tu aceptación de la política actualizada.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-foreground mb-3">10. Contacto</h2>
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
