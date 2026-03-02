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
import { useCanonical, useJsonLd, SITE_URL } from "@/hooks/use-seo";
import { useMemo } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

const Index = () => {
  useCanonical();

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

  useJsonLd(jsonLdData);
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <SocialProof />
      <PremiumItinerarySection />
      <TravelInsuranceSection />
      <section className="bg-secondary/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            ¿Listo para tu primera gran aventura?
          </h2>
          <Button asChild size="lg">
            <a
              href={buildWhatsAppUrl('¡Hola! Estoy listo para diseñar mi viaje a medida.', '18588996802')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Diseña tu viaje a medida
            </a>
          </Button>
        </div>
      </section>
      <QuizSection />
      <DidYouKnowSection />
      <DestinationsCatalog />
      <GearPreview />
      <BlogPreview />
      <NewsletterSignup />
      <Footer />
    </main>
  );
};

export default Index;
