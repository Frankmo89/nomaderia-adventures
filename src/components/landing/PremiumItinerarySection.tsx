import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Map, Headphones, BadgeDollarSign, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre completo"),
  email: z.string().email("Ingresa un email válido"),
  destination: z.string().min(2, "Dinos a dónde quieres ir"),
  estimated_budget: z.string().min(1, "Selecciona un rango de presupuesto"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const benefits = [
  {
    icon: Map,
    title: "Rutas Secretas",
    desc: "Caminos que no encuentras en Google ni en ninguna guía de turistas",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    desc: "Acompañamiento personalizado antes, durante y después de tu aventura",
  },
  {
    icon: BadgeDollarSign,
    title: "Optimización de Presupuesto",
    desc: "Máxima experiencia sin desperdiciar un peso en lo que no importa",
  },
  {
    icon: Zap,
    title: "Respuesta en 24h",
    desc: "Tu propuesta personalizada lista en menos de un día hábil",
  },
];

interface Props {
  destinationName?: string;
}

const PremiumItinerarySection = ({ destinationName }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      destination: destinationName || "",
      estimated_budget: "",
      message: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    const { error } = await supabase.from("itinerary_requests").insert({
      name: values.name,
      email: values.email,
      destination: values.destination,
      estimated_budget: values.estimated_budget,
      message: values.message || null,
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Algo salió mal",
        description: "No pudimos enviar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "¡Solicitud enviada!",
      description: "Te contactaremos en menos de 24 horas con tu itinerario personalizado.",
    });
    setOpen(false);
    form.reset();
  };

  return (
    <>
      <section className="py-20 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-secondary/5" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--secondary) / 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(var(--trail) / 0.06) 0%, transparent 50%)" }} />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-sm font-medium tracking-wide">
                ✦ Exclusivo · Solo 5 cupos al mes
              </span>
            </div>

            {/* Heading */}
            <div className="text-center mb-4">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Tu Aventura,{" "}
                <span className="text-secondary">Tu Medida</span>
              </h2>
            </div>

            <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Diseño tu itinerario de trekking desde cero, adaptado a tu cuerpo, presupuesto y sueños.
              Sin plantillas genéricas. Sin rutas de turista.
            </p>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-card/60 border border-secondary/15 hover:border-secondary/30 transition-colors"
                >
                  <div className="shrink-0 p-2.5 rounded-xl bg-secondary/15">
                    <b.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">{b.title}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => setOpen(true)}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-base px-10 py-6 rounded-2xl font-semibold shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all"
              >
                Solicitar Mi Itinerario Personalizado →
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Sin compromiso · Respuesta garantizada en 24h</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-card-foreground">Cuéntame Tu Aventura</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Completa el formulario y diseñaré un itinerario exclusivo para ti.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground/80">Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" className="bg-background border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-card-foreground/80">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" className="bg-background border-border text-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="destination" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground/80">Destino de interés</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Camino Inca, Torres del Paine, Kilimanjaro..." className="bg-background border-border text-foreground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="estimated_budget" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground/80">Presupuesto estimado (USD)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecciona un rango" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="menos-de-500">Menos de $500</SelectItem>
                      <SelectItem value="500-1000">$500 – $1,000</SelectItem>
                      <SelectItem value="1000-2500">$1,000 – $2,500</SelectItem>
                      <SelectItem value="2500-5000">$2,500 – $5,000</SelectItem>
                      <SelectItem value="mas-de-5000">Más de $5,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground/80">Cuéntame más <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Fechas, condición física, miedos, sueños... todo cuenta."
                      className="bg-background border-border text-foreground resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-5 rounded-xl"
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumItinerarySection;
