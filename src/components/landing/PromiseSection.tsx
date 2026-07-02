import { motion } from "framer-motion";

/**
 * PromiseSection — a pure typographic moment between the hero and the social
 * proof. Dark full-bleed surface (forest-dark) with a single centered Playfair
 * statement; no buttons, icons, or images by design.
 */
const PromiseSection = () => {
  return (
    <section className="bg-forest-dark py-20 sm:py-28">
      <div className="container mx-auto px-5">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center font-serif text-3xl italic leading-snug text-mist sm:text-4xl"
        >
          Los parques más increíbles de EE.UU. te están esperando — y por fin
          alguien te explica{" "}
          <span className="text-green">cómo llegar</span>.
        </motion.p>
      </div>
    </section>
  );
};

export default PromiseSection;
