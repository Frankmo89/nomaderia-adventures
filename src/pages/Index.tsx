import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import DidYouKnowSection from "@/components/landing/DidYouKnowSection";
import QuizSection from "@/components/landing/QuizSection";
import DestinationsCatalog from "@/components/landing/DestinationsCatalog";
import GearPreview from "@/components/landing/GearPreview";
import BlogPreview from "@/components/landing/BlogPreview";
import SocialProof from "@/components/landing/SocialProof";
import TravelInsuranceSection from "@/components/landing/TravelInsuranceSection";
import PremiumItinerarySection from "@/components/landing/PremiumItinerarySection";
import NewsletterSignup from "@/components/landing/NewsletterSignup";
import Footer from "@/components/landing/Footer";
import { useCanonical, SITE_URL, usePageMeta } from "@/hooks/use-seo";
import { useMemo } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/editorial/Reveal";

const CTA_WHATSAPP_MESSAGE = '¡Hola! Estoy listo para diseñar mi viaje a medida.';

const Index = () => {
  useCanonical();
  usePageMeta({
    title: "Nomaderia — Aventuras en Parques Nacionales en Español",
    description: "Itinerarios personalizados y alertas de permisos para hispanos en EE. UU. Planea tu aventura en Yosemite, Grand Canyon y más. En español.",
  });

  const ctaWhatsAppUrl = buildWhatsAppLink(CTA_WHATSAPP_MESSAGE);

  const jsonLdData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Nomaderia Adventures",
      url: SITE_URL,
      description:
        "Plataforma de aventuras outdoor para hispanohablantes principiantes",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/destinos/{search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),
    []
  );

  const organizationLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: "Nomaderia Adventures",
      url: SITE_URL,
      description:
        "Itinerarios personalizados y alertas de permisos para hispanos en EE. UU. Planea tu aventura en Yosemite, Grand Canyon y más. En español.",
      email: "nomaderia.travel@gmail.com",
      sameAs: [
        "https://www.instagram.com/nomaderia.mx",
        "https://www.tiktok.com/@nomaderia.mx",
        "https://www.facebook.com/Nomaderia",
      ],
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      knowsLanguage: "es",
      priceRange: "$29-$49 USD",
    }),
    []
  );

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={jsonLdData} />
      <JsonLd data={organizationLd} />
      <HeroSection />
      <section className="bg-wash-clay py-8">
        <Reveal className="container mx-auto px-4 text-center">
          <Link to="/sentinel" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            <Bell className="w-4 h-4" />
            Alertas Yosemite — Cupos de Fundador $29 USD
          </Link>
        </Reveal>
      </section>
      <SocialProof />
      <PremiumItinerarySection />
      <TravelInsuranceSection />
      <section className="bg-wash-forest py-16">
        <Reveal className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            ¿Listo para tu primera gran aventura?
          </h2>
          <Button asChild size="lg">
            <a
              href={ctaWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Diseña tu viaje a medida
            </a>
          </Button>
        </Reveal>
      </section>
      <QuizSection />
      <DidYouKnowSection />
      <DestinationsCatalog limit={3} />
      <GearPreview />
      <BlogPreview />
      <NewsletterSignup />
      <Footer />
    </main>
  );
};

export default Index;
