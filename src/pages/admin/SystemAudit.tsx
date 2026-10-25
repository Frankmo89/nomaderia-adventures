import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Image,
  Loader2,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { isNpsGovUrl, isOurStorageUrl } from "@shared/mirror-park-images";

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

type ImageRowStatus = "ok" | "amber" | "error";

interface ImageCheckResult {
  parkTitle: string;
  parkSlug: string;
  url: string;
  field: "hero" | "gallery";
  status: ImageRowStatus;
  inOurStorage: boolean;
}

interface DestinationRow {
  title: string;
  slug: string;
  hero_image_url: string | null;
  gallery_images: string[] | null;
}

interface ImageCheckState {
  running: boolean;
  results: ImageCheckResult[];
  total: number;
  checked: number;
  fetchError: string;
  parks: DestinationRow[];
}

interface MirrorSkipped {
  url: string;
  reason: string;
}

interface MirrorParkResult {
  slug: string;
  hero: "replaced" | "kept" | "missing";
  gallery: number;
  skipped: MirrorSkipped[];
  needs_manual_photo?: boolean;
  error?: string;
}

type MirrorPhase = "idle" | "dry_running" | "awaiting_confirm" | "running" | "done" | "error";

interface MirrorRunState {
  phase: MirrorPhase;
  currentSlug: string;
  done: number;
  total: number;
  results: MirrorParkResult[];
  error: string;
  dryRun: boolean;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

async function probeImageUrl(url: string, timeoutMs = 5000): Promise<boolean> {
  const imgPromise = new Promise<boolean>((resolve) => {
    const img = new window.Image();
    let settled = false;
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    img.onload = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    };
    img.src = url;
  });
  const timeoutPromise = new Promise<boolean>((resolve) => {
    window.setTimeout(() => resolve(false), timeoutMs);
  });
  return Promise.race([imgPromise, timeoutPromise]);
}

function classifyUrl(loads: boolean, inOurStorage: boolean): ImageRowStatus {
  if (!loads) return "error";
  if (!inOurStorage) return "amber";
  return "ok";
}

async function invokeMirrorParkImages(
  slug: string,
  dryRun: boolean,
): Promise<MirrorParkResult> {
  const { data, error } = await supabase.functions.invoke("mirror-park-images", {
    body: { slug, dry_run: dryRun },
  });
  if (error) {
    return {
      slug,
      hero: "missing",
      gallery: 0,
      skipped: [],
      error: error.message,
      needs_manual_photo: true,
    };
  }
  const payload = (data ?? {}) as MirrorParkResult;
  return {
    slug: payload.slug ?? slug,
    hero: payload.hero ?? "missing",
    gallery: payload.gallery ?? 0,
    skipped: Array.isArray(payload.skipped) ? payload.skipped : [],
    needs_manual_photo: Boolean(payload.needs_manual_photo),
    error: typeof (payload as { error?: string }).error === "string"
      ? (payload as { error?: string }).error
      : undefined,
  };
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

  const [testEmailStatus, setTestEmailStatus] = useState<TestEmailStatus>("idle");
  const [testEmailError, setTestEmailError] = useState("");

  const [imageCheck, setImageCheck] = useState<ImageCheckState>({
    running: false,
    results: [],
    total: 0,
    checked: 0,
    fetchError: "",
    parks: [],
  });

  const [mirrorRun, setMirrorRun] = useState<MirrorRunState>({
    phase: "idle",
    currentSlug: "",
    done: 0,
    total: 0,
    results: [],
    error: "",
    dryRun: true,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRealSlugs, setPendingRealSlugs] = useState<string[]>([]);
  const [singleParkBusy, setSingleParkBusy] = useState<string | null>(null);

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
          email: "nomaderia.travel@gmail.com",
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
    setImageCheck({
      running: true,
      results: [],
      total: 0,
      checked: 0,
      fetchError: "",
      parks: [],
    });
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("title, slug, hero_image_url, gallery_images")
        .order("title", { ascending: true });

      if (error || !data) {
        setImageCheck({
          running: false,
          results: [],
          total: 0,
          checked: 0,
          fetchError: error?.message ?? "No se pudo obtener los datos de Supabase",
          parks: [],
        });
        return;
      }

      const parks = data as DestinationRow[];
      const work: Array<{
        parkTitle: string;
        parkSlug: string;
        url: string;
        field: "hero" | "gallery";
      }> = [];

      for (const park of parks) {
        if (park.hero_image_url) {
          work.push({
            parkTitle: park.title,
            parkSlug: park.slug,
            url: park.hero_image_url,
            field: "hero",
          });
        }
        for (const g of park.gallery_images ?? []) {
          if (g) {
            work.push({
              parkTitle: park.title,
              parkSlug: park.slug,
              url: g,
              field: "gallery",
            });
          }
        }
      }

      setImageCheck({
        running: true,
        results: [],
        total: work.length,
        checked: 0,
        fetchError: "",
        parks,
      });

      const results: ImageCheckResult[] = [];
      for (const item of work) {
        const loads = await probeImageUrl(item.url);
        const inOurStorage = isOurStorageUrl(item.url, SUPABASE_URL);
        results.push({
          ...item,
          status: classifyUrl(loads, inOurStorage),
          inOurStorage,
        });
        setImageCheck((prev) => ({
          ...prev,
          checked: prev.checked + 1,
          results: [...results],
        }));
      }

      setImageCheck({
        running: false,
        results,
        total: work.length,
        checked: work.length,
        fetchError: "",
        parks,
      });
    } catch {
      setImageCheck((prev) => ({
        ...prev,
        running: false,
        fetchError: "Error inesperado al verificar imágenes",
      }));
    }
  };

  const runMirrorForSlugs = async (slugs: string[], dryRun: boolean) => {
    const unique = Array.from(new Set(slugs.filter(Boolean)));
    if (unique.length === 0) {
      setMirrorRun({
        phase: "error",
        currentSlug: "",
        done: 0,
        total: 0,
        results: [],
        error: "No hay parques para copiar. Ejecuta primero «Verificar Imágenes».",
        dryRun,
      });
      return;
    }

    setMirrorRun({
      phase: dryRun ? "dry_running" : "running",
      currentSlug: "",
      done: 0,
      total: unique.length,
      results: [],
      error: "",
      dryRun,
    });

    const results: MirrorParkResult[] = [];
    for (const slug of unique) {
      setMirrorRun((prev) => ({ ...prev, currentSlug: slug }));
      const result = await invokeMirrorParkImages(slug, dryRun);
      results.push(result);
      setMirrorRun((prev) => ({
        ...prev,
        done: prev.done + 1,
        results: [...results],
      }));
    }

    setMirrorRun({
      phase: dryRun ? "awaiting_confirm" : "done",
      currentSlug: "",
      done: unique.length,
      total: unique.length,
      results,
      error: "",
      dryRun,
    });

    if (dryRun) {
      setPendingRealSlugs(unique);
      setConfirmOpen(true);
    }
  };

  const handleCopyAllPhotos = async () => {
    // Only parks that still depend on nps.gov (amber) or have dead URLs (red).
    // Never loop all 63 — Kings Canyon / Redwood (our Storage) must be skipped.
    let slugs = Array.from(
      new Set(
        imageCheck.results
          .filter((r) => r.status === "amber" || r.status === "error")
          .map((r) => r.parkSlug),
      ),
    );

    if (slugs.length === 0 && imageCheck.results.length === 0) {
      // No check yet — probe URLs first to discover which parks need mirroring.
      const { data, error } = await supabase
        .from("destinations")
        .select("title, slug, hero_image_url, gallery_images")
        .order("title", { ascending: true });
      if (error || !data) {
        setMirrorRun({
          phase: "error",
          currentSlug: "",
          done: 0,
          total: 0,
          results: [],
          error: error?.message ?? "No se pudieron cargar los destinos",
          dryRun: true,
        });
        return;
      }
      const parks = data as DestinationRow[];
      const need: string[] = [];
      for (const park of parks) {
        const urls = [
          park.hero_image_url,
          ...(park.gallery_images ?? []),
        ].filter((u): u is string => !!u);
        const hasNpsOrUnknown = urls.some(
          (u) => isNpsGovUrl(u) || !isOurStorageUrl(u, SUPABASE_URL),
        );
        if (hasNpsOrUnknown) need.push(park.slug);
      }
      setImageCheck((prev) => ({ ...prev, parks }));
      slugs = need;
    }

    if (slugs.length === 0) {
      setMirrorRun({
        phase: "error",
        currentSlug: "",
        done: 0,
        total: 0,
        results: [],
        error:
          "Ningún parque necesita copia: no hay URLs de nps.gov (ámbar/rojo). Ejecuta «Verificar Imágenes» si aún no lo hiciste.",
        dryRun: true,
      });
      return;
    }
    await runMirrorForSlugs(slugs, true);
  };

  const handleConfirmRealRun = async () => {
    setConfirmOpen(false);
    await runMirrorForSlugs(pendingRealSlugs, false);
  };

  const handleMirrorOnePark = async (slug: string) => {
    setSingleParkBusy(slug);
    try {
      const dry = await invokeMirrorParkImages(slug, true);
      setMirrorRun({
        phase: "awaiting_confirm",
        currentSlug: slug,
        done: 1,
        total: 1,
        results: [dry],
        error: "",
        dryRun: true,
      });
      setPendingRealSlugs([slug]);
      setConfirmOpen(true);
    } finally {
      setSingleParkBusy(null);
    }
  };

  const imageOk = imageCheck.results.filter((r) => r.status === "ok").length;
  const imageAmber = imageCheck.results.filter((r) => r.status === "amber").length;
  const imageErr = imageCheck.results.filter((r) => r.status === "error").length;

  const problemRows = useMemo(
    () => imageCheck.results.filter((r) => r.status === "amber" || r.status === "error"),
    [imageCheck.results],
  );

  const mirrorBusy =
    mirrorRun.phase === "dry_running" ||
    mirrorRun.phase === "running" ||
    singleParkBusy !== null;

  const heroLabel = (hero: MirrorParkResult["hero"]) => {
    if (hero === "replaced") return "reemplazada";
    if (hero === "kept") return "conservada";
    return "faltante";
  };

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

        {/* Verificador de Imágenes — full width on large screens */}
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              Verificador de Imágenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Revisa <code className="font-mono bg-muted px-1 rounded">hero_image_url</code> y{" "}
              <code className="font-mono bg-muted px-1 rounded">gallery_images</code> de cada parque.
              Verde = en nuestro Storage (cualquier bucket). Ámbar = depende de nps.gov. Rojo = no carga.
              «Copiar fotos a Nomaderia» solo corre parques ámbar/rojo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCheckImages}
                disabled={imageCheck.running || mirrorBusy}
                className="w-full sm:w-auto"
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
              <Button
                size="sm"
                onClick={handleCopyAllPhotos}
                disabled={imageCheck.running || mirrorBusy}
                className="w-full sm:w-auto"
              >
                {mirrorRun.phase === "dry_running" || mirrorRun.phase === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mirrorRun.phase === "dry_running" ? "Simulando…" : "Copiando…"}{" "}
                    ({mirrorRun.done}/{mirrorRun.total})
                    {mirrorRun.currentSlug ? ` · ${mirrorRun.currentSlug}` : ""}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar fotos a Nomaderia
                  </>
                )}
              </Button>
            </div>

            {imageCheck.fetchError && !imageCheck.running && (
              <div>
                <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                  <XCircle className="h-4 w-4" />
                  Error al obtener datos
                </span>
                <p className="text-xs text-red-500 font-mono bg-red-50 rounded p-2 break-all mt-1">
                  {imageCheck.fetchError}
                </p>
              </div>
            )}

            {imageCheck.results.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {imageOk} OK (Storage)
                  </span>
                  {imageAmber > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {imageAmber} depende de nps.gov
                    </span>
                  )}
                  {imageErr > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3.5 w-3.5" />
                      {imageErr} muertas
                    </span>
                  )}
                </div>

                {problemRows.length > 0 && (
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {problemRows.map((r) => (
                      <li
                        key={`${r.parkSlug}-${r.field}-${r.url}`}
                        className={`rounded-md p-2.5 text-xs space-y-1.5 ${
                          r.status === "error"
                            ? "bg-red-50 border border-red-100"
                            : "bg-amber-50 border border-amber-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`font-medium ${
                                r.status === "error" ? "text-red-800" : "text-amber-800"
                              }`}
                            >
                              {r.parkTitle}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {r.field === "hero" ? "hero" : "galería"}
                              </span>
                            </p>
                            {r.status === "amber" && (
                              <p className="text-amber-700 mt-0.5">depende de nps.gov</p>
                            )}
                            {r.status === "error" && (
                              <p className="text-red-700 mt-0.5">no carga</p>
                            )}
                            <p className="font-mono break-all text-[11px] text-muted-foreground mt-1">
                              {r.url}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0 h-8 text-xs"
                            disabled={mirrorBusy}
                            onClick={() => handleMirrorOnePark(r.parkSlug)}
                          >
                            {singleParkBusy === r.parkSlug ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Copiar"
                            )}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {mirrorRun.results.length > 0 && (
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {mirrorRun.dryRun && mirrorRun.phase !== "done"
                    ? "Informe de simulación (dry run)"
                    : "Informe de copia"}
                </p>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                  {mirrorRun.results.map((r) => (
                    <li key={`${r.slug}-${r.hero}-${r.gallery}`} className="text-xs">
                      <span className="font-mono font-medium">{r.slug}</span>
                      {": "}
                      hero {heroLabel(r.hero)}, galería {r.gallery}
                      {r.needs_manual_photo ? " · necesita foto manual" : ""}
                      {r.error ? (
                        <span className="text-red-600"> · error: {r.error}</span>
                      ) : null}
                      {r.skipped.length > 0 ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · omitidas {r.skipped.length}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {mirrorRun.phase === "error" && mirrorRun.error && (
                  <p className="text-xs text-red-600">{mirrorRun.error}</p>
                )}
                {mirrorRun.phase === "done" && (
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Copia real terminada. Revisa /destinos en el iPhone.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Nota:</span> RESEND_API_KEY no es
          visible aquí por diseño de seguridad de Vite, ya que no lleva el
          prefijo <code className="font-mono bg-amber-100 px-1 rounded">VITE_</code>.
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Ejecutar la copia real?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  La simulación terminó para{" "}
                  <strong>{pendingRealSlugs.length}</strong> parque
                  {pendingRealSlugs.length === 1 ? "" : "s"}. Se subirán fotos
                  válidas a nuestro Storage y se actualizarán solo las URLs de
                  nps.gov (nunca las fotos ya en Nomaderia).
                </p>
                {mirrorRun.results.some((r) => r.needs_manual_photo || r.hero === "missing") && (
                  <p className="text-amber-700">
                    Algunos parques quedaron sin foto usable — habrá que
                    subirlas a mano después.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRealRun}>
              Sí, copiar fotos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SystemAudit;
