import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DestinationsCatalog from "@/components/landing/DestinationsCatalog";
import { useCanonical } from "@/hooks/use-seo";

const Destinations = () => {
  useCanonical();

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <section className="pt-28 pb-8 sm:pt-32 sm:pb-10">
        <div className="container mx-auto px-5 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"
          >
            Todos Nuestros Destinos
          </motion.h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Explora todas las aventuras que tenemos para ti
          </p>
        </div>
      </section>
      <DestinationsCatalog />
      <Footer />
    </main>
  );
};

export default Destinations;
