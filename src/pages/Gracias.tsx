import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageMeta } from "@/hooks/use-seo";
import { usePermitAlert } from "@/hooks/use-permit-alert";

const knownParks = [
  "Yosemite National Park",
  "Grand Canyon National Park",
  "Zion National Park",
  "Rocky Mountain National Park",
  "Glacier National Park",
  "Sequoia & Kings Canyon",
  "Otro",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Gracias = () => {
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get("email")?.trim() || "";
  const initialYear = useMemo(() => {
    const now = new Date();
    return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  }, []);

  const [email, setEmail] = useState(prefilledEmail);
  const [parkOption, setParkOption] = useState(knownParks[0]);
  const [customPark, setCustomPark] = useState("");
  const [permitName, setPermitName] = useState("Half Dome Cables");
  const [targetYear, setTargetYear] = useState(String(initialYear));
  const [formError, setFormError] = useState<string | null>(null);
  const [successPark, setSuccessPark] = useState<string | null>(null);
  const { mutate: createPermitAlert, isPending } = usePermitAlert();

  usePageMeta({
    title: "¡Gracias por tu compra!",
    description: "Confirmación de compra de la alerta de permisos de Nomaderia.",
    robots: "noindex, nofollow",
  });

  const selectedPark = parkOption === "Otro" ? customPark.trim() : parkOption;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!emailRegex.test(email.trim())) {
      setFormError("Ingresa un correo válido para activar tu alerta.");
      return;
    }

    if (!selectedPark) {
      setFormError("Selecciona un parque o escribe uno personalizado.");
      return;
    }

    if (!permitName.trim()) {
      setFormError("Indica el nombre del permiso que quieres monitorear.");
      return;
    }

    const parsedYear = Number(targetYear);
    if (!Number.isInteger(parsedYear) || parsedYear < 2024) {
      setFormError("Ingresa un año objetivo válido.");
      return;
    }

    createPermitAlert(
      {
        email: email.trim().toLowerCase(),
        park: selectedPark,
        permit_name: permitName.trim(),
        target_year: parsedYear,
      },
      {
        onSuccess: (result) => {
          setSuccessPark(result.park);
        },
        onError: (error) => {
          setFormError(error.message || "No pudimos activar tu alerta. Intenta de nuevo en un momento.");
        },
      },
    );
  };

  return (
    <main className="bg-background min-h-screen text-foreground">
      <Navbar />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <Card className="mx-auto max-w-2xl border-border/60">
          <CardContent className="p-6 md:p-10 space-y-6">
            <div className="space-y-3">
              <h1 className="font-serif text-3xl md:text-4xl leading-tight">
                ¡Listo, eres parte de Nomaderia!
              </h1>
              <p className="text-base md:text-lg text-foreground/80">
                Ya recibimos tu pago correctamente. En las próximas 24 horas te
                vamos a contactar por WhatsApp para empezar a trabajar en tu spot
                de Yosemite y ayudarte a aumentar tus probabilidades de conseguir
                permiso.
              </p>
            </div>

            <div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a
                  href="https://nomaderia.com/sentinel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Compartir la alerta con alguien más
                </a>
              </Button>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-4">
              <h2 className="font-serif text-2xl leading-tight">Activa tu Alerta de Permisos</h2>

              {!successPark ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert-email" className="text-foreground">Correo electrónico</Label>
                    <Input
                      id="alert-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tuemail@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-park" className="text-foreground">Parque</Label>
                    <Select value={parkOption} onValueChange={setParkOption}>
                      <SelectTrigger id="alert-park">
                        <SelectValue placeholder="Selecciona un parque" />
                      </SelectTrigger>
                      <SelectContent>
                        {knownParks.map((park) => (
                          <SelectItem key={park} value={park}>{park}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {parkOption === "Otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="alert-custom-park" className="text-foreground">Escribe el parque</Label>
                      <Input
                        id="alert-custom-park"
                        value={customPark}
                        onChange={(e) => setCustomPark(e.target.value)}
                        placeholder="Ej: Mount Rainier National Park"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="alert-permit" className="text-foreground">Nombre del permiso</Label>
                    <Input
                      id="alert-permit"
                      value={permitName}
                      onChange={(e) => setPermitName(e.target.value)}
                      placeholder="Ej: Half Dome Cables"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert-year" className="text-foreground">Año objetivo</Label>
                    <Input
                      id="alert-year"
                      type="number"
                      min={2024}
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      required
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-destructive font-medium">{formError}</p>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Te avisaremos cuando se abra la ventana oficial. Esta alerta no garantiza obtener permiso.
                  </p>

                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Activando alerta..." : "Activar mi alerta"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4">
                  <p className="text-sm font-medium text-secondary">
                    Listo. Te avisaremos por email cuando abran los permisos de {successPark}.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
};

export default Gracias;
