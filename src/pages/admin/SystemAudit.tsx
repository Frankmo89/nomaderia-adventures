import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ShieldAlert, Send, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type CheckStatus = "pending" | "ok" | "error";

interface EnvCheck {
  name: string;
  value: string | undefined;
}

interface SupabaseCheck {
  status: CheckStatus;
  message: string;
}

interface GtagCheck {
  status: CheckStatus;
}

const StatusBadge = ({
  status,
  okLabel,
  errorLabel,
}: {
  status: CheckStatus;
  okLabel: string;
  errorLabel: string;
}) => {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando…
      </span>
    );
  }
  if (status === "ok") {
    return (
      <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        {okLabel}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
      <XCircle className="h-4 w-4" />
      {errorLabel}
    </span>
  );
};

type TestEmailStatus = "idle" | "sending" | "ok" | "error";

interface ImageCheckResult {
  url: string;
  status: "ok" | "error";
}

interface ImageCheckState {
  running: boolean;
  results: ImageCheckResult[];
  total: number;
  checked: number;
}

const SystemAudit = () => {
  const envChecks: EnvCheck[] = [
    {
      name: "VITE_SUPABASE_URL",
      value: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    },
    {
      name: "VITE_SUPABASE_PUBLISHABLE_KEY",
      value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
    },
    {
      name: "VITE_GA_MEASUREMENT_ID",
      value: import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined,
    },
    {
      name: "VITE_SENTRY_DSN",
      value: import.meta.env.VITE_SENTRY_DSN as string | undefined,
    },
  ];

  const [supabaseCheck, setSupabaseCheck] = useState<SupabaseCheck>({
    status: "pending",
    message: "",
  });

  const [gtagCheck, setGtagCheck] = useState<GtagCheck>({ status: "pending" });

  // Prueba de Ventas state
  const [testEmailStatus, setTestEmailStatus] = useState<TestEmailStatus>("idle");
  const [testEmailError, setTestEmailError] = useState("");

  // Verificador de Imágenes state
  const [imageCheck, setImageCheck] = useState<ImageCheckState>({
    running: false,
    results: [],
    total: 0,
    checked: 0,
  });

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { error } = await supabase
          .from("destinations")
          .select("id")
          .limit(1);
        if (error) {
          setSupabaseCheck({ status: "error", message: error.message });
        } else {
          setSupabaseCheck({ status: "ok", message: "" });
        }
      } catch (err) {
        setSupabaseCheck({
          status: "error",
          message: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    };

    checkSupabase();

    const isGtagReady =
      typeof window !== "undefined" &&
      typeof window.gtag === "function";
    setGtagCheck({ status: isGtagReady ? "ok" : "error" });
  }, []);

  const handleSendTestEmail = async () => {
    setTestEmailStatus("sending");
    setTestEmailError("");
    try {
      const { error } = await supabase.functions.invoke("send-quiz-email", {
        body: {
          email: "test@nomaderia.com",
          destinations: [
            {
              title: "Yosemite National Park",
              slug: "yosemite",
              short_description: "Destino de prueba para verificar el flujo de envío de emails.",
              country: "EE.UU.",
              estimated_budget_usd: 800,
              days_needed: "5-7",
              hero_image_url: null,
              difficulty_level: "moderate",
            },
          ],
          fitness_level: "moderate",
          interest: "adventure",
        },
      });
      if (error) {
        setTestEmailStatus("error");
        setTestEmailError(error.message);
      } else {
        setTestEmailStatus("ok");
      }
    } catch (err) {
      setTestEmailStatus("error");
      setTestEmailError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleCheckImages = async () => {
    setImageCheck({ running: true, results: [], total: 0, checked: 0 });
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("hero_image_url")
        .not("hero_image_url", "is", null);

      if (error || !data) {
        setImageCheck({ running: false, results: [], total: 0, checked: 0 });
        return;
      }

      const urls = data
        .map((d) => (d as { hero_image_url: string | null }).hero_image_url)
        .filter((u): u is string => !!u);

      setImageCheck({ running: true, results: [], total: urls.length, checked: 0 });

      const results: ImageCheckResult[] = [];
      for (const url of urls) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
        results.push({ url, status: ok ? "ok" : "error" });
        setImageCheck((prev) => ({ ...prev, checked: prev.checked + 1, results: [...results] }));
      }

      setImageCheck({ running: false, results, total: urls.length, checked: urls.length });
    } catch {
      setImageCheck((prev) => ({ ...prev, running: false }));
    }
  };

  const imageOk = imageCheck.results.filter((r) => r.status === "ok").length;
  const imageErr = imageCheck.results.filter((r) => r.status === "error").length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-foreground mb-2">
        Dashboard de Diagnóstico
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Verifica el estado de las conexiones principales del sistema.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variables de Entorno */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Variables de Entorno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {envChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {check.name}
                </span>
                {check.value ? (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium shrink-0">
                    <CheckCircle className="h-4 w-4" />
                    Definida
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium shrink-0">
                    <XCircle className="h-4 w-4" />
                    Faltante
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conexión a Supabase */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Conexión a Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge
              status={supabaseCheck.status}
              okLabel="Conexión Exitosa"
              errorLabel="Error de conexión"
            />
            {supabaseCheck.status === "error" && supabaseCheck.message && (
              <p className="text-xs text-red-500 font-mono bg-red-50 rounded p-2 break-all">
                {supabaseCheck.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Google Analytics */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Google Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge
              status={gtagCheck.status}
              okLabel="Inyectado correctamente"
              errorLabel="Falta inicializar"
            />
          </CardContent>
        </Card>

        {/* Prueba de Ventas */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Prueba de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Envía un correo de prueba via la Edge Function{" "}
              <code className="font-mono bg-muted px-1 rounded">send-quiz-email</code>.
            </p>
            <Button
              size="sm"
              onClick={handleSendTestEmail}
              disabled={testEmailStatus === "sending"}
              className="w-full"
            >
              {testEmailStatus === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Correo de Prueba
                </>
              )}
            </Button>
            {testEmailStatus === "ok" && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                ¡Correo enviado con éxito!
              </span>
            )}
            {testEmailStatus === "error" && (
              <div>
                <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                  <XCircle className="h-4 w-4" />
                  Error al enviar
                </span>
                {testEmailError && (
                  <p className="text-xs text-red-500 font-mono bg-red-50 rounded p-2 break-all mt-1">
                    {testEmailError}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verificador de Imágenes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              Verificador de Imágenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Verifica que las imágenes principales de los destinos carguen correctamente.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckImages}
              disabled={imageCheck.running}
              className="w-full"
            >
              {imageCheck.running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando… ({imageCheck.checked}/{imageCheck.total})
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Verificar Imágenes
                </>
              )}
            </Button>
            {imageCheck.results.length > 0 && !imageCheck.running && (
              <div className="space-y-1">
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {imageOk} OK
                  </span>
                  {imageErr > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3.5 w-3.5" />
                      {imageErr} Error
                    </span>
                  )}
                </div>
                {imageCheck.results
                  .filter((r) => r.status === "error")
                  .map((r) => (
                    <p key={r.url} className="text-xs text-red-500 font-mono bg-red-50 rounded p-1.5 break-all">
                      {r.url}
                    </p>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security note */}
      <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Nota:</span> RESEND_API_KEY no es
          visible aquí por diseño de seguridad de Vite, ya que no lleva el
          prefijo <code className="font-mono bg-amber-100 px-1 rounded">VITE_</code>.
        </p>
      </div>
    </div>
  );
};

export default SystemAudit;
