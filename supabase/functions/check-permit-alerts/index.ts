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

function buildEmailHtml(params: {
  park: string;
  permitName: string;
  opensAt: string;
  howToApplyUrl: string | null;
}): string {
  const safePark = escapeHtml(params.park);
  const safePermitName = escapeHtml(params.permitName);
  const formattedDate = escapeHtml(formatOpenDate(params.opensAt));
  const safeApplyUrl = params.howToApplyUrl ? escapeHtml(params.howToApplyUrl) : null;

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
      Hola, te escribimos de Nomaderia para avisarte que la ventana del permiso
      <strong>${safePermitName}</strong> en <strong>${safePark}</strong> abre pronto.
    </p>

    <div style="background:#F3F4F6;border-radius:12px;padding:16px;margin:0 0 16px;">
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Apertura estimada:</strong> ${formattedDate}</p>
      ${safeApplyUrl
        ? `<p style="margin:0;font-size:14px;color:#374151;"><strong>Enlace oficial:</strong> <a href="${safeApplyUrl}" style="color:#166534;">${safeApplyUrl}</a></p>`
        : `<p style="margin:0;font-size:14px;color:#374151;"><strong>Enlace oficial:</strong> por confirmar (te recomendamos revisar recreation.gov y el sitio oficial del parque).</p>`}
    </div>

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
  permitName: string;
  opensAt: string;
  howToApplyUrl: string | null;
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
        permitName: params.permitName,
        opensAt: params.opensAt,
        howToApplyUrl: params.howToApplyUrl,
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

    let checked = 0;
    let notified = 0;

    console.log(`[check-permit-alerts] ventanas activas en rango: ${windows.length}`);

    for (const windowItem of windows) {
      const { data: alertsData, error: alertsError } = await serviceClient
        .from("permit_alerts")
        .select("id, email, park, permit_name, target_year, status")
        .eq("status", "active")
        .eq("park", windowItem.park)
        .eq("permit_name", windowItem.permit_name)
        .eq("target_year", windowItem.year);

      if (alertsError) {
        console.error("[check-permit-alerts] error leyendo alertas", {
          park: windowItem.park,
          permitName: windowItem.permit_name,
          year: windowItem.year,
          error: alertsError.message,
        });
        continue;
      }

      const alerts = (alertsData ?? []) as PermitAlertRow[];
      checked += alerts.length;

      console.log(`[check-permit-alerts] ${alerts.length} alertas activas para ${windowItem.park} / ${windowItem.permit_name} (${windowItem.year})`);

      for (const alert of alerts) {
        try {
          await sendPermitEmail({
            email: alert.email,
            park: windowItem.park,
            permitName: windowItem.permit_name,
            opensAt: windowItem.opens_at,
            howToApplyUrl: windowItem.how_to_apply_url,
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
