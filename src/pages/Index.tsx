import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import JsonLd from "@/components/JsonLd";
import DeferUntilVisible from "@/components/DeferUntilVisible";
import { useCanonical, SITE_URL, usePageMeta } from "@/hooks/use-seo";
import { PRICING } from "@/config/pricing";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { BRAND_ASSETS } from "@/config/assets";
import { lazyWithRetry } from "@/lib/lazy-with-retry";

// Below-the-fold homepage sections — deferred so hero H1 can become LCP
// without waiting on Framer/heavy section chunks.
const PromiseSection = lazyWithRetry(() => import("@/components/landing/PromiseSection"));
const QuizSection = lazyWithRetry(() => import("@/components/landing/QuizSection"));
const DestinationsCatalog = lazyWithRetry(() => import("@/components/landing/DestinationsCatalog"));
const PainContrast = lazyWithRetry(() => import("@/components/landing/PainContrast"));
const FaqSection = lazyWithRetry(() => import("@/components/landing/FaqSection"));
const GearPreview = lazyWithRetry(() => import("@/components/landing/GearPreview"));
const BlogPreview = lazyWithRetry(() => import("@/components/landing/BlogPreview"));
const TravelInsuranceSection = lazyWithRetry(() => import("@/components/landing/TravelInsuranceSection"));
const PremiumItinerarySection = lazyWithRetry(() => import("@/components/landing/PremiumItinerarySection"));
const NewsletterSignup = lazyWithRetry(() => import("@/components/landing/NewsletterSignup"));
const Footer = lazyWithRetry(() => import("@/components/landing/Footer"));
const SectionDivider = lazyWithRetry(() => import("@/components/landing/SectionDivider"));

function LazyBlock({ children }: { children: ReactNode }) {
  return (
    <DeferUntilVisible rootMargin="300px 0px">
      <Suspense fallback={null}>{children}</Suspense>
    </DeferUntilVisible>
  );
}

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
    // Hash targets live in deferred sections — retry briefly until mounted.
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (attempts++ < 60) window.setTimeout(tryScroll, 50);
    };
    tryScroll();
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
      logo: "https://nomaderia.com/icons/icon-512.png",
      description:
        "Itinerarios personalizados y alertas de permisos para hispanos en EE. UU. Planea tu aventura en Yosemite, Grand Canyon y más. En español.",
      email: "nomaderia.travel@gmail.com",
      telephone: `+${WHATSAPP_NUMBER}`,
      image: BRAND_ASSETS.defaultOgImage,
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
      priceRange: `$${PRICING.itinerarioCompleto} USD`,
    }),
    []
  );

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <JsonLd data={jsonLdData} />
      <JsonLd data={organizationLd} />
      <HeroSection />
      <LazyBlock>
        <PromiseSection />
        <SectionDivider variant="simple" fill="#1C1917" />
      </LazyBlock>
      <LazyBlock>
        <SectionDivider variant="layered" fill="#FBFAF7" />
        <DestinationsCatalog limit={3} />
        <SectionDivider variant="layered" fill="#14201A" />
      </LazyBlock>
      <LazyBlock>
        <PainContrast />
        <QuizSection />
        <TravelInsuranceSection />
      </LazyBlock>
      <LazyBlock>
        <SectionDivider variant="layered" fill="#E8F1EA" />
        <FaqSection />
        <SectionDivider variant="layered" fill="#F4EFE7" />
        <PremiumItinerarySection />
      </LazyBlock>
      <LazyBlock>
        <SectionDivider variant="simple" fill="#1C1917" />
        <GearPreview />
        <BlogPreview />
        <NewsletterSignup />
        <SectionDivider variant="simple" fill="#14201A" />
        <Footer />
      </LazyBlock>
    </main>
  );
};

export default Index;
