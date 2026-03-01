import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import useEmblaCarousel from "embla-carousel-react";
import { Clock, DollarSign, Plane, Hotel, Shield, Compass, Ticket, Car, Bus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";
import PremiumItinerarySection from "@/components/landing/PremiumItinerarySection";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import SEOHead from "@/components/SEOHead";
import ShareButtons from "@/components/ShareButtons";
import { useCanonical, useJsonLd, usePageMeta, SITE_URL } from "@/hooks/use-seo";
import { useDestinationBySlug, useRelatedDestinations } from "@/hooks/use-destinations";

const difficultyColor: Record<string, string> = {
  easy: "bg-secondary text-secondary-foreground",
  moderate: "bg-primary/80 text-primary-foreground",
  challenging: "bg-destructive text-destructive-foreground",
};
const difficultyLabel: Record<string, string> = { easy: "Fácil", moderate: "Moderado", challenging: "Desafiante" };
const countryFlag: Record<string, string> = {
  México: "🇲🇽", "Estados Unidos": "🇺🇸", España: "🇪🇸", Argentina: "🇦🇷", Nepal: "🇳🇵",
};

// Custom renderer for markdown images
const markdownComponents = {
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        decoding="async"
        className="w-full h-64 md:h-80 object-cover rounded-xl"
      />
      {alt && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
};

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dest, isLoading, error } = useDestinationBySlug(slug);
  const { data: related = [] } = useRelatedDestinations(
    dest?.difficulty_level,
    dest?.id
  );

  // Hero carousel
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true });
  const [heroIndex, setHeroIndex] = useState(0);

  // Gallery lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const heroImages = useMemo(() => {
    const imgs = dest?.gallery_images as string[] | null | undefined;
    if (imgs && imgs.length > 0) return imgs;
    return dest?.hero_image_url ? [dest.hero_image_url] : [];
  }, [dest]);

  const galleryImages = useMemo(() => {
    const imgs = dest?.gallery_images as string[] | null | undefined;
    return imgs && imgs.length > 1 ? imgs : [];
  }, [dest]);

  // Hero autoplay
  useEffect(() => {
    if (!heroApi) return;
    const onSelect = () => setHeroIndex(heroApi.selectedScrollSnap());
    heroApi.on("select", onSelect);
    return () => { heroApi.off("select", onSelect); };
  }, [heroApi]);

  useEffect(() => {
    if (!heroApi || heroImages.length <= 1) return;
    const id = setInterval(() => heroApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [heroApi, heroImages.length]);

  // Lightbox navigation
  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);
  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % galleryImages.length);
  }, [galleryImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

  useCanonical();

  usePageMeta({
    title: dest?.title || "Destino",
    description: dest?.short_description || "Guía completa de aventura outdoor",
    image: dest?.hero_image_url || undefined,
    type: "article",
  });

  const fears = useMemo(() => {
    if (!dest) return [];
    return (dest.common_fears as Array<{ question: string; answer: string }>) || [];
  }, [dest]);

  const jsonLd = useMemo(() => {
    if (!dest) return null;
    return {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: dest.title,
      description: dest.short_description || "",
      image: dest.hero_image_url || "",
      address: { "@type": "PostalAddress", addressCountry: dest.country },
      touristType: dest.experience_type || "Adventure",
      url: `${SITE_URL}/destinos/${dest.slug}`,
      inLanguage: "es",
    };
  }, [dest]);

  useJsonLd(jsonLd);

  const breadcrumbLd = useMemo(() => {
    if (!dest) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Destinos", item: `${SITE_URL}/#destinos` },
        { "@type": "ListItem", position: 3, name: dest.title, item: `${SITE_URL}/destinos/${dest.slug}` },
      ],
    };
  }, [dest]);

  useJsonLd(breadcrumbLd);

  const faqLd = useMemo(() => {
    if (!dest || !fears.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: fears.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    };
  }, [dest, fears]);

  useJsonLd(faqLd);

  if (isLoading) return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="pt-20"><DestinationDetailSkeleton /></div>
    </main>
  );

  if (error || !dest) return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <div className="pt-32 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-4">Destino no encontrado</h1>
        <Button asChild><Link to="/#destinos">← Volver a destinos</Link></Button>
      </div>
    </main>
  );

  const affiliateLinks = (dest.affiliate_links as Record<string, string>) || {};
  const bookingOutlineBtn = "w-full bg-transparent border-card-foreground/25 text-card-foreground hover:bg-card-foreground/10 hover:text-card-foreground";

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <SEOHead
        title={dest.title}
        description={dest.short_description || `Guía completa de ${dest.title} para principiantes`}
        image={dest.hero_image_url || undefined}
      />

      {/* Hero Carousel */}
      <section className="pt-20">
        <div className="h-[50vh] md:h-[60vh] flex items-end relative overflow-hidden">
          {/* Embla viewport */}
          <div ref={heroRef} className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">
              {heroImages.length > 0 ? heroImages.map((src, i) => (
                <div key={i} className="relative flex-none w-full h-full">
                  <img
                    src={src}
                    alt={i === 0 ? `Vista de ${dest.title}` : `${dest.title} — imagen ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover transition-opacity duration-700"
                  />
                </div>
              )) : (
                <div className="flex-none w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
              )}
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

          {/* Dot indicators */}
          {heroImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => heroApi?.scrollTo(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === heroIndex ? "bg-white scale-125" : "bg-white/50"
                  }`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hero text content */}
          <div className="container mx-auto px-4 pb-10 relative z-10">
            <nav className="text-sm flex items-center gap-1 mb-4" aria-label="Breadcrumb">
              <Link to="/" className="text-white/60 hover:text-white">Inicio</Link>
              <span className="text-white/40">/</span>
              <Link to="/#destinos" className="text-white/60 hover:text-white">Destinos</Link>
              <span className="text-white/40">/</span>
              <span className="text-white/70 truncate max-w-[200px]" aria-current="page">{dest.title}</span>
            </nav>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-6xl font-bold text-white mb-3"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              {dest.title}
            </motion.h1>
            <p className="text-lg text-white/70 mb-4">
              {countryFlag[dest.country] || ""} {dest.country} {dest.region ? `· ${dest.region}` : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className={difficultyColor[dest.difficulty_level]}>{difficultyLabel[dest.difficulty_level]}</Badge>
              <Badge variant="outline" className="border-white/20 text-white"><Clock className="h-3 w-3 mr-1" /> {dest.days_needed}</Badge>
              {dest.estimated_budget_usd && <Badge variant="outline" className="border-white/20 text-white"><DollarSign className="h-3 w-3 mr-1" /> ~${dest.estimated_budget_usd} USD</Badge>}
              {dest.best_season && <Badge variant="outline" className="border-white/20 text-white">🗓 {dest.best_season}</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="can-i" className="w-full">
              <TabsList className="bg-muted mb-6 flex-wrap">
                <TabsTrigger value="can-i">¿Puedo Hacerlo?</TabsTrigger>
                <TabsTrigger value="prep">Preparación Física</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
                <TabsTrigger value="gear">Qué Llevar</TabsTrigger>
              </TabsList>
              <TabsContent value="can-i">
                {dest.difficulty_description && (
                  <div className="prose max-w-none mb-8">
                    <p className="text-foreground/90 text-lg leading-relaxed">{dest.difficulty_description}</p>
                  </div>
                )}
                {fears.length > 0 && (
                  <>
                    <h3 className="font-serif text-2xl text-foreground mb-4">Preguntas Frecuentes</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {fears.map((f, i) => (
                        <AccordionItem key={i} value={`fear-${i}`} className="border-border">
                          <AccordionTrigger className="text-foreground hover:text-primary">{f.question}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </>
                )}
              </TabsContent>
              <TabsContent value="prep">
                <div className="prose max-w-none text-foreground/90">
                  <ReactMarkdown components={markdownComponents}>{dest.preparation_plan || "Contenido próximamente."}</ReactMarkdown>
                </div>
              </TabsContent>
              <TabsContent value="itinerary">
                <div className="prose max-w-none text-foreground/90">
                  <ReactMarkdown components={markdownComponents}>{dest.itinerary_markdown || "Contenido próximamente."}</ReactMarkdown>
                </div>
              </TabsContent>
              <TabsContent value="gear">
                <div className="prose max-w-none text-foreground/90">
                  <ReactMarkdown components={markdownComponents}>{dest.gear_list_markdown || "Contenido próximamente."}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-card-foreground">Reserva Tu Viaje</CardTitle>
                  {dest.best_season && (
                    <p className="text-xs text-primary mt-1">🗓️ Mejor temporada: {dest.best_season}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {affiliateLinks.flights_url && (
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                      <a href={affiliateLinks.flights_url} target="_blank" rel="noopener noreferrer">
                        <Plane className="mr-2 h-4 w-4" /> Buscar Vuelos
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.hotels_url && (
                    <Button asChild variant="outline" className={bookingOutlineBtn}>
                      <a href={affiliateLinks.hotels_url} target="_blank" rel="noopener noreferrer">
                        <Hotel className="mr-2 h-4 w-4" /> Buscar Hoteles
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.tours_url && (
                    <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground w-full">
                      <a href={affiliateLinks.tours_url} target="_blank" rel="noopener noreferrer">
                        <Compass className="mr-2 h-4 w-4" /> Ver Tours y Actividades
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.tickets_url && (
                    <Button asChild variant="outline" className={bookingOutlineBtn}>
                      <a href={affiliateLinks.tickets_url} target="_blank" rel="noopener noreferrer">
                        <Ticket className="mr-2 h-4 w-4" /> Entradas y Atracciones
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.car_rental_url && (
                    <Button asChild variant="outline" className={bookingOutlineBtn}>
                      <a href={affiliateLinks.car_rental_url} target="_blank" rel="noopener noreferrer">
                        <Car className="mr-2 h-4 w-4" /> Rentar Auto
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.transfer_url && (
                    <Button asChild variant="outline" className={bookingOutlineBtn}>
                      <a href={affiliateLinks.transfer_url} target="_blank" rel="noopener noreferrer">
                        <Bus className="mr-2 h-4 w-4" /> Transfer Aeropuerto
                      </a>
                    </Button>
                  )}
                  {affiliateLinks.insurance_url && (
                    <Button asChild variant="outline" className={bookingOutlineBtn}>
                      <a href={affiliateLinks.insurance_url} target="_blank" rel="noopener noreferrer">
                        <Shield className="mr-2 h-4 w-4" /> Seguro de Viaje
                      </a>
                    </Button>
                  )}
                  {!affiliateLinks.flights_url && !affiliateLinks.hotels_url && !affiliateLinks.tours_url && !affiliateLinks.tickets_url && !affiliateLinks.car_rental_url && !affiliateLinks.transfer_url && !affiliateLinks.insurance_url && (
                    <p className="text-sm text-card-foreground/60">
                      Enlaces de reserva próximamente.
                    </p>
                  )}
                  <div className="border-t border-border pt-3 mt-3 flex flex-col gap-2">
                    <Link to="/gear" className="text-sm text-primary hover:underline flex items-center gap-1">
                      🎒 Ver guía de equipo recomendado
                    </Link>
                    <Link to="/calculadora" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      💰 Calcular presupuesto detallado
                    </Link>
                  </div>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground/50 text-center mt-2 px-2">
                Algunos enlaces son de afiliado. Si reservas a través de ellos, ganamos una pequeña comisión sin costo extra para ti. Esto nos ayuda a mantener el sitio.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Galería de Fotos */}
      {galleryImages.length > 1 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl text-foreground mb-8 text-center"
            >
              Galería de Fotos
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galleryImages.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`overflow-hidden rounded-xl cursor-pointer ${
                    i === 0 ? "col-span-2 row-span-2 md:col-span-2 md:row-span-2" : ""
                  }`}
                  style={{ aspectRatio: i === 0 ? "16/9" : "4/3" }}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                >
                  <img
                    src={src}
                    alt={`${dest.title} — galería ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full bg-black/95 border-0 p-0 overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${dest.title} — imagen ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/40 rounded-full p-1.5 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={lightboxPrev}
                  className="absolute left-3 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={lightboxNext}
                  className="absolute right-3 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compartir */}
      <section className="pb-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="pt-6 border-t border-border">
            <ShareButtons
              url={window.location.href}
              title={dest.title}
              description={dest.short_description || undefined}
            />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl text-foreground mb-8 text-center">Destinos Similares</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} to={`/destinos/${r.slug}`} className="bg-card rounded-xl overflow-hidden hover:scale-[1.03] transition-transform shadow-lg group">
                  <div className="h-40 overflow-hidden relative">
                    {r.hero_image_url ? (
                      <img src={r.hero_image_url} alt={`Vista de ${r.title}`} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-4">
                    <Badge className={difficultyColor[r.difficulty_level] + " mb-2"}>{difficultyLabel[r.difficulty_level]}</Badge>
                    <h3 className="font-serif text-lg font-bold text-card-foreground">{r.title}</h3>
                    <p className="text-sm text-card-foreground/70">{countryFlag[r.country] || ""} {r.country}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="pb-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col items-center text-center p-8">
              <h3 className="font-serif text-2xl text-foreground mb-2">
                ¿Quieres que te arme este viaje a {dest.title}?
              </h3>
              <p className="text-muted-foreground mb-6">
                Te preparo un itinerario personalizado con todo lo que necesitas.
              </p>
              {buildWhatsAppUrl(`Hola Frank, me interesa un itinerario para ${dest.title}`) && (
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <a
                    href={buildWhatsAppUrl(`Hola Frank, me interesa un itinerario para ${dest.title}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Plática Conmigo por WhatsApp →
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <PremiumItinerarySection />

      <div className="container mx-auto px-4 py-8 text-center">
        <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Volver arriba</Button>
      </div>
      <Footer />
    </main>
  );
};

export default DestinationDetail;
