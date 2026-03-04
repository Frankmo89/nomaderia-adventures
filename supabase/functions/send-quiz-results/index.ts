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

interface QuizResultsRequest {
  email: string;
  nombre?: string;
  destino: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { email, nombre, destino }: QuizResultsRequest = await req.json();

    if (!email || !destino) {
      return new Response(
        JSON.stringify({ error: "email y destino son requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const greeting = nombre ? `¡Hola, ${nombre}!` : "¡Hola, aventurero/a!";

    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu destino ideal — Nomaderia</title>
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

    <!-- Greeting -->
    <div style="padding:0 0 20px;">
      <h2 style="font-family:'Georgia',serif;font-size:24px;color:#1C1917;margin:0 0 12px;">
        ${greeting} 🎉
      </h2>
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0;">
        Completaste el quiz de Nomaderia y tu espíritu nómada habló.
        Los resultados están listos — ¡y son muy buenos!
      </p>
    </div>

    <!-- Destination highlight -->
    <div style="background:linear-gradient(135deg,#D97706 0%,#166534 100%);border-radius:16px;padding:32px;margin:20px 0;text-align:center;">
      <p style="color:rgba(255,255,255,0.85);font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">
        Tu destino ideal es
      </p>
      <h3 style="font-family:'Georgia',serif;font-size:32px;color:#FFFFFF;margin:0 0 16px;line-height:1.2;">
        ${destino}
      </h3>
      <p style="color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;margin:0 0 24px;">
        Prepárate para la aventura. Hemos encontrado el lugar perfecto
        para que des tus primeros pasos en el mundo outdoor. 🌄
      </p>
      <a href="${SITE_URL}/destinos"
         style="display:inline-block;background-color:#FFFFFF;color:#D97706;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;">
        Ver mi guía completa →
      </a>
    </div>

    <!-- What's next -->
    <div style="padding:24px 0;">
      <h3 style="font-family:'Georgia',serif;font-size:19px;color:#1C1917;margin:0 0 16px;">
        ¿Qué sigue?
      </h3>
      <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
        <tr>
          <td style="background-color:#F3F4F6;border-radius:10px;padding:16px;vertical-align:top;width:48%;">
            <p style="margin:0 0 6px;font-size:22px;">🗺️</p>
            <p style="font-weight:600;font-size:14px;color:#1C1917;margin:0 0 4px;">Explora el destino</p>
            <p style="color:#6B7280;font-size:13px;margin:0;line-height:1.5;">
              Consulta la guía completa, itinerario y tips de seguridad.
            </p>
          </td>
          <td style="width:4%;"></td>
          <td style="background-color:#F3F4F6;border-radius:10px;padding:16px;vertical-align:top;width:48%;">
            <p style="margin:0 0 6px;font-size:22px;">💰</p>
            <p style="font-weight:600;font-size:14px;color:#1C1917;margin:0 0 4px;">Calcula tu presupuesto</p>
            <p style="color:#6B7280;font-size:13px;margin:0;line-height:1.5;">
              Usa nuestra calculadora para estimar costos al centavo.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA: Itinerario Personalizado -->
    <div style="background-color:#F3F4F6;border-radius:12px;padding:28px;margin:20px 0;text-align:center;border-left:4px solid #D97706;">
      <h3 style="font-family:'Georgia',serif;font-size:18px;color:#1C1917;margin:0 0 10px;">
        ¿Quieres que planifiquemos todo por ti?
      </h3>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 18px;">
        Itinerarios personalizados con plan día a día, presupuesto detallado,
        checklist de equipo y tips de seguridad. Desde $299 MXN / $19 USD.
      </p>
      <a href="${SITE_URL}/calculadora"
         style="display:inline-block;background-color:#D97706;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        Calcular mi presupuesto →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid #E5E7EB;margin-top:10px;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        © 2026 Nomaderia Adventures ·
        <a href="${SITE_URL}/privacidad" style="color:#9CA3AF;text-decoration:underline;">Privacidad</a>
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin-top:6px;">
        Recibiste este email porque completaste el quiz en nomaderia.com
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
        subject: `🏔️ Tu destino ideal: ${destino} — Nomaderia`,
        html: htmlEmail,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", {
        status: resendResponse.status,
        body: resendData,
      });
      throw new Error(
        typeof resendData?.message === "string"
          ? resendData.message
          : `Resend error ${resendResponse.status}`
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("send-quiz-results error:", error);
    return new Response(
      JSON.stringify({ error: "Error al enviar el correo. Intenta de nuevo." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
