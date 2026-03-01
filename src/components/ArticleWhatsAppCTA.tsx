import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const WHATSAPP_NUMBER = "18588996802";

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
      className="container mx-auto px-4 max-w-3xl pb-8"
    >
      <div className="rounded-xl border border-border bg-[#F5F0EB] p-8 text-center">
        <h3 className="font-serif text-2xl text-foreground mb-2">
          ¿Listo para vivir esta aventura?
        </h3>
        <p className="text-muted-foreground mb-6">
          Deja de planear y empieza a empacar.
        </p>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Diseña mi viaje a medida
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default ArticleWhatsAppCTA;
