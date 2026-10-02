# Copy audit — customer-facing text

> **READ-ONLY audit** (branch `docs/copy-audit-share-previews`, 2026-10-02 PT).  
> Quotes from code / content files on `main` @ `0c719f0`. No application code changed.  
> **Product freeze:** one paid offer — Itinerario Completo Nomaderia **$49 USD** via WhatsApp (ADR-012).  
> **Market:** hispanos en EE. UU. (SoCal / San Diego primary).  
> Flag columns mark rows that hit audit criteria (prices≠$49 itinerary, MXN/Mexico/Tijuana market framing, card/Stripe checkout, delivery times, 24/7 or support promises, AI features, hard numbers, testimonials, certifications, law/jurisdiction).

**Flag legend:** `PRICE` · `MX` · `PAY` · `DELIVERY` · `SUPPORT` · `AI` · `NUM` · `TESTIMONIAL` · `CERT` · `LAW`

**CMS note:** Blog/gear/destination body copy lives in Supabase (`blog_posts`, `gear_articles`, `destinations`). This audit lists UI chrome + sample CMS titles/descriptions from live DB; it does **not** invent body paragraphs. Sample live URLs cited under Share Previews / Blog.

**Not mounted on `/` today:** `DidYouKnowSection.tsx` still ships Mexico/CDMX copy but is **not** imported by `Index.tsx` (listed under Orphan for awareness).

---

## 1) Global shell (all public routes)

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `*` (nav) | `src/components/landing/Navbar.tsx` | Destinos | |
| `*` | same | Guía de Equipo | |
| `*` | same | Blog | |
| `*` | same | Servicios | |
| `*` | same | Calculadora | |
| `*` | same | Sobre Nosotros | |
| `*` | same | Descubre Tu Aventura | |
| `*` | same | Abrir menú de navegación / Cerrar menú de navegación | |
| `*` (footer) | `src/components/landing/Footer.tsx` | NOMADERIA | |
| `*` | same | Tu primera aventura empieza aquí. | |
| `*` | same | Destinos · Guía de Equipo · Blog · Calculadora · Sobre Nosotros · Contacto · Política de Privacidad · Términos y Condiciones | |
| `*` | same | Aviso de Afiliados: Nomaderia puede recibir una comisión por las compras realizadas a través de nuestros enlaces recomendados, sin costo adicional para ti. | |
| `*` | same | © {year} Nomaderia. Todos los derechos reservados. | |
| `*` | same | mailto label Contacto → `nomaderia.travel@gmail.com` | |
| `*` (SPA shell) | `index.html` | `<title>` Nomaderia - Aventuras y Senderismo | |
| `*` | same | meta description / og:description: Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. | |
| `*` | same | og:title / twitter:title: Nomaderia - Aventuras y Senderismo | |
| `*` | same | og:image / twitter:image: `https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg` | |
| `*` (concierge) | `src/components/ConciergeLauncher.tsx` | aria: Abrir concierge Nomaderia / Cerrar concierge Nomaderia / Concierge Nomaderia | `AI` |
| `*` | `src/components/ConciergeChat.tsx` | Concierge Nomaderia | `AI` |
| `*` | same | Responde desde guías verificadas por Frank | |
| `*` | same | Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda de los 63 parques — rutas, campamentos, presupuestos. Y si buscas tu destino ideal, prueba nuestro quiz gratuito 🧭 | `AI` `NUM` |
| `*` | same | (on destination) Soy el concierge de Nomaderia. Puedo ayudarte con cualquier duda sobre ${destinationTitle} — rutas, campamentos, presupuesto. | `AI` |
| `*` | same | placeholder ¿Qué tan difícil es? ¿Qué llevo?... | |
| `*` | same | Descubre tu aventura ideal (quiz gratis) → | |
| `*` | same | ¡Gracias! Te escribimos con ideas para tu próxima aventura 🏔️ | |
| `*` | same | ¿Prefieres que te escribamos por correo? | |
| `*` | same | Correo para seguir ayudándote | |
| `*` | same | Hubo un error al conectarme. Intenta de nuevo. | |
| `*` | `src/components/ErrorBoundary.tsx` | Algo salió mal | |

---

## 2) Home `/`

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `/` meta (JS) | `src/pages/Index.tsx` | Nomaderia — Aventuras en Parques Nacionales en Español *(usePageMeta; crawlers see `index.html` instead — see §Share)* | |
| `/` | same | Itinerarios personalizados y alertas de permisos para hispanos en EE. UU. Planea tu aventura en Yosemite, Grand Canyon y más. En español. | |
| `/` | same (JSON-LD) | Plataforma de aventuras outdoor para hispanohablantes principiantes | |
| `/` | same (JSON-LD TravelAgency) | priceRange: `$49 USD` | `PRICE` (allowed $49) |
| `/` hero | `src/components/landing/HeroSection.tsx` | Agente de Viajes Certificado (TAP) · Respuesta en < 24h | `CERT` `DELIVERY` `SUPPORT` |
| `/` | same | Tu Primera *Aventura* | |
| `/` | same | Te armo tu viaje completo —itinerario, equipo y presupuesto— adaptado a tu nivel. *Todo en español.* | |
| `/` | same | Plática Conmigo | |
| `/` | same | Explorar Destinos → | |
| `/` | same (WA prefill) | Hola Frank, quiero planear mi primera aventura | |
| `/` | `src/components/landing/PromiseSection.tsx` | Los parques más increíbles de EE.UU. te están esperando — y por fin alguien te explica cómo llegar. | |
| `/` | `src/components/landing/SocialProof.tsx` | RESPALDADO POR DATOS REALES | `NUM` |
| `/` | same | Desde 2024, llevamos a *la comunidad hispana* a sus primeras aventuras en los parques nacionales de EE. UU. — en español, sin suposiciones. | `NUM` |
| `/` | same | {destCount} / Destinos cubiertos con guía completa *(live count via `usePublicStats`)* | `NUM` |
| `/` | same | {guideCount} / Guías escritas en español de verdad | `NUM` |
| `/` | same | 24h / Tiempo máximo de entrega del itinerario | `DELIVERY` `SUPPORT` |
| `/` | same | $49 / Precio único, todo incluido, sin sorpresas | `PRICE` (allowed) |
| `/` | same | Certificación TAP · The Travel Institute, EE.UU. | `CERT` |
| `/` | same | Agente de viajes certificado — no somos un blog ni una app genérica. Servicio profesional en español. | `CERT` |
| `/` | `src/components/landing/DestinationsCatalog.tsx` | Encuentra Tu Aventura | |
| `/` | same | Elige tu nivel y descubre lo que es posible | |
| `/` | same | Explorar → · Ver todos los destinos → | |
| `/` | same | No se pudieron cargar los destinos. Intenta recargar la página. | |
| `/` | `src/components/landing/PainContrast.tsx` | La diferencia Nomaderia | |
| `/` | same | Planear tu primer parque no debería sentirse así | |
| `/` | same | Por tu cuenta / Con Nomaderia | |
| `/` | same | 01 20 pestañas abiertas — Permisos, reservas, clima, mapas... todo en inglés y en sitios distintos. | |
| `/` | same | 02 ¿Y si me pierdo algo? — Horas en blogs y YouTube sin saber qué aplica a TU viaje. | |
| `/` | same | 03 Miedo a equivocarte — ¿Necesito permiso? ¿Hay osos? ¿Qué llevo? Nadie te responde en español. | |
| `/` | same | 04 Al final, no vas — La mayoría pospone su primera aventura por no saber por dónde empezar. | |
| `/` | same | 01 Un mensaje de WhatsApp — Nos cuentas tu fecha, presupuesto y con quién viajas. En español, sin formularios. | |
| `/` | same | 02 Consulta de 5 minutos — Te hacemos las preguntas correctas para diseñar TU viaje, no uno genérico. | |
| `/` | same | 03 Itinerario completo en 24-48h — Rutas para principiantes, permisos explicados, qué empacar y plan B si algo falla. | `DELIVERY` |
| `/` | same | 04 Vas con confianza — Soporte por WhatsApp durante tu viaje. Nunca estás solo en el parque. | `SUPPORT` |
| `/` | same | Diseña mi aventura por WhatsApp | |
| `/` quiz | `src/components/landing/QuizSection.tsx` | ¿Desde dónde sales? / Así calculamos distancias y tiempos de manejo | |
| `/` | same | Manejando / Road trip desde tu casa · Volando / Tomo un vuelo y rento auto · Todavía no sé / Te mostramos de todo | |
| `/` | same | ¿En qué mes piensas ir? / Así evitamos parques fuera de temporada. Las fechas exactas las vemos después. | |
| `/` | same | ¿Con quién viajas? / Marca todo lo que aplique (puedes dejar vacío si van solo adultos) | |
| `/` | same | ¿Cuál es tu nivel de actividad física? (+ options Camino poco… Soy bastante activo) | |
| `/` | same | ¿Qué paisaje te emociona más? (+ Montañas / Bosques / Desiertos / Caminos Culturales) | |
| `/` | same | ¿Cuántos días tienes? (+ Un fin de semana / Una semana / Dos semanas o más) | |
| `/` | same | ¿Dónde prefieres dormir? (+ Hotel o motel / Cabaña / lodge / Camping / Mezcla) | |
| `/` | same | ¿Qué es lo que más te frena para salir a explorar? / Nomaderia está diseñado para ayudarte con esto | |
| `/` | same | ¿Cuál es tu presupuesto? · Económico Menos de $500 USD · Moderado $500 - $1,500 USD · Premium $1,500 - $3,000 USD · Sin límite | `PRICE` (budget bands, not product tiers) |
| `/` | same | Último detalle / Para afinar tus recomendaciones | |
| `/` | same | Buscando tu aventura ideal... | |
| `/` | same | {n}% compatible / Muy buena opción para ti | `AI` `NUM` |
| `/` | same | Preview gratis · Día 1 en {park} · Generando preview gratuito de {parkTitle}… | `AI` |
| `/` | same | Tu Destino Ideal · Parque elegido / Elegir este parque | |
| `/` | same | También te puede gustar — elige uno | |
| `/` | same | Planifica mi itinerario 🗺️ | |
| `/` | same | Recibe tus resultados por correo y te ayudo a planificar tu próxima aventura. | |
| `/` | same | ¡Listo! Revisa tu correo con tus resultados y empieza a planificar tu aventura. | |
| `/` | same | ¿Ninguno te convence? Explora todos los destinos → | |
| `/` | same (WA) | Hola equipo de Nomaderia, acabo de hacer el Quiz, mi destino ideal es {title} y quiero que planifiquen mi itinerario personalizado. ¿Qué paquetes tienen? | `PRICE` (implies packages plural) |
| `/` | `src/components/landing/TravelInsuranceSection.tsx` | Antes de salir · Protege Tu *Aventura* | |
| `/` | same | Antes de salir, considera un seguro de viaje: protege tu salud, tu equipo y tu tranquilidad en cualquier aventura. | |
| `/` | same | Emergencias Médicas — Evacuación en helicóptero, hospitalización y atención médica en cualquier montaña o sendero remoto. | |
| `/` | same | Protección de Equipo — Tu mochila, botas y cámara están cubiertos ante pérdida, robo o daño durante toda tu aventura. | |
| `/` | same | Cobertura 24/7 — Asistencia en español las 24 horas, sin importar la zona horaria o lo remoto del destino. | `SUPPORT` |
| `/` | same | El seguro de viaje no está incluido, pero es lo más recomendable — en tu Itinerario Completo te ayudamos a conseguir el adecuado para tu viaje. | |
| `/` FAQ | `src/components/landing/FaqSection.tsx` | Preguntas frecuentes · Antes de escribirnos, resolvamos tus dudas | |
| `/` | same | ¿Por qué pagar $49 si hay apps gratis como AllTrails? | `PRICE` |
| `/` | same | AllTrails te da un mapa. Nosotros te damos un plan completo pensado para principiantes: qué permiso necesitas, cómo llegar, qué llevar, y un itinerario día por día — todo en español, hecho por una persona real, no un algoritmo genérico. | |
| `/` | same | ¿Qué incluye exactamente el Itinerario Completo? | |
| `/` | same | Ruta día por día según tu nivel y fechas, permisos y reservas explicados, lista de equipo específica para el parque, y soporte por WhatsApp durante tu viaje. | `SUPPORT` |
| `/` | same | ¿Cómo funciona el pago? | |
| `/` | same | Todo empieza por WhatsApp: nos cuentas tu viaje, te confirmamos el precio ($49 USD) y coordinamos el pago antes de entregarte tu itinerario en 24-48 horas. | `PRICE` `DELIVERY` `PAY` |
| `/` | same | Nunca he hecho senderismo, ¿es para mí? | |
| `/` | same | Sí — Nomaderia está diseñado específicamente para quien nunca ha ido a un parque nacional. Te explicamos todo desde cero, sin asumir que ya sabes lo básico. | |
| `/` | same | ¿Qué pasa si cambio de fecha o de parque? / Sin problema, escríbenos por WhatsApp y ajustamos tu itinerario contigo. | |
| `/` | `src/components/landing/PremiumItinerarySection.tsx` | ✦ Diseño 100% Personalizado | `NUM` |
| `/` | same | Tu Aventura, *Tu Medida* | |
| `/` | same | Diseñamos tu itinerario de trekking desde cero, adaptado a tu nivel, presupuesto y objetivos. Sin plantillas genéricas. Sin rutas de turista. | |
| `/` | same | Dificultad Honesta — Te decimos exactamente qué forma física necesitas. Sin subestimar el reto ni exagerarlo para venderte el servicio. | |
| `/` | same | Permisos Sin Estrés — Te guiamos paso a paso en Recreation.gov antes de que se agoten los cupos — Yosemite, Half Dome y más. | |
| `/` | same | Hecho para Principiantes — Nunca asumimos que ya sabes. Cada guía parte de cero, sin jerga de mochilero experto. | |
| `/` | same | En Español de Verdad — No es traducción automática. Explicamos permisos, trails y tarifas con los términos reales de los parques. | |
| `/` | same | Ver qué incluye el servicio → | |
| `/` | `src/config/pricing.ts` (card) | Itinerario Completo Nomaderia · $49 USD | `PRICE` |
| `/` | same features | Itinerario día a día en PDF · Rutas listas en Google Maps · Plan B para cada día · Permisos y reservas resueltos · Logística del camino · Checklist de equipo para tu nivel · Presupuesto desglosado · Soporte por WhatsApp durante tu viaje | `SUPPORT` |
| `/` | same CTA | Diseña mi aventura por WhatsApp | |
| `/` | `src/components/landing/GearPreview.tsx` | Gear esencial · Equipo Para Principiantes | |
| `/` | same | No necesitas gastar miles. Estas son las únicas cosas que realmente necesitas. | |
| `/` | same | Leer Guía → · Ver Todo el Equipo → | |
| `/` | `src/components/landing/BlogPreview.tsx` | Publicaciones del blog · Del Blog | |
| `/` | same | Tips, errores comunes y todo lo que necesitas saber antes de tu primera aventura. | |
| `/` | same | Leer → · Leer más | |
| `/` | `src/components/landing/NewsletterSignup.tsx` | Cada Semana Una Aventura Nueva En Tu Inbox | |
| `/` | same | Únete a nuestra comunidad de aventureros 🌎 | |
| `/` | same | Tips, destinos secretos, y ofertas de equipo. Sin spam, lo prometemos. | |
| `/` | same | Suscribirme · ¡Gracias! Te mantendremos al tanto 🏔️ | |
| `/` | same (toast) | ¡Bienvenido/a! 🎉 / Te enviamos aventuras cada semana. | |

---

## 3) `/servicios`

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `/servicios` meta | `src/pages/Servicios.tsx` | Servicios — Itinerario Completo $49 USD \| Nomaderia | `PRICE` |
| `/servicios` | same | Itinerario completo personalizado a $49 USD: ruta día a día, permisos, equipo, alojamiento y soporte por WhatsApp. Para hispanos en EE. UU. | `PRICE` `SUPPORT` |
| `/servicios` | same | Agente de Viajes Certificado TAP | `CERT` |
| `/servicios` | same | Tu aventura, armada paso a paso | |
| `/servicios` | same | ¿Primera vez en una aventura outdoor? No te preocupes. Te diseñamos un itinerario completo — ruta, equipo, presupuesto — adaptado a tu nivel y estilo. | |
| `/servicios` | same | Escríbenos por WhatsApp | |
| `/servicios` | same | Cómo Funciona | |
| `/servicios` | same | 1. Cuéntanos tu plan — Escríbenos por WhatsApp: ¿a dónde quieres ir? ¿cuántos van? ¿cuántos días? ¿cuál es tu presupuesto? | |
| `/servicios` | same | 2. Diseñamos tu ruta — En 24-48 horas recibes tu itinerario personalizado con rutas, equipo, presupuesto y tips de preparación física. | `DELIVERY` |
| `/servicios` | same | 3. Viaja sin estrés — Llega a tu aventura preparado y seguro. Te acompañamos por WhatsApp durante todo el recorrido. | `SUPPORT` |
| `/servicios` | same | Esto es exactamente lo que recibes | |
| `/servicios` | same | Tu itinerario día a día en PDF — Horarios sugeridos, qué ver, cuánto caminas y qué tan difícil es de verdad. Si un sendero es duro para principiantes, te lo decimos sin adornos. | |
| `/servicios` | same | Rutas listas en Google Maps — Un enlace por cada día. Lo abres, presionas "Iniciar" y listo. No necesitas apps raras ni saber leer mapas. | |
| `/servicios` | same | Plan B para cada día — ¿Amaneciste cansado? ¿Cambió el clima? Cada día incluye una alternativa más corta o más fácil. | |
| `/servicios` | same | Permisos y reservas resueltos — Qué permiso necesitas, cuándo abre la lotería y el enlace directo para aplicar. Nada de descubrirlo en la entrada del parque. | |
| `/servicios` | same | Logística del camino — Dónde cargar gasolina, dónde comer y dónde parar en el trayecto desde tu ciudad hasta el parque. | |
| `/servicios` | same | Checklist de equipo para tu nivel — Solo lo que sí vas a usar, con enlaces de compra. Nada de listas de 50 cosas. | `NUM` |
| `/servicios` | same | Presupuesto desglosado — Entradas, gasolina, comida, hospedaje. Sabes cuánto vas a gastar antes de salir. | |
| `/servicios` | same | Soporte por WhatsApp durante tu viaje — Si algo cambia en el camino, nos escribes y lo resolvemos juntos. | `SUPPORT` |
| `/servicios` | same | Itinerario Completo Nomaderia · $49 USD · Diseña mi aventura por WhatsApp | `PRICE` |
| `/servicios` FAQ | same | ¿Qué incluye exactamente un itinerario? — *(long answer listing PDF, Maps, plan B, permisos, logística, checklist, presupuesto, soporte WhatsApp)* | `SUPPORT` |
| `/servicios` | same | ¿Qué tan personalizado es? — 100%. No usamos plantillas… | `NUM` |
| `/servicios` | same | ¿Qué pasa si nunca he hecho hiking? — ¡Perfecto! Nomaderia está diseñado para principiantes… | |
| `/servicios` | same | ¿Puedo pedir cambios al itinerario? — Sí, una ronda de ajustes está incluida en todos los paquetes. Queremos que tu plan quede perfecto. | `PRICE` (“paquetes” plural) |

---

## 4) `/destinos` and `/destinos/:slug`

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `/destinos` meta | `src/pages/Destinations.tsx` | Destinos — 63 Parques Nacionales \| Nomaderia | `NUM` |
| `/destinos` | same | Directorio de los 63 parques nacionales de EE. UU. con guías en español para hispanos. Filtra por dificultad, estado y distancia desde San Diego. | `NUM` |
| `/destinos` | same | PageHeader: Destinos · 63 parques nacionales · guías en español | `NUM` |
| `/destinos` | same | Buscar parque... · Filtros · Todos/Fácil/Moderado/Desafiante · Sin permiso · Acampar | |
| `/destinos` | same | Mostrando {n} parques · Más cercanos a San Diego · Nombre (A–Z) | `NUM` |
| `/destinos` | same | Distancia desde San Diego · Cerca (menos de 3h) · Media (3–8h) · Lejos (+8h o avión) | |
| `/destinos` | same | En auto, fácil · Requiere planificación · Para aventureros · Solo expertos | |
| `/destinos` | same | Ver guía → · ~${budget} USD / persona · Permiso requerido / Sin permiso | |
| `/destinos/:slug` chrome | `src/pages/DestinationDetail.tsx` | tabs ¿Puedo Hacerlo? · Preparación · Itinerario · Qué Llevar · Cómo Llegar | |
| `/destinos/:slug` | same | Por qué ir · Cuándo ir · LO MÁS DURO · NO IDEAL SI... · Posible mal de altura en este destino | |
| `/destinos/:slug` | same | Tarifa de entrada según residencia (2026) · Residentes y ciudadanos de EE. UU.: · No-residentes de EE. UU. (16 años o más): + $… USD · pase America the Beautiful para no-residentes ($250 USD) | `PRICE` `NUM` `LAW` |
| `/destinos/:slug` | same | Reserva Tu Viaje · ¿Listo para ir? Te armamos el itinerario completo → | |
| `/destinos/:slug` | same | Buscar Vuelos / Hoteles / Tours / Entradas / Rentar Auto / Transfer / Seguro de Viaje | |
| `/destinos/:slug` | same | 🎒 Ver guía de equipo recomendado · 💰 Calcular presupuesto detallado | |
| `/destinos/:slug` | same | Algunos enlaces son de afiliado. Si reservas a través de ellos, ganamos una pequeña comisión sin costo extra para ti. Esto nos ayuda a mantener el sitio. | |
| `/destinos/:slug` | same | Destinos Similares · Galería de Fotos · ↑ Volver arriba | |
| `/destinos/:slug` | `src/components/destinations/CredibilityBar.tsx` | Nomaderia — concierge de aventura outdoor en español para hispanos en EE. UU. Guías honestas con enfoque en principiantes, revisadas por nuestro equipo. | `AI` |
| `/destinos/:slug` | same | Fuentes: NPS (nps.gov) · Recreation.gov · Última verificación: {date} | |
| `/destinos/:slug` | `src/components/ArticleWhatsAppCTA.tsx` | ¿Listo para vivir esta aventura? · Deja de planear y empieza a empacar. · Diseña mi viaje a medida | |
| `/destinos/:slug` | `src/components/StickyMobileCTA.tsx` | ~${budget} USD · Planear por WhatsApp | |

Destination **titles / short_description / markdown bodies** = CMS (`destinations` table). Country flag map includes `México` (`DestinationDetail.tsx`, `DestinationsCatalog.tsx`) — surface flag when a card’s `country` is Mexico.

---

## 5) `/blog`, `/blog/:slug`, `/gear`, `/gear/:slug`, `/calculadora`

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `/blog` | `src/pages/BlogListing.tsx` | Blog · Artículos, consejos y guías para preparar tu primera aventura al aire libre. | |
| `/blog` | same | Leer más → · No hay artículos en esta categoría todavía. | |
| `/blog/:slug` chrome | `src/pages/BlogPostDetail.tsx` | usePageMeta title `${post.title} \| Nomaderia` *(client-only)* | |
| `/blog/:slug` | same | Artículo no encontrado · ← Volver al Blog | |
| `/gear` | `src/pages/GearListing.tsx` | Guía de Equipo · Todo lo que necesitas para tu aventura, revisado por expertos para principiantes. | |
| `/gear/:slug` | `src/pages/GearArticleDetail.tsx` | Transparencia: Esta guía contiene enlaces de afiliado a Amazon… · Productos Recomendados · Ver en Amazon | |
| `/gear/:slug` | same | ¿Necesitas ayuda eligiendo tu equipo? · Nuestro quiz de 1 minuto te ayuda a elegir el equipo ideal según tu nivel, estilo y presupuesto. · Hacer el Quiz · Calcular Presupuesto | |
| `/calculadora` | `src/pages/BudgetCalculator.tsx` | Calculadora de Presupuesto para tu Aventura \| Nomaderia | |
| `/calculadora` | same | Calcula cuánto cuesta tu viaje a los parques nacionales. Estimados reales en dólares para viajeros hispanos en EE. UU. | |
| `/calculadora` | same | Costo de vuelos (USD) · totals shown as `$… USD` · Ver Guía del Destino | |

### Sample CMS blog posts (Supabase `blog_posts`, published)

| Live URL | title (DB) | short_description (DB) | Flags |
|----------|------------|------------------------|-------|
| https://nomaderia.com/blog/10-cosas-nadie-te-dice-primer-hike | 10 Cosas que Nadie Te Dice Antes de Tu Primer Hike (La #7 Me Hubiera Ahorrado una Vergüenza) | Todos te dicen "lleva agua y bloqueador". Nadie te dice que vas a querer rendirte a los 20 minutos. Aquí van las verdades incómodas. | `NUM` |
| https://nomaderia.com/blog/cuanto-cuesta-iniciar-hobby-senderismo-eeuu | Cuánto Cuesta Iniciar un Hobby de Senderismo en EE. UU. | Conoce los costos iniciales del senderismo en EE. UU., desde equipo básico hasta permisos necesarios. | |
| https://nomaderia.com/blog/5-rutas-secretas-mexico-locales | 5 Rutas Secretas en México que Solo los Locales Conocen (y Cómo Llegar) | Olvídate de las rutas saturadas de Instagram. Estos 5 senderos son las joyas escondidas que los senderistas mexicanos no quieren que conozcas. | `MX` `NUM` |

Other sitemap slugs with Mexico-market framing (titles not fully audited body): `7-caminatas-faciles-cdmx-principiantes`, `senderismo-mexico-2026-rutas-abren-cierran`, `mariposa-monarca-2026-rutas-costos-consejos`.

---

## 6) `/sobre-nosotros`, legal, misc

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| `/sobre-nosotros` | `src/pages/SobreNosotros.tsx` | Sobre Nomaderia — Agente de Viajes TAP Certificado | `CERT` |
| `/sobre-nosotros` | same | Conoce a Frank, agente TAP certificado que ayuda a hispanos en EE. UU. a planear su primera aventura en parques nacionales. En español. | `CERT` |
| `/sobre-nosotros` | same | Sobre Nosotros · NOMADERIA ADVENTURES | |
| `/sobre-nosotros` | same | Somos Nomaderia: una plataforma creada por un agente de viajes certificado para ayudarte a planear tu primera aventura de trekking o mochilero, sin perderte en la información y sin gastar de más. | `CERT` |
| `/sobre-nosotros` | same | Credencial oficial · Plataforma respaldada por Agentes Certificados | `CERT` |
| `/sobre-nosotros` | same | Contamos con certificación oficial como Agentes de Viajes… | `CERT` |
| `/sobre-nosotros` | same | Nuestra certificación como Agentes de Viajes: · Agente de Viajes Certificado TAP · The Travel Institute — National TAP Test | `CERT` |
| `/sobre-nosotros` | same | Nuestra misión — Queremos que cualquier persona… Combinamos el conocimiento de un agente de viajes con herramientas digitales —quiz de destinos, guías de gear, calculadora de presupuesto e itinerarios personalizados—… | |
| `/sobre-nosotros` | same | Información honesta y sin relleno. · Recomendaciones basadas en experiencia real de campo. · Accesible para quienes viajan por primera vez. · Sin vender sueños: solo rutas reales y presupuestos alcanzables. | |
| `/sobre-nosotros` | same | ¿Tienes alguna pregunta? · Escríbenos directamente… · nomaderia.travel@gmail.com · Calcular mi presupuesto | |
| `/privacidad` | `src/pages/PrivacyPolicy.tsx` | Política de Privacidad · Última actualización: septiembre de 2026 | |
| `/privacidad` | same | Nomaderia Adventures… Operamos un servicio con sede en Estados Unidos, orientado a hispanos residentes en EE. UU. (mercado primario: Sur de California / San Diego). | `LAW` |
| `/privacidad` | same | Esta política se interpreta conforme a las leyes de privacidad aplicables de los Estados Unidos y del Estado de California. ⚠️ VERIFICAR | `LAW` |
| `/privacidad` | same | El pago del Itinerario Completo Nomaderia ($49 USD) se procesa en la página de checkout alojada por **Stripe**. Nomaderia no almacena números de tarjeta ni datos sensibles de pago. | `PRICE` `PAY` |
| `/privacidad` | same | §7 derechos California / CCPA framing + ⚠️ VERIFICAR | `LAW` |
| `/privacidad` | same | §8 Legislación aplicable — EE. UU. / California / tribunales Condado de San Diego, California | `LAW` |
| `/terminos` | `src/pages/TermsAndConditions.tsx` | Términos y Condiciones · Última actualización: septiembre de 2026 | |
| `/terminos` | same | §2 … Itinerario Completo Nomaderia — servicio de pago cotizado y cobrado únicamente en dólares estadounidenses (USD). | `PRICE` `LAW` |
| `/terminos` | same | §6 … costo de $49 USD… El cobro se coordina de forma **manual directamente por WhatsApp**; Nomaderia **no procesa pagos automáticos** en el sitio. | `PRICE` `PAY` (contradicts Privacy Stripe claim) |
| `/terminos` | same | §8 Legislación aplicable — EE. UU. / California / San Diego County courts | `LAW` |
| `/gracias` `/sentinel` | redirects | Navigate → `/servicios` (no unique copy) | |
| `/404` | `src/pages/NotFound.tsx` | Página no encontrada · Volver al inicio | |
| `/i/:token` | `src/components/itinerary/ClientItineraryLayout.tsx` | Este itinerario no está disponible · Hecho por Nomaderia · Escríbenos · — tu concierge sigue contigo. · Versión PDF · · ITINERARIO DE VIAJE / PRIVADO | `AI` `SUPPORT` |

---

## 7) Emails (Edge Functions)

| Surface | File | Exact text | Flags |
|---------|------|------------|-------|
| Welcome subject | `supabase/functions/send-welcome-email/index.ts` | 🏔️ ¡Bienvenido/a a la comunidad Nomaderia! | |
| Welcome body | same | ¡Bienvenido/a a la comunidad! 🎉 · Ya eres parte… Sin spam, lo prometemos. Solo aventuras 🌄 | |
| Welcome | same | ¿Qué recibirás cada semana? · Destinos secretos… Tips… Ofertas… Itinerarios… | |
| Welcome | same | Ver Destinos → · Calcular mi Presupuesto · Hacer el Quiz → | |
| Welcome tagline | same | Tu Primera Aventura Te Está Esperando | |
| Quiz results subject | `send-quiz-email/index.ts` | 🏔️ Tu destino ideal: {title} — Nomaderia | |
| Quiz results | same | 10% de descuento en tu Itinerario Completo Nomaderia (**$44 en vez de $49 USD**) · code **NOMADA10** | `PRICE` |
| Quiz results | same | ✅ Ruta día a día optimizada. · ✅ Recomendaciones secretas de comida. · ✅ Enlaces directos de reserva. · 💬 Escríbenos a WhatsApp… | |
| Quiz results (alt) | `send-quiz-results/index.ts` | Itinerario Completo Nomaderia — $49 USD | `PRICE` |
| Drip gear | `send-drip-emails/index.ts` | gear guide copy incl. “Mantiene el agua fría **24 horas**…” *(product claim, not support SLA)* | |
| Drip itinerary CTA | same | 📋 ¿Listo para planear tu aventura? Te ayudamos | |
| Drip | same | Soy Frank, agente de viajes certificado (National TAP Test, The Travel Institute). | `CERT` |
| Drip | same | 🗺️ Itinerario Completo Nomaderia · $49 USD · Entregado por WhatsApp · Diseñado por Frank (agente TAP) | `PRICE` `CERT` |
| Drip | same | 💬 Solicitar mi itinerario por WhatsApp → | |
| Unsubscribe | `supabase/functions/unsubscribe/index.ts` | Listo, ya no recibirás más correos · Volver a nomaderia.com | |

---

## 8) Orphan / unused on home (still customer-facing if remounted)

| Route | File | Exact text | Flags |
|-------|------|------------|-------|
| *(not on Index)* | `src/components/landing/DidYouKnowSection.tsx` | ¿Sabías que puedes ver las estrellas más brillantes de **México** en Baja California? | `MX` |
| | same | ¿Sabías que puedes ver un lago dentro de un volcán a 4 horas de la **CDMX**? | `MX` |
| | same | other hard-coded park blurbs (Yosemite/California, Joshua Tree, Everest, Patagonia, etc.) | `NUM` |
| | same | 🧭 Descubre tu destino ideal | |

---

## 9) Share previews (no-JS / Facebook crawler)

Method: `curl -sL -A 'facebookexternalhit/1.1'` of raw HTML. Site is a **Vite SPA**; crawlers only see **`index.html` static tags**. Client `usePageMeta` / blog titles never reach Facebook.

### Home — https://nomaderia.com/

| Tag | Value Facebook sees |
|-----|---------------------|
| og:title | Nomaderia - Aventuras y Senderismo |
| og:description | Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. |
| og:image | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg |

### Blog 1 — https://nomaderia.com/blog/10-cosas-nadie-te-dice-primer-hike

| Tag | Value Facebook sees |
|-----|---------------------|
| og:title | Nomaderia - Aventuras y Senderismo *(same as home)* |
| og:description | Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. |
| og:image | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg |

**CMS intended (JS-only, not crawler):** title `10 Cosas que Nadie Te Dice… | Nomaderia` · description from `short_description` · image Unsplash hero.

### Blog 2 — https://nomaderia.com/blog/cuanto-cuesta-iniciar-hobby-senderismo-eeuu

| Tag | Value Facebook sees |
|-----|---------------------|
| og:title | Nomaderia - Aventuras y Senderismo |
| og:description | Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. |
| og:image | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg |

**CMS intended:** title `Cuánto Cuesta Iniciar un Hobby de Senderismo en EE. UU.` · short_description as above · hero `blog-posts/1780882056536-1k8txc.jpeg`.

### Blog 3 — https://nomaderia.com/blog/5-rutas-secretas-mexico-locales

| Tag | Value Facebook sees |
|-----|---------------------|
| og:title | Nomaderia - Aventuras y Senderismo |
| og:description | Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. |
| og:image | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg |

**CMS intended:** Mexico-market title/description (flagged `MX`) · Unsplash hero.

---

## 10) Flagged themes (summary for follow-up)

1. **Share / OG collapse** — Every public URL returns identical home OG tags to no-JS crawlers. Blog shares look generic; Mexico posts still look like US parks OG.
2. **Payment story conflict** — Privacy says Stripe hosted checkout + card; Terms + FAQ/Servicios say WhatsApp manual coordination only. `pricing.ts` still has placeholder Stripe Payment Link TODO.
3. **Non-$49 price** — Quiz email `NOMADA10` → **$44**. Quiz WA copy asks “¿Qué paquetes tienen?”; Servicios FAQ says “todos los paquetes”.
4. **Delivery / support SLAs** — Hero “Respuesta en < 24h”; SocialProof “24h” max delivery; Pain/FAQ/Servicios “24-48h”; TravelInsurance “Cobertura **24/7**” (insurance partner claim); multiple “soporte por WhatsApp durante tu viaje”.
5. **AI surfaces** — Concierge global + CredibilityBar “concierge”; Quiz “Preview gratis” / “% compatible” / ranking results.
6. **Hard numbers** — “63 parques” (meta, destinos, concierge); SocialProof live counts + “Desde 2024”; “100%” personalizado; “5 minutos”; “50 cosas”; nonresident $100 / $250.
7. **Certifications** — TAP / The Travel Institute repeated (hero, social proof, servicios, sobre nosotros, drip email).
8. **Mexico / non-US market copy** — Blog posts & orphan DidYouKnow (CDMX, Baja, México); Instagram/TikTok `@nomaderia.mx`; country flag maps include México.
9. **Law / jurisdiction** — Privacy/Terms California + San Diego courts; Privacy ⚠️ VERIFICAR CCPA/CPRA (already T01).
10. **No classic testimonials** found in audited UI chrome (no named client quotes / star ratings on landing). SocialProof is stats + TAP, not quotes.

---

*End of audit. See `docs/pending-tasks.md` for follow-ups filed from this pass.*
