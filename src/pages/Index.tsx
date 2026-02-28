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
      <DidYouKnowSection />
      <QuizSection />
      <DestinationsCatalog />
      <GearPreview />
      <BlogPreview />
      <SocialProof />
      <TravelInsuranceSection />
      <PremiumItinerarySection />
      <NewsletterSignup />
      <Footer />
    </main>
  );
};

export default Index;
