import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import PromiseSection from "@/components/landing/PromiseSection";
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
import { PRICING } from "@/config/pricing";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import JsonLd from "@/components/JsonLd";
import SectionDivider from "@/components/landing/SectionDivider";

const Index = () => {
  useCanonical();
  usePageMeta({
    title: "Nomaderia — Aventuras en Parques Nacionales en Español",
    description: "Itinerarios personalizados y alertas de permisos para hispanos en EE. UU. Planea tu aventura en Yosemite, Grand Canyon y más. En español.",
  });

  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

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
      priceRange: `$${PRICING.solucionCompleta} USD`,
    }),
    []
  );

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={jsonLdData} />
      <JsonLd data={organizationLd} />
      <HeroSection />
      <PromiseSection />
      <SectionDivider variant="simple" fill="#1C1917" />
      <SocialProof />
      <SectionDivider variant="layered" fill="#FBFAF7" />
      <DestinationsCatalog limit={3} />
      <SectionDivider variant="layered" fill="#14201A" />
      <QuizSection />
      <TravelInsuranceSection />
      <SectionDivider variant="layered" fill="#F4EFE7" />
      <PremiumItinerarySection />
      <SectionDivider variant="simple" fill="#1C1917" />
      <GearPreview />
      <BlogPreview />
      <NewsletterSignup />
      <SectionDivider variant="simple" fill="#14201A" />
      <Footer />
    </main>
  );
};

export default Index;
