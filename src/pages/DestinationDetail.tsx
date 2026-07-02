import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import useEmblaCarousel from "embla-carousel-react";
import { DollarSign, Plane, Hotel, Shield, Compass, Ticket, Car, Bus, X, ChevronLeft, ChevronRight, Sparkles, Mountain, MessageSquare, ExternalLink, AlertTriangle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";
import PremiumItinerarySection from "@/components/landing/PremiumItinerarySection";
import ArticleWhatsAppCTA from "@/components/ArticleWhatsAppCTA";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import SEO from "@/components/SEO";
import JsonLd from "@/components/JsonLd";
import { PRICING } from "@/config/pricing";
import ShareButtons from "@/components/ShareButtons";
import PermitScarcity from "@/components/PermitScarcity";
import { ConciergeChat } from "@/components/ConciergeChat";
import { SITE_URL, usePageMeta } from "@/hooks/use-seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useDestinationBySlug, useRelatedDestinations } from "@/hooks/use-destinations";
import type { Tables } from "@/integrations/supabase/types";
import QuickFactsRow from "@/components/destinations/QuickFactsRow";
import DifficultyBadge from "@/components/destinations/DifficultyBadge";
import HowToGetThere, { type LodgingOption } from "@/components/destinations/HowToGetThere";
import CredibilityBar from "@/components/destinations/CredibilityBar";
import ItineraryDayCards from "@/components/destinations/ItineraryDayCards";
import TrailCards, { type SignatureHike } from "@/components/destinations/TrailCards";
import TrailsSection from "@/components/destinations/TrailsSection";
import ParkAlertsBanner from "@/components/destinations/ParkAlertsBanner";
import ParkWeatherCard from "@/components/destinations/ParkWeatherCard";
import { buildChipItems } from "@/lib/chip-labels";
import { formatRegionDisplay } from "@/lib/regions";
import { useParkLiveData } from "@/hooks/use-park-live-data";

type Destination = Tables<"destinations">;

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

// Columns added post-type-generation — remove cast once Frank regenerates types (ADR-009)
interface DestExt {
  why_visit_markdown?: string | null;
  top_activities?: string[] | null;
  signature_hikes?: SignatureHike[] | null;
  max_elevation_ft?: number | null;
  altitude_warning?: boolean | null;
  beginner_friendly?: boolean | null;
  not_ideal_if?: string[] | null;
  // access / getting-there fields
  nearest_airport?: string | null;
  nearest_town?: string | null;
  drive_time_from_la?: string | null;
  drive_time_from_san_diego?: string | null;
  getting_there_markdown?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lodging_info?: LodgingOption[] | null;
  last_verified_at?: string | null;
  nps_url?: string | null;
  has_nonresident_surcharge?: boolean | null;
  nonresident_surcharge?: number | null;
  good_for?: string[] | null;
  recreation_gov_url?: string | null;
}


const HIGHLIGHT_ICONS = [Sparkles, Mountain, Compass] as const;

const DestinationPageMeta = ({ destination }: { destination: Destination }) => {
  usePageMeta({
    title: `${destination.title} | Nomaderia`,
    description:
      destination.short_description ||
      "Guía completa en español para tu aventura en parques nacionales.",
    image: destination.hero_image_url || undefined,
  });

  return null;
};

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dest, isLoading, error } = useDestinationBySlug(slug);
  const { data: related = [] } = useRelatedDestinations(
    dest?.difficulty_level,
    dest?.id
  );
  const { data: parkLiveData } = useParkLiveData(dest?.id);

  // Hero carousel
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true });
  const [heroIndex, setHeroIndex] = useState(0);

  // Gallery lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Tab animation
  const [activeTab, setActiveTab] = useState("can-i");
  const prefersReducedMotion = useReducedMotion();

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


  const fears = useMemo(() => {
    if (!dest) return [];
    const raw = (dest.common_fears as Array<Record<string, unknown>> | null) ?? [];
    return raw
      .map((f) => ({
        miedo: (typeof f.miedo === "string" ? f.miedo : typeof f.question === "string" ? f.question : "").trim(),
        respuesta: (typeof f.respuesta === "string" ? f.respuesta : typeof f.answer === "string" ? f.answer : "").trim(),
      }))
      .filter((f) => f.miedo && f.respuesta);
  }, [dest]);

  const jsonLd = useMemo(() => {
    if (!dest) return null;
    const schema: Record<string, unknown> = {
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
    if (dest.estimated_budget_usd != null) {
      schema.estimatedCost = {
        "@type": "MonetaryAmount",
        value: dest.estimated_budget_usd,
        currency: "USD",
      };
    }
    if (dest.days_needed) {
      const daysMatch = String(dest.days_needed).match(/\d+/);
      if (daysMatch) {
        schema.duration = `P${daysMatch[0]}D`;
      }
    }
    return schema;
  }, [dest]);

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

  const faqLd = useMemo(() => {
    if (!dest || !fears.length) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: fears.map((f) => ({
        "@type": "Question",
        name: f.miedo,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.respuesta,
        },
      })),
    };
  }, [dest, fears]);

  const whyText = useMemo(() => {
    if (!dest) return null;
    const ext = dest as Destination & DestExt;
    return ext.why_visit_markdown?.trim() || dest.short_description?.trim() || null;
  }, [dest]);

  const highlights = useMemo(() => {
    if (!dest) return [];
    const ext = dest as Destination & DestExt;
    const items: string[] = [];
    for (const a of ext.top_activities ?? []) {
      if (items.length >= 3) break;
      if (a?.trim()) items.push(a.trim());
    }
    if (items.length < 3) {
      const hikeName = ext.signature_hikes?.[0]?.nombre?.trim();
      if (hikeName) items.push(hikeName);
    }
    if (items.length < 3) {
      for (const t of (dest.tags as string[] | null) ?? []) {
        if (items.length >= 3) break;
        if (t?.trim()) items.push(t.trim());
      }
    }
    return items.slice(0, 3);
  }, [dest]);

  const chipItems = useMemo(() => {
    if (!dest) return [];
    const ext = dest as Destination & DestExt;
    return buildChipItems(ext.good_for, dest.tags as string[] | null);
  }, [dest]);
  const regionDisplay = formatRegionDisplay(dest?.region ?? null);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: dest?.title ?? "", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }, [dest?.title]);

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
  const permitAlertUrl = affiliateLinks.permit_alert_url || null;
  const whatsappMessage = `Hola Nomaderia 👋 Me interesa el itinerario personalizado de ${dest.title}. ¿Me ayudas a planearlo?`;

  return (
    <main className="bg-background min-h-screen pb-32 md:pb-0">
      <Navbar />
      <DestinationPageMeta destination={dest} />
      <SEO
        title={dest.title}
        description={dest.short_description || `Guía completa de ${dest.title} para principiantes`}
        image={dest.hero_image_url || undefined}
        slug={`destinos/${dest.slug}`}
      />
      {jsonLd && <JsonLd data={jsonLd} />}
      {breadcrumbLd && <JsonLd data={breadcrumbLd} />}
      {faqLd && <JsonLd data={faqLd} />}

      {/* Hero Carousel */}
      <section className="pt-20">
        {/* Image: 52vh, min 260px, max 360px, edge-to-edge */}
        <div
          className="relative overflow-hidden w-full"
          style={{ height: "clamp(260px, 52vh, 360px)" }}
        >
          {/* Embla viewport */}
          <div ref={heroRef} className="absolute inset-0 overflow-hidden">
            <div className="flex h-full">
              {heroImages.length > 0 ? heroImages.map((src, i) => (
                <div key={i} className="relative flex-none w-full h-full">
                  <img
                    src={src}
                    alt={i === 0 ? `Vista de ${dest.title}` : `${dest.title} — imagen ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover object-top img-warm transition-opacity duration-700"
                  />
                </div>
              )) : (
                <div className="flex-none w-full h-full bg-gradient-to-br from-secondary/30 to-primary/20" />
              )}
            </div>
          </div>

          {/* Floating back button */}
          <Link
            to="/#destinos"
            className="absolute top-4 left-4 z-20 flex items-center justify-center rounded-full"
            style={{
              width: 36, height: 36,
              background: "rgba(0,0,0,0.32)",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Volver a destinos"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>

          {/* Floating share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 z-20 flex items-center justify-center rounded-full"
            style={{
              width: 36, height: 36,
              background: "rgba(0,0,0,0.32)",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Compartir"
          >
            <Share2 className="h-4 w-4 text-white" />
          </button>

          {/* Pagination dots / counter — 10px above bottom edge of image */}
          {heroImages.length > 1 && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-[6px]"
              style={{ bottom: 10 }}
            >
              {heroImages.length <= 6 ? (
                heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => heroApi?.scrollTo(i)}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label={`Ir a imagen ${i + 1}`}
                  >
                    <span
                      className="rounded-full block transition-all duration-300"
                      style={{
                        width:      i === heroIndex ? 7 : 5,
                        height:     i === heroIndex ? 7 : 5,
                        background: i === heroIndex ? "white" : "rgba(255,255,255,0.4)",
                      }}
                    />
                  </button>
                ))
              ) : (
                <span
                  className="font-sans text-white rounded-full px-2 py-0.5"
                  style={{ fontSize: 12, background: "rgba(0,0,0,0.4)" }}
                >
                  {heroIndex + 1} / {heroImages.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content below image: overline → title → location → chips → quick-facts */}
        <div className="px-5 pt-5">
          {/* Overline */}
          <p
            className="font-sans uppercase text-[#D97706]"
            style={{ fontSize: 11, letterSpacing: "0.08em", fontWeight: 500 }}
          >
            {dest.experience_type ?? "Parque Nacional"}
          </p>

          <div style={{ height: 4 }} />

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif font-bold text-[#1C1917]"
            style={{ fontSize: "clamp(26px, 7vw, 32px)", lineHeight: 1.15 }}
          >
            {dest.title}
          </motion.h1>

          <div style={{ height: 6 }} />

          {/* Location */}
          <p className="font-sans text-[#6B7280]" style={{ fontSize: 13 }}>
            {countryFlag[dest.country] || "🏔"} {regionDisplay || dest.country}
          </p>

          <div style={{ height: 12 }} />

          {/* Chip row */}
          {chipItems.length > 0 && (
            <div className="relative">
              <div
                className="flex overflow-x-auto gap-2 scrollbar-hide"
                style={{ paddingRight: 28 }}
              >
                {chipItems.map((item, i) => (
                  <span
                    key={i}
                    className="shrink-0 font-sans text-[#4B5563]"
                    style={{
                      background:   "#F3F4F6",
                      border:       "1px solid #E5E7EB",
                      borderRadius: 999,
                      padding:      "6px 12px",
                      height:       30,
                      fontSize:     13,
                      lineHeight:   "18px",
                      display:      "inline-flex",
                      alignItems:   "center",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              {/* Right fade mask */}
              <div
                className="absolute right-0 top-0 h-full pointer-events-none"
                style={{
                  width:      28,
                  background: "linear-gradient(to left, #FAFAFA, transparent)",
                }}
              />
            </div>
          )}

          <div style={{ height: 24 }} />

          {/* Quick-facts stat row */}
          <QuickFactsRow
            daysNeeded={dest.days_needed}
            budgetUsd={dest.estimated_budget_usd}
            maxElevationFt={(dest as Destination & DestExt).max_elevation_ft}
            bestSeason={dest.best_season}
          />
        </div>
      </section>

      {/* Park alerts — prominently before content, after hero */}
      <ParkAlertsBanner alerts={parkLiveData?.alerts ?? []} />

      {/* Por qué ir */}
      {(whyText || highlights.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="py-14 border-b border-border"
        >
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Por qué ir</h2>
            {whyText && (
              <div className="prose prose-stone max-w-none text-foreground/80 leading-relaxed mb-8">
                <ReactMarkdown>{whyText}</ReactMarkdown>
              </div>
            )}
            {highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {highlights.map((item, i) => {
                  const Icon = HIGHLIGHT_ICONS[i] ?? Compass;
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-accent/50 px-4 py-3 hover:bg-accent transition-colors">
                      <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/80 leading-relaxed">{item}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Senderos */}
      {(() => {
        const hikes = ((dest as Destination & DestExt).signature_hikes ?? []).filter(
          (h) => h?.nombre?.trim(),
        );
        return hikes.length > 0 ? <TrailsSection hikes={hikes} /> : null;
      })()}

      {/* Recargo no-residentes — solo si has_nonresident_surcharge = true */}
      {(dest as Destination & DestExt).has_nonresident_surcharge && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-b border-border"
        >
          <div className="container mx-auto px-4 max-w-3xl py-6">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-900">
                  Tarifa de entrada según residencia (2026)
                </p>
                <ul className="text-amber-800 space-y-1 leading-relaxed list-none">
                  <li>
                    <span className="font-medium">Residentes y ciudadanos de EE. UU.:</span>{" "}
                    tarifa estándar de entrada, sin recargo adicional.
                  </li>
                  <li>
                    <span className="font-medium">No-residentes de EE. UU. (16 años o más):</span>{" "}
                    tarifa estándar{" "}
                    <strong>
                      + ${(dest as Destination & DestExt).nonresident_surcharge ?? 100} USD adicionales por persona
                    </strong>{" "}
                    al ingresar.
                  </li>
                  <li>
                    <span className="font-medium">Niños de 15 años o menores:</span>{" "}
                    exentos del recargo adicional.
                  </li>
                </ul>
                <p className="text-amber-800 leading-relaxed">
                  Si planeas visitar 2 o más parques con este recargo, el{" "}
                  <strong>pase America the Beautiful para no-residentes ($250 USD)</strong>{" "}
                  puede ser más conveniente. Consulta las opciones en{" "}
                  <a
                    href={(dest as Destination & DestExt).nps_url ?? "https://www.nps.gov"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900 transition-colors"
                  >
                    nps.gov
                  </a>
                  .
                </p>
                <p className="text-xs text-amber-700">
                  Verifica las tarifas exactas en nps.gov antes de tu visita — pueden actualizarse.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="can-i" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="bg-background sticky top-20 z-30 mb-8 h-auto py-2 flex-wrap gap-1.5 shadow-sm border-b border-border rounded-none px-0 w-full justify-start overflow-x-auto scrollbar-hide">
                <TabsTrigger
                  value="can-i"
                  className="rounded-full font-sans text-sm h-9 data-[state=active]:bg-[#D97706] data-[state=active]:text-white data-[state=inactive]:bg-[#F3F4F6] data-[state=inactive]:text-[#6B7280]"
                >
                  ¿Puedo Hacerlo?
                </TabsTrigger>
                <TabsTrigger
                  value="prep"
                  className="rounded-full font-sans text-sm h-9 data-[state=active]:bg-[#D97706] data-[state=active]:text-white data-[state=inactive]:bg-[#F3F4F6] data-[state=inactive]:text-[#6B7280]"
                >
                  Preparación
                </TabsTrigger>
                <TabsTrigger
                  value="itinerary"
                  className="rounded-full font-sans text-sm h-9 data-[state=active]:bg-[#D97706] data-[state=active]:text-white data-[state=inactive]:bg-[#F3F4F6] data-[state=inactive]:text-[#6B7280]"
                >
                  Itinerario
                </TabsTrigger>
                <TabsTrigger
                  value="gear"
                  className="rounded-full font-sans text-sm h-9 data-[state=active]:bg-[#D97706] data-[state=active]:text-white data-[state=inactive]:bg-[#F3F4F6] data-[state=inactive]:text-[#6B7280]"
                >
                  Qué Llevar
                </TabsTrigger>
                <TabsTrigger
                  value="how-to-get"
                  className="rounded-full font-sans text-sm h-9 data-[state=active]:bg-[#D97706] data-[state=active]:text-white data-[state=inactive]:bg-[#F3F4F6] data-[state=inactive]:text-[#6B7280]"
                >
                  Cómo Llegar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="can-i">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* ── Difficulty panel (Component 3) ── */}
                    <div
                      className="bg-white border border-[#E5E7EB] rounded-2xl"
                      style={{ padding: 20 }}
                    >
                      <h2
                        className="font-serif font-bold text-[#1C1917]"
                        style={{ fontSize: 22 }}
                      >
                        ¿Puedo Hacerlo?
                      </h2>

                      {/* A — badge + anchor stat */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <DifficultyBadge
                          difficultyLevel={dest.difficulty_level}
                          beginnerFriendly={(dest as Destination & DestExt).beginner_friendly}
                          size="md"
                        />
                        {dest.days_needed && (
                          <span className="font-sans text-[#6B7280]" style={{ fontSize: 13 }}>
                            {dest.days_needed}
                          </span>
                        )}
                      </div>

                      {/* B — 2×2 stat grid */}
                      {(() => {
                        const ext = dest as Destination & DestExt;
                        const cells = [
                          { label: "DURACIÓN",  value: dest.days_needed },
                          { label: "ELEVACIÓN", value: ext.max_elevation_ft != null ? `${ext.max_elevation_ft.toLocaleString("en-US")} ft` : null },
                          { label: "TEMPORADA", value: dest.best_season },
                          { label: "PRINCIPIANTE", value: ext.beginner_friendly === true ? "Sí ✓" : ext.beginner_friendly === false ? "No recomendado" : null },
                        ].filter((c) => c.value);
                        if (!cells.length) return null;
                        return (
                          <div
                            className="grid grid-cols-2 border border-[#E5E7EB] rounded-xl overflow-hidden"
                            style={{ marginTop: 12 }}
                          >
                            {cells.map(({ label, value }, i) => (
                              <div
                                key={label}
                                className="flex flex-col items-center justify-center text-center"
                                style={{
                                  padding: 12,
                                  borderRight:  (i % 2 === 0) ? "1px solid #E5E7EB" : undefined,
                                  borderBottom: (i < cells.length - 2) ? "1px solid #E5E7EB" : undefined,
                                }}
                              >
                                <span
                                  className="font-sans font-semibold text-[#1C1917]"
                                  style={{ fontSize: 17 }}
                                >
                                  {value}
                                </span>
                                <span
                                  className="font-sans text-[#6B7280] uppercase tracking-[0.06em] mt-0.5"
                                  style={{ fontSize: 11 }}
                                >
                                  {label}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* C — "Lo más duro" callout */}
                      {dest.difficulty_description && (
                        <div
                          className="flex gap-3"
                          style={{ marginTop: 16 }}
                        >
                          <div
                            className="shrink-0 rounded-full"
                            style={{ width: 3, background: "#D97706", alignSelf: "stretch" }}
                          />
                          <div style={{ paddingLeft: 0 }}>
                            <p
                              className="font-sans uppercase text-[#D97706]"
                              style={{ fontSize: 11, letterSpacing: "0.06em", fontWeight: 500 }}
                            >
                              LO MÁS DURO
                            </p>
                            <div style={{ height: 4 }} />
                            <p
                              className="font-sans text-[#1C1917] leading-relaxed"
                              style={{ fontSize: 15 }}
                            >
                              {dest.difficulty_description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* altitude warning banner */}
                      {(dest as Destination & DestExt).altitude_warning && (
                        <div
                          className="flex items-center gap-2 rounded-lg"
                          style={{ marginTop: 12, background: "#FEF3C7", padding: "8px 12px" }}
                        >
                          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#92400E" }} />
                          <span className="font-sans" style={{ fontSize: 13, color: "#92400E" }}>
                            Posible mal de altura en este destino
                          </span>
                        </div>
                      )}

                      {/* D — "No ideal si…" */}
                      {((dest as Destination & DestExt).not_ideal_if ?? []).length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <p
                            className="font-sans uppercase text-[#6B7280]"
                            style={{ fontSize: 11, letterSpacing: "0.06em" }}
                          >
                            NO IDEAL SI...
                          </p>
                          <div style={{ height: 8 }} />
                          {((dest as Destination & DestExt).not_ideal_if ?? []).map((item, i) => (
                            <p
                              key={i}
                              className="font-sans text-[#4B5563] flex gap-2"
                              style={{ fontSize: 14, marginBottom: 4 }}
                            >
                              <span style={{ color: "#D97706" }}>✗</span>
                              {item}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── FAQ accordion ── */}
                    {fears.length > 0 && (
                      <div className="border-t border-border pt-6 mt-8">
                        <h3 className="font-serif text-2xl text-foreground mb-5">Preguntas Frecuentes</h3>
                        <Accordion type="single" collapsible className="w-full">
                          {fears.map((f, i) => (
                            <AccordionItem key={i} value={`fear-${i}`} className="border-border">
                              <AccordionTrigger className="text-foreground hover:text-primary">{f.miedo}</AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed">{f.respuesta}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="prep">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ParkWeatherCard weather={parkLiveData?.weather} />
                    {dest.preparation_plan
                      ? <div className="prose prose-stone max-w-none text-foreground/90 leading-relaxed prose-headings:font-serif prose-headings:text-foreground">
                          <ReactMarkdown components={markdownComponents}>{dest.preparation_plan}</ReactMarkdown>
                        </div>
                      : <div className="py-16 text-center">
                          <p className="text-sm text-muted-foreground">Contenido próximamente.</p>
                        </div>
                    }
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="itinerary">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {dest.itinerary_markdown
                      ? <ItineraryDayCards markdown={dest.itinerary_markdown} components={markdownComponents} />
                      : <div className="py-16 text-center">
                          <p className="text-sm text-muted-foreground">Contenido próximamente.</p>
                        </div>
                    }
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="gear">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {dest.gear_list_markdown
                      ? <div className="prose prose-stone max-w-none text-foreground/90 leading-relaxed prose-headings:font-serif prose-headings:text-foreground">
                          <ReactMarkdown components={markdownComponents}>{dest.gear_list_markdown}</ReactMarkdown>
                        </div>
                      : <div className="py-16 text-center">
                          <p className="text-sm text-muted-foreground">Contenido próximamente.</p>
                        </div>
                    }
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="how-to-get">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {(() => {
                      const ext = dest as Destination & DestExt;
                      return (
                        <HowToGetThere
                          nearestAirport={ext.nearest_airport}
                          nearestTown={ext.nearest_town}
                          driveTimeFromLA={ext.drive_time_from_la}
                          driveTimeFromSD={ext.drive_time_from_san_diego}
                          gettingThereMarkdown={ext.getting_there_markdown}
                          cellSignalStatus={dest.cell_signal_status}
                          lodgingInfo={ext.lodging_info}
                          latitude={ext.latitude}
                          longitude={ext.longitude}
                        />
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </div>
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <PermitScarcity destinationSlug={slug || ""} />
              <Card className="bg-card border-border hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-card-foreground">Reserva Tu Viaje</CardTitle>
                  {dest.best_season && (
                    <p className="text-xs text-primary mt-1">🗓️ Mejor temporada: {dest.best_season}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {/* WhatsApp — canal de cierre principal */}
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground w-full font-semibold text-sm whitespace-normal h-auto py-2">
                    <a href={buildWhatsAppLink(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="mr-2 h-4 w-4 shrink-0" /> ¿Listo para ir? Te armamos el itinerario completo →
                    </a>
                  </Button>
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
                  {(() => {
                    const ext = dest as Destination & DestExt;
                    const url = ext.recreation_gov_url ?? ext.nps_url;
                    if (!url) return null;
                    const label = ext.recreation_gov_url
                      ? "Reservas en Recreation.gov"
                      : "Información oficial del parque";
                    return (
                      <Button asChild variant="outline" className={bookingOutlineBtn}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> {label}
                        </a>
                      </Button>
                    );
                  })()}
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
              loading="lazy"
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
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="pt-8 border-t border-border">
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
                    <p className="text-sm text-card-foreground/70">{countryFlag[r.country] || "🏔"} {formatRegionDisplay(r.region) || r.country}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="my-12 container mx-auto px-4 max-w-3xl">
        <ConciergeChat
          destinationSlug={dest.slug}
          destinationTitle={dest.title}
        />
        <CredibilityBar
          lastVerifiedAt={(dest as Destination & DestExt).last_verified_at}
        />
      </div>

      {/* WhatsApp CTA */}
      <ArticleWhatsAppCTA title={dest.title} whatsappMessage={whatsappMessage} />

      <PremiumItinerarySection />

      <div className="container mx-auto px-4 py-8 text-center">
        <Button variant="outline" className="border-border text-foreground hover:bg-muted" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Volver arriba</Button>
      </div>
      <StickyMobileCTA whatsappMessage={whatsappMessage} permitAlertUrl={permitAlertUrl} estimatedBudgetUsd={dest.estimated_budget_usd ?? null} />
      <Footer />
    </main>
  );
};

export default DestinationDetail;
