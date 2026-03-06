import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, WHATSAPP_NUMBER } from "@/lib/whatsapp";

interface ArticleWhatsAppCTAProps {
  title: string;
}

const ArticleWhatsAppCTA = ({ title }: ArticleWhatsAppCTAProps) => {
  const message = `¡Hola! Acabo de leer sobre ${title} y me gustaría que me ayudes a armar mi viaje.`;
  const url = buildWhatsAppUrl(message, WHATSAPP_NUMBER);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-4xl mx-auto px-4 pb-8"
    >
      <div className="rounded-xl border border-border bg-[#F5F0EB] py-10 px-6 text-center">
        <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
          &iquest;Listo para vivir esta aventura?
        </h3>
        <p className="text-muted-foreground text-lg mb-6">
          Deja de planear y empieza a empacar.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-5 w-5" />
            Dise&ntilde;a mi viaje a medida
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default ArticleWhatsAppCTA;
