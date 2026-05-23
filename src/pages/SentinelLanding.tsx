import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Bell, Mountain, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const emailSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type EmailFormData = z.infer<typeof emailSchema>;

const SentinelLanding = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  usePageMeta({
    title: "Sentinel — Alertas de Yosemite en WhatsApp",
    description:
      "Monitoreamos 24/7 los cupos que se liberan en Yosemite y te alertamos por WhatsApp en segundos. Campgrounds, permisos y timed-entry.",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("sentinel_leads" as any)
        .insert([{ email: data.email, source: "sentinel-landing" }]);

      if (error) {
        if (error.code === "23505") {
          // Duplicate email — treat as success, continue
        } else {
          toast({
            title: "Error",
            description: "Hubo un problema. Intenta de nuevo.",
            variant: "destructive",
          });
          return;
        }
      }

      const stripeUrl = import.meta.env.VITE_STRIPE_SENTINEL_URL;
      if (stripeUrl) {
        window.location.href = stripeUrl;
      } else {
        setSubmitted(true);
        toast({
          title: "¡Registrado!",
          description: "Tu email fue guardado exitosamente. Te contactaremos pronto.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1C1917] text-[#F5F0EB]">
      {/* Nav minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1C1917]/90 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-[#F5F0EB]">
            Nomadería
          </Link>
          <Badge variant="outline" className="border-[#D97706] text-[#D97706]">
            Beta
          </Badge>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-[#D97706]/20 text-[#D97706] border-[#D97706]/30">
              <Bell className="w-3 h-3 mr-1" />
              Nomaderia Sentinel
            </Badge>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight">
              No dejes tu aventura en Yosemite a la suerte
            </h1>
            <p className="text-lg md:text-xl text-[#F5F0EB]/80 max-w-2xl mx-auto leading-relaxed">
              Monitoreamos 24/7 los cupos que realmente se liberan en Yosemite
              — campgrounds, permisos wilderness y timed-entry — y te alertamos
              por WhatsApp en segundos. Para Half Dome (que es lotería, no
              cancelación) te recordamos las fechas y te ayudamos a prepararte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Mockup */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-2xl bg-[#0B141A] border border-white/10 overflow-hidden shadow-2xl">
              {/* WhatsApp header */}
              <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D97706] flex items-center justify-center">
                  <Mountain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Nomaderia Sentinel</p>
                  <p className="text-xs text-white/60">en línea</p>
                </div>
              </div>
              {/* Message bubble */}
              <div className="p-4 space-y-2">
                <div className="bg-[#005C4B] rounded-lg rounded-tl-none px-3 py-2 max-w-[85%] inline-block">
                  <p className="text-sm text-white">
                    🏔️ ¡Se liberó un cupo en North Pines para tus fechas!
                    Resérvalo ya 👉
                  </p>
                  <p className="text-[10px] text-white/50 text-right mt-1">
                    Ahora
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Alertas en segundos",
                desc: "Te notificamos al instante cuando se libera un cupo en campgrounds o permisos.",
              },
              {
                icon: Shield,
                title: "Monitoreo 24/7",
                desc: "Nuestro sistema revisa continuamente campgrounds, wilderness permits y timed-entry.",
              },
              {
                icon: Bell,
                title: "Half Dome: lotería",
                desc: "Te recordamos las fechas de la lotería y te ayudamos a preparar tu aplicación.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardContent className="p-6">
                    <item.icon className="w-8 h-8 text-[#D97706] mb-4" />
                    <h3 className="font-serif text-lg font-semibold text-[#F5F0EB] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#F5F0EB]/70">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Card + Email Capture */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-white/5 border-[#D97706]/40 overflow-hidden">
              <CardContent className="p-8 text-center">
                <h2 className="font-serif text-2xl font-bold text-[#F5F0EB] mb-2">
                  Acceso de Fundador
                </h2>
                <p className="text-4xl font-bold text-[#D97706] mb-2">$29 USD</p>
                <p className="text-[#F5F0EB]/80 mb-6">
                  Te conseguimos tu cupo en Yosemite esta temporada
                </p>

                {submitted ? (
                  <div className="py-4">
                    <p className="text-[#D97706] font-semibold">
                      ✓ ¡Registrado! Te contactaremos pronto.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-3"
                  >
                    <div>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        className={cn(
                          "bg-white/10 border-white/20 text-[#F5F0EB] placeholder:text-[#F5F0EB]/40",
                          errors.email && "border-red-500"
                        )}
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1 text-left">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold"
                      size="lg"
                    >
                      {isSubmitting
                        ? "Procesando..."
                        : "Quiero mi cupo en Yosemite"}
                    </Button>
                  </form>
                )}

                <p className="text-xs text-[#F5F0EB]/50 mt-4">
                  Pago único. Sin suscripciones.
                </p>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-[#F5F0EB]/60 mt-4 italic">
              Cupos de fundador limitados.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-[#F5F0EB]/50">
          <p>© {new Date().getFullYear()} Nomadería. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
};

export default SentinelLanding;
