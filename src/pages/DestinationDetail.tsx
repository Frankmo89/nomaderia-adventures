import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, DollarSign, Plane, Hotel, Shield, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";
import { useCanonical, useJsonLd } from "@/hooks/use-seo";
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

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dest, isLoading, error } = useDestinationBySlug(slug);
  const { data: related = [] } = useRelatedDestinations(
    dest?.difficulty_level,
    dest?.id
  );

  useCanonical();

  useEffect(() => {
    if (!dest) return;
    document.title = `${dest.title} — Nomaderia`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", dest.short_description || "");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", `${dest.title} — Nomaderia`);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", dest.short_description || "");
    if (dest.hero_image_url) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute("content", dest.hero_image_url);
    }
    return () => {
      document.title = "Nomaderia — Tu Primera Aventura Te Está Esperando";
    };
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
    };
  }, [dest]);

  useJsonLd(jsonLd);

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
  const fears = (dest.common_fears as Array<{ question: string; answer: string }>) || [];

  return (
    <main className="bg-background min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-20">
        <div className="h-[50vh] flex items-end relative overflow-hidden">
          {dest.hero_image_url ? (
            <img src={dest.hero_image_url} alt={`Vista de ${dest.title}`} loading="eager" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-primary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="container mx-auto px-4 pb-10 relative z-10">
            <Link to="/#destinos" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" /> Volver a destinos
            </Link>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-3"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              {dest.title}
            </motion.h1>
            <p className="text-lg text-muted-foreground mb-4">
              {countryFlag[dest.country] || ""} {dest.country} {dest.region ? `· ${dest.region}` : ""}
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className={difficultyColor[dest.difficulty_level]}>{difficultyLabel[dest.difficulty_level]}</Badge>
              <Badge variant="outline" className="border-foreground/20 text-foreground"><Clock className="h-3 w-3 mr-1" /> {dest.days_needed}</Badge>
              {dest.estimated_budget_usd && <Badge variant="outline" className="border-foreground/20 text-foreground"><DollarSign className="h-3 w-3 mr-1" /> ~${dest.estimated_budget_usd} USD</Badge>}
              {dest.best_season && <Badge variant="outline" className="border-foreground/20 text-foreground">🗓 {dest.best_season}</Badge>}
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
                  <div className="prose prose-invert max-w-none mb-8">
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
              <TabsContent value="prep"><div className="prose prose-invert max-w-none text-foreground/90"><ReactMarkdown>{dest.preparation_plan || "Contenido próximamente."}</ReactMarkdown></div></TabsContent>
              <TabsContent value="itinerary"><div className="prose prose-invert max-w-none text-foreground/90"><ReactMarkdown>{dest.itinerary_markdown || "Contenido próximamente."}</ReactMarkdown></div></TabsContent>
              <TabsContent value="gear"><div className="prose prose-invert max-w-none text-foreground/90"><ReactMarkdown>{dest.gear_list_markdown || "Contenido próximamente."}</ReactMarkdown></div></TabsContent>
            </Tabs>
          </div>
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="font-serif text-xl text-card-foreground">Reserva Tu Viaje</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {affiliateLinks.flights_url && <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"><a href={affiliateLinks.flights_url} target="_blank" rel="noopener noreferrer"><Plane className="mr-2 h-4 w-4" /> Buscar Vuelos</a></Button>}
                  {affiliateLinks.hotels_url && <Button asChild variant="outline" className="w-full border-border text-card-foreground hover:bg-muted"><a href={affiliateLinks.hotels_url} target="_blank" rel="noopener noreferrer"><Hotel className="mr-2 h-4 w-4" /> Buscar Hoteles</a></Button>}
                  {affiliateLinks.insurance_url && <Button asChild variant="outline" className="w-full border-border text-card-foreground hover:bg-muted"><a href={affiliateLinks.insurance_url} target="_blank" rel="noopener noreferrer"><Shield className="mr-2 h-4 w-4" /> Seguro de Viaje</a></Button>}
                  {!affiliateLinks.flights_url && !affiliateLinks.hotels_url && !affiliateLinks.insurance_url && <p className="text-sm text-card-foreground/60">Enlaces de reserva próximamente.</p>}
                </CardContent>
              </Card>
            </div>
          </aside>
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
                      <img src={r.hero_image_url} alt={`Vista de ${r.title}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
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

      <div className="container mx-auto px-4 py-8 text-center">
        <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Volver arriba</Button>
      </div>
      <Footer />
    </main>
  );
};

export default DestinationDetail;
