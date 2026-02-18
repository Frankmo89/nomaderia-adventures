import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import DidYouKnowSection from "@/components/landing/DidYouKnowSection";
import QuizSection from "@/components/landing/QuizSection";
import DestinationsCatalog from "@/components/landing/DestinationsCatalog";
import GearPreview from "@/components/landing/GearPreview";
import SocialProof from "@/components/landing/SocialProof";
import NewsletterSignup from "@/components/landing/NewsletterSignup";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <DidYouKnowSection />
      <QuizSection />
      <DestinationsCatalog />
      <GearPreview />
      <SocialProof />
      <NewsletterSignup />
      <Footer />
    </main>
  );
};

export default Index;
