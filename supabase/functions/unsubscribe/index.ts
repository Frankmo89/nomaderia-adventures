// Edge function pública de baja del newsletter.
//
// GET  /unsubscribe?email=...&token=...  → click humano desde el footer del email
// POST /unsubscribe?email=...&token=...  → one-click de clientes de correo (RFC 8058,
//                                          header List-Unsubscribe-Post)
//
// El token es HMAC-SHA256(email, CRON_SECRET) — ver _shared/unsubscribe.ts.
// Marca newsletter_subscribers.unsubscribed_at = now() (idempotente) y devuelve
// una página mínima de confirmación en español.
//
// ⚠️ Debe desplegarse SIN verificación de JWT (el click viene de un navegador
// sin apikey): `supabase functions deploy unsubscribe --no-verify-jwt`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const SITE_URL = Deno.env.get("SITE_URL") || "https://nomaderia.com";

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · Nomaderia</title>
</head>
<body style="margin:0;padding:0;background-color:#FBFAF7;font-family:'Inter',Arial,sans-serif;color:#13211A;">
  <div style="max-width:480px;margin:0 auto;padding:64px 24px;text-align:center;">
    <h1 style="font-family:'Georgia',serif;font-size:26px;margin:0 0 8px;">🏔️ Nomaderia</h1>
    <h2 style="font-size:19px;margin:24px 0 12px;">${title}</h2>
    <p style="font-size:15px;line-height:1.6;color:#384741;margin:0 0 28px;">${message}</p>
    <a href="${SITE_URL}" style="display:inline-block;background-color:#1F6F43;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Volver a nomaderia.com</a>
  </div>
</body>
</html>`;
}

function respond(status: number, title: string, message: string): Response {
  return new Response(htmlPage(title, message), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

serve(async (req) => {
  // GET = click humano; POST = one-click RFC 8058. Ambos llevan los params en la URL.
  if (req.method !== "GET" && req.method !== "POST") {
    return respond(405, "Método no permitido", "Usa el enlace de baja que viene en el correo.");
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!CRON_SECRET) {
      throw new Error("CRON_SECRET no configurada");
    }

    const url = new URL(req.url);
    const email = url.searchParams.get("email")?.trim() ?? "";
    const token = url.searchParams.get("token")?.trim() ?? "";

    if (!email || !token || !(await verifyUnsubscribeToken(email, token, CRON_SECRET))) {
      return respond(
        400,
        "Enlace no válido",
        "Este enlace de baja no es válido o expiró. Si quieres dejar de recibir correos, escríbenos a nomaderia.travel@gmail.com y te damos de baja manualmente.",
      );
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Idempotente: re-marcar una baja ya hecha no cambia nada visible al usuario.
    const { error: updateError } = await db
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email)
      .is("unsubscribed_at", null);

    if (updateError) throw new Error(updateError.message);

    return respond(
      200,
      "Listo, ya no recibirás más correos",
      "Dimos de baja tu correo de la lista de Nomaderia. Si cambias de opinión, siempre puedes volver a suscribirte en el sitio.",
    );
  } catch (err) {
    console.error("[unsubscribe] error:", err);
    return respond(
      500,
      "Algo salió mal",
      "No pudimos procesar la baja. Intenta de nuevo más tarde o escríbenos a nomaderia.travel@gmail.com.",
    );
  }
});
