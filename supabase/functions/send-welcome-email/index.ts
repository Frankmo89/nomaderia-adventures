import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL =
  Deno.env.get("VITE_SITE_URL") ||
  Deno.env.get("SITE_URL") ||
  "https://nomaderia.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Masks email for safe logging: user@example.com → u***@example.com */
const maskEmail = (raw: string): string => {
  const [user, domain] = raw.split("@");
  if (!domain) return "***";
  return `${user[0] ?? ""}***@${domain}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido en el cuerpo de la petición" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "El campo email es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido/a a la comunidad Nomaderia!</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAFA;font-family:'Inter',Arial,sans-serif;color:#1C1917;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0 24px;">
      <h1 style="font-family:'Georgia',serif;font-size:30px;color:#1C1917;margin:0;">
        🏔️ Nomaderia
      </h1>
      <p style="color:#6B7280;font-size:14px;margin-top:6px;">Tu Primera Aventura Te Está Esperando</p>
    </div>

    <!-- Welcome message -->
    <div style="padding:0 0 24px;">
      <h2 style="font-family:'Georgia',serif;font-size:24px;color:#1C1917;margin:0 0 12px;">
        ¡Bienvenido/a a la comunidad! 🎉
      </h2>
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Ya eres parte de nuestra comunidad de aventureros. Cada semana te enviaremos
        destinos increíbles, tips para principiantes y ofertas de equipo especiales.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0;">
        Sin spam, lo prometemos. Solo aventuras 🌄
      </p>
    </div>

    <!-- What to expect -->
    <div style="background:linear-gradient(135deg,#D97706 0%,#166534 100%);border-radius:16px;padding:28px;margin:20px 0;text-align:center;">
      <h3 style="font-family:'Georgia',serif;font-size:20px;color:#FFFFFF;margin:0 0 16px;">
        ¿Qué recibirás cada semana?
      </h3>
      <table style="width:100%;text-align:left;">
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.9);font-size:14px;">🗺️ Destinos secretos y guías detalladas</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.9);font-size:14px;">💡 Tips prácticos para principiantes</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.9);font-size:14px;">🎒 Ofertas en equipo outdoor esencial</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.9);font-size:14px;">📋 Itinerarios y presupuestos detallados</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Mientras tanto, empieza a explorar:
      </p>
      <a href="${SITE_URL}/destinos"
         style="display:inline-block;background-color:#D97706;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;margin-bottom:12px;">
        Ver Destinos →
      </a>
      <br>
      <a href="${SITE_URL}/calculadora"
         style="display:inline-block;border:1px solid #D97706;color:#D97706;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px;">
        Calcular mi Presupuesto
      </a>
    </div>

    <!-- Take the quiz -->
    <div style="background-color:#F3F4F6;border-radius:12px;padding:24px;margin:20px 0;border-left:4px solid #D97706;">
      <h3 style="font-family:'Georgia',serif;font-size:18px;color:#1C1917;margin:0 0 10px;">
        ¿Aún no sabes a dónde ir? 🤔
      </h3>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Responde nuestro quiz de 2 minutos y te recomendaremos el destino perfecto
        para tu nivel de experiencia y presupuesto.
      </p>
      <a href="${SITE_URL}/#quiz"
         style="display:inline-block;background-color:#166534;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Hacer el Quiz →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid #E5E7EB;margin-top:10px;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        © 2026 Nomaderia Adventures ·
        <a href="${SITE_URL}/privacidad" style="color:#9CA3AF;text-decoration:underline;">Privacidad</a>
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin-top:6px;">
        Recibiste este email porque te suscribiste en nomaderia.com
      </p>
    </div>

  </div>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Nomaderia Adventures <hola@nomaderia.com>",
        to: [email],
        subject: "🏔️ ¡Bienvenido/a a la comunidad Nomaderia!",
        html: htmlEmail,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error("[send-welcome-email] FAIL — email no enviado", {
        to: maskEmail(email),
        status: resendResponse.status,
        body: resendData,
      });
      throw new Error(
        typeof resendData?.message === "string"
          ? resendData.message
          : `Resend error ${resendResponse.status}`
      );
    }

    console.log("[send-welcome-email] OK — correo de bienvenida enviado", {
      to: maskEmail(email),
      messageId: resendData.id,
    });

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[send-welcome-email] ERROR — excepción no controlada:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
