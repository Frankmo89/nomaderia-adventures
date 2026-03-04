import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ];

  const [supabaseCheck, setSupabaseCheck] = useState<SupabaseCheck>({
    status: "pending",
    message: "",
  });

  const [gtagCheck, setGtagCheck] = useState<GtagCheck>({ status: "pending" });

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
