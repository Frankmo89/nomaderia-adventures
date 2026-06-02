import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface PermitWindowRow {
  id: string;
  park: string;
  permit_name: string;
  opens_at: string;
  how_to_apply_url: string | null;
  year: number;
}

interface PermitAlertRow {
  id: string;
  email: string;
  park: string;
  permit_name: string;
  target_year: number;
  status: "active" | "notified" | "expired";
}

interface AlertWindowSummary {
  permit_name: string;
  opens_at: string;
  how_to_apply_url: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatOpenDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "fecha por confirmar";
  }

  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function normalizeParkName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePermitName(value: string): string {
  return value.trim().toLowerCase();
}

function buildWindowListHtml(windows: AlertWindowSummary[]): string {
  return windows
    .map((windowItem) => {
      const permit = escapeHtml(windowItem.permit_name);
      const opensAt = escapeHtml(formatOpenDate(windowItem.opens_at));

      if (windowItem.how_to_apply_url) {
        const safeUrl = escapeHtml(windowItem.how_to_apply_url);
        return `<li style="margin:0 0 10px;line-height:1.6;"><strong>${permit}</strong><br/>Abre: ${opensAt}<br/>Aplicar: <a href="${safeUrl}" style="color:#166534;">${safeUrl}</a></li>`;
      }

      return `<li style="margin:0 0 10px;line-height:1.6;"><strong>${permit}</strong><br/>Abre: ${opensAt}<br/>Aplicar: revisar página oficial del parque o recreation.gov.</li>`;
    })
    .join("");
}

function buildEmailHtml(params: {
  park: string;
  targetYear: number;
  requestedPermitName: string | null;
  windows: AlertWindowSummary[];
}): string {
  const safePark = escapeHtml(params.park);
  const sortedWindows = [...params.windows].sort(
    (a, b) => new Date(a.opens_at).getTime() - new Date(b.opens_at).getTime(),
  );
  const firstWindowDate = sortedWindows[0]?.opens_at
    ? escapeHtml(formatOpenDate(sortedWindows[0].opens_at))
    : "fecha por confirmar";

  const requestedPermit = params.requestedPermitName?.trim() || null;
  const requestedMatch = requestedPermit
    ? sortedWindows.find((windowItem) => normalizePermitName(windowItem.permit_name) === normalizePermitName(requestedPermit))
    : null;

  const requestedBlock = requestedPermit
    ? requestedMatch
      ? `<div style="background:#FEF3E2;border:1px solid #F5C36B;border-radius:12px;padding:14px;margin:0 0 16px;"><p style="margin:0 0 6px;font-size:14px;"><strong>Lo que pediste:</strong> ${escapeHtml(requestedPermit)}</p><p style="margin:0;font-size:14px;color:#374151;"><strong>Abre:</strong> ${escapeHtml(formatOpenDate(requestedMatch.opens_at))}</p></div>`
      : `<div style="background:#FEF3E2;border:1px solid #F5C36B;border-radius:12px;padding:14px;margin:0 0 16px;"><p style="margin:0 0 6px;font-size:14px;"><strong>Lo que pediste:</strong> ${escapeHtml(requestedPermit)}</p><p style="margin:0;font-size:14px;color:#374151;">No encontramos ese nombre exacto en las ventanas oficiales de los próximos 7 días, pero abajo te dejamos todas las aperturas del parque.</p></div>`
    : "";

  const windowsList = buildWindowListHtml(sortedWindows);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FAFAFA;font-family:'Inter',Arial,sans-serif;color:#1C1917;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <h1 style="font-family:'Georgia',serif;font-size:28px;margin:0 0 12px;">🔔 Tu permiso abre pronto</h1>
    <p style="font-size:16px;line-height:1.7;margin:0 0 14px;">
      Hola, te escribimos de Nomaderia para avisarte que hay ventanas de permisos en
      <strong>${safePark}</strong> (${params.targetYear}) que abren en los próximos días.
    </p>

    <div style="background:#F3F4F6;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;font-size:14px;color:#374151;"><strong>Primera apertura detectada:</strong> ${firstWindowDate}</p>
    </div>

    ${requestedBlock}

    <h2 style="font-family:'Georgia',serif;font-size:20px;margin:0 0 10px;">Ventanas activas (próximos 7 días)</h2>
    <ul style="padding-left:20px;margin:0 0 16px;">
      ${windowsList}
    </ul>

    <p style="font-size:15px;line-height:1.7;margin:0 0 12px;">
      Importante: esta alerta es un recordatorio. Para participar debes aplicar tú mismo/a en el enlace oficial durante la ventana activa.
    </p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">
      Si quieres, te ayudamos a preparar estrategia, fechas y checklist para llegar listo/a.
    </p>

    <p style="font-size:13px;color:#6B7280;margin:0;">Con cariño,</p>
    <p style="font-size:13px;color:#6B7280;margin:4px 0 0;">Equipo Nomaderia · nomaderia.com</p>
  </div>
</body>
</html>`;
}

async function sendPermitEmail(params: {
  email: string;
  park: string;
  targetYear: number;
  requestedPermitName: string | null;
  windows: AlertWindowSummary[];
}): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY no configurada");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Nomaderia <hola@nomaderia.com>",
      reply_to: "nomaderia.travel@gmail.com",
      to: [params.email],
      subject: `🔔 Tu permiso de ${params.park} abre pronto`,
      html: buildEmailHtml({
        park: params.park,
        targetYear: params.targetYear,
        requestedPermitName: params.requestedPermitName,
        windows: params.windows,
      }),
    }),
  });

  const payload = await response.json().catch(() => null) as { message?: string } | null;

  if (!response.ok) {
    const message = typeof payload?.message === "string"
      ? payload.message
      : `Resend error ${response.status}`;
    throw new Error(message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método no permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!CRON_SECRET) {
      throw new Error("CRON_SECRET no configurada");
    }

    const providedSecret = req.headers.get("x-cron-secret");
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString();
    const inSevenDaysIso = inSevenDays.toISOString();

    const { data: windowsData, error: windowsError } = await serviceClient
      .from("permit_windows")
      .select("id, park, permit_name, opens_at, how_to_apply_url, year")
      .eq("is_active", true)
      .gte("opens_at", nowIso)
      .lte("opens_at", inSevenDaysIso)
      .order("opens_at", { ascending: true });

    if (windowsError) {
      throw new Error(`No se pudieron leer ventanas de permiso: ${windowsError.message}`);
    }

    const windows = (windowsData ?? []) as PermitWindowRow[];

    const windowsByParkYear = new Map<string, PermitWindowRow[]>();
    for (const windowItem of windows) {
      const key = `${normalizeParkName(windowItem.park)}::${windowItem.year}`;
      const current = windowsByParkYear.get(key) || [];
      current.push(windowItem);
      windowsByParkYear.set(key, current);
    }

    const yearsWithWindows = Array.from(new Set(windows.map((windowItem) => windowItem.year)));

    let checked = 0;
    let notified = 0;

    console.log(`[check-permit-alerts] ventanas activas en rango: ${windows.length}`);

    if (yearsWithWindows.length === 0) {
      return new Response(
        JSON.stringify({ checked, notified }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: alertsData, error: alertsError } = await serviceClient
      .from("permit_alerts")
      .select("id, email, park, permit_name, target_year, status")
      .eq("status", "active")
      .in("target_year", yearsWithWindows);

    if (alertsError) {
      throw new Error(`No se pudieron leer alertas activas: ${alertsError.message}`);
    }

    const activeAlerts = (alertsData ?? []) as PermitAlertRow[];
    const matchedAlerts = activeAlerts.filter((alert) => {
      const key = `${normalizeParkName(alert.park)}::${alert.target_year}`;
      return windowsByParkYear.has(key);
    });

    checked = matchedAlerts.length;

    console.log(`[check-permit-alerts] alertas activas que matchean por parque+año: ${checked}`);

    for (const alert of matchedAlerts) {
      const key = `${normalizeParkName(alert.park)}::${alert.target_year}`;
      const windowsForAlert = windowsByParkYear.get(key) || [];

      if (windowsForAlert.length === 0) continue;

      const summaryWindows: AlertWindowSummary[] = windowsForAlert.map((windowItem) => ({
        permit_name: windowItem.permit_name,
        opens_at: windowItem.opens_at,
        how_to_apply_url: windowItem.how_to_apply_url,
      }));

      try {
        await sendPermitEmail({
          email: alert.email,
          park: windowsForAlert[0].park,
          targetYear: alert.target_year,
          requestedPermitName: alert.permit_name?.trim() || null,
          windows: summaryWindows,
        });

        const { error: updateError } = await serviceClient
          .from("permit_alerts")
          .update({ status: "notified" })
          .eq("id", alert.id)
          .eq("status", "active");

        if (updateError) {
          console.error("[check-permit-alerts] correo enviado pero no se pudo actualizar estado", {
            alertId: alert.id,
            error: updateError.message,
          });
          continue;
        }

        notified += 1;

        console.log("[check-permit-alerts] notificación enviada", {
          alertId: alert.id,
          park: alert.park,
          permitName: alert.permit_name,
          targetYear: alert.target_year,
        });
      } catch (error) {
        console.error("[check-permit-alerts] error enviando correo", {
          alertId: alert.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(`[check-permit-alerts] completado checked=${checked} notified=${notified}`);

    return new Response(
      JSON.stringify({ checked, notified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[check-permit-alerts] error no controlado", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
