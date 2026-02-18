import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await supabase.from("newsletter_subscribers").insert({ email, source: "footer" });
      setDone(true);
      toast({ title: "¡Bienvenido/a! 🎉", description: "Te enviamos aventuras cada semana." });
    } catch {
      toast({ title: "Error", description: "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-muted">
      <div className="container mx-auto px-5 max-w-xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3"
        >
          Cada Semana Una Aventura Nueva En Tu Inbox
        </motion.h2>
        <p className="text-muted-foreground mb-2 text-sm sm:text-base">
          Únete a nuestra comunidad de aventureros 🌎
        </p>
        <p className="text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm opacity-70">
          Tips, destinos secretos, y ofertas de equipo. Sin spam, lo prometemos.
        </p>

        {done ? (
          <p className="text-primary font-medium text-base sm:text-lg">¡Gracias! Te mantendremos al tanto 🏔️</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background text-foreground h-12 text-base"
            />
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground whitespace-nowrap h-12 text-base">
              {loading ? "..." : "Suscribirme"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSignup;
