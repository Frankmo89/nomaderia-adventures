import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://nomaderia.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Nomaderia Adventures <hola@nomaderia.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }
}

function buildGearGuideEmail(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#1C1917;font-family:'Inter',Arial,sans-serif;color:#F5F0EB;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <div style="text-align:center;padding:30px 0 20px;">
      <h1 style="font-family:'Georgia',serif;font-size:28px;color:#F5F0EB;margin:0;">🏔️ Nomaderia</h1>
      <p style="color:#A8A29E;font-size:14px;margin-top:4px;">Tu Primera Aventura Te Está Esperando</p>
    </div>

    <div style="padding:20px 0;">
      <h2 style="font-family:'Georgia',serif;font-size:22px;color:#F5F0EB;margin:0 0 12px;">
        🎒 Tu kit esencial para empezar a explorar
      </h2>
      <p style="color:#D6D3D1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        ¿Ya elegiste tu destino? Ahora asegúrate de tener el equipo correcto.
        Te comparto los 5 productos que todo principiante en outdoor necesita:
      </p>
    </div>

    ${[
      {
        num: "1",
        name: "Botas Columbia Newton Ridge Plus",
        desc: "Ligeras, impermeables y con excelente tracción. Perfectas para tu primera salida.",
        price: "~$90 USD",
        url: "https://www.amazon.com/dp/B07B9J2JQ4?tag=nomaderia-20",
      },
      {
        num: "2",
        name: "Mochila Osprey Atmos AG 65",
        desc: "La mochila preferida de principiantes. Sistema anti-gravedad que distribuye el peso.",
        price: "~$270 USD",
        url: "https://www.amazon.com/dp/B014D39GKO?tag=nomaderia-20",
      },
      {
        num: "3",
        name: "Cantimplora Hydro Flask 32oz",
        desc: "Mantiene el agua fría 24 horas. Resistente, ligera y libre de BPA.",
        price: "~$50 USD",
        url: "https://www.amazon.com/dp/B07FXKR71H?tag=nomaderia-20",
      },
      {
        num: "4",
        name: "Impermeable Columbia Watertight II",
        desc: "Compacto y liviano. Se guarda en su propio bolsillo. Esencial ante cualquier lluvia.",
        price: "~$60 USD",
        url: "https://www.amazon.com/dp/B077G6BTGJ?tag=nomaderia-20",
      },
      {
        num: "5",
        name: "Bastones TrailBuddy Trekking Poles",
        desc: "Reducen el impacto en rodillas un 25%. Ajustables y plegables para el avión.",
        price: "~$40 USD",
        url: "https://www.amazon.com/dp/B07FMPGVX2?tag=nomaderia-20",
      },
    ].map((item) => `
    <a href="${item.url}" style="display:block;background-color:#292524;border-radius:10px;padding:16px;margin-bottom:10px;text-decoration:none;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <span style="background-color:#E86C3A;color:#fff;font-weight:700;font-size:13px;padding:4px 10px;border-radius:20px;white-space:nowrap;">#${item.num}</span>
        <div>
          <p style="font-family:'Georgia',serif;font-size:16px;color:#F5F0EB;margin:0 0 4px;">${item.name}</p>
          <p style="color:#A8A29E;font-size:13px;margin:0 0 6px;line-height:1.4;">${item.desc}</p>
          <span style="color:#E86C3A;font-size:13px;font-weight:600;">${item.price} →</span>
        </div>
      </div>
    </a>
    `).join("")}

    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/gear"
         style="display:inline-block;background-color:#4A7C59;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;">
        Ver la guía completa de equipo →
      </a>
    </div>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #44403C;">
      <p style="color:#78716C;font-size:11px;margin:0;">
        © 2026 Nomaderia Adventures ·
        <a href="${SITE_URL}/privacidad" style="color:#78716C;text-decoration:underline;">Privacidad</a>
      </p>
      <p style="color:#78716C;font-size:11px;margin-top:8px;">
        Recibiste este email porque te suscribiste en nomaderia.com
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildItineraryCtaEmail(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#1C1917;font-family:'Inter',Arial,sans-serif;color:#F5F0EB;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <div style="text-align:center;padding:30px 0 20px;">
      <h1 style="font-family:'Georgia',serif;font-size:28px;color:#F5F0EB;margin:0;">🏔️ Nomaderia</h1>
      <p style="color:#A8A29E;font-size:14px;margin-top:4px;">Tu Primera Aventura Te Está Esperando</p>
    </div>

    <div style="padding:20px 0;">
      <h2 style="font-family:'Georgia',serif;font-size:22px;color:#F5F0EB;margin:0 0 12px;">
        📋 ¿Listo para planear tu aventura? Te ayudamos
      </h2>
      <p style="color:#D6D3D1;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Soy Frank, agente de viajes certificado (National TAP Test, The Travel Institute).
        Diseño itinerarios personalizados para principiantes en outdoor — con plan día a día,
        presupuesto detallado, checklist de equipo y tips de seguridad.
      </p>
    </div>

    <!-- Paquetes -->
    <div style="margin:20px 0;">
      <h3 style="font-family:'Georgia',serif;font-size:18px;color:#F5F0EB;margin:0 0 16px;">Elige tu paquete:</h3>

      <div style="background-color:#292524;border-radius:10px;padding:20px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="font-family:'Georgia',serif;font-size:17px;color:#F5F0EB;margin:0 0 4px;">🌅 Weekend</p>
            <p style="color:#A8A29E;font-size:13px;margin:0;">1–3 días · Escapada rápida</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:18px;font-weight:700;color:#E86C3A;margin:0;">$299 MXN</p>
            <p style="color:#A8A29E;font-size:12px;margin:0;">$19 USD</p>
          </div>
        </div>
      </div>

      <div style="background-color:#292524;border-radius:10px;padding:20px;margin-bottom:10px;border:1px solid #E86C3A;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="font-family:'Georgia',serif;font-size:17px;color:#F5F0EB;margin:0 0 4px;">🏕️ Aventura <span style="background:#E86C3A;color:#fff;font-size:11px;padding:2px 8px;border-radius:12px;vertical-align:middle;">Popular</span></p>
            <p style="color:#A8A29E;font-size:13px;margin:0;">4–7 días · La más solicitada</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:18px;font-weight:700;color:#E86C3A;margin:0;">$549 MXN</p>
            <p style="color:#A8A29E;font-size:12px;margin:0;">$35 USD</p>
          </div>
        </div>
      </div>

      <div style="background-color:#292524;border-radius:10px;padding:20px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="font-family:'Georgia',serif;font-size:17px;color:#F5F0EB;margin:0 0 4px;">🏔️ Expedición</p>
            <p style="color:#A8A29E;font-size:13px;margin:0;">8+ días · Incluye soporte WhatsApp</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:18px;font-weight:700;color:#E86C3A;margin:0;">$899 MXN</p>
            <p style="color:#A8A29E;font-size:12px;margin:0;">$59 USD</p>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${SITE_URL}/#itinerario"
         style="display:inline-block;background-color:#E86C3A;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
        Solicitar mi itinerario personalizado →
      </a>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${SITE_URL}/destinos"
         style="display:inline-block;border:1px solid #6BA3BE;color:#6BA3BE;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">
        Explorar destinos
      </a>
    </div>

    <div style="text-align:center;padding:20px 0;border-top:1px solid #44403C;">
      <p style="color:#78716C;font-size:11px;margin:0;">
        © 2026 Nomaderia Adventures ·
        <a href="${SITE_URL}/privacidad" style="color:#78716C;text-decoration:underline;">Privacidad</a>
      </p>
      <p style="color:#78716C;font-size:11px;margin-top:8px;">
        Recibiste este email porque te suscribiste en nomaderia.com
      </p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Obtener suscriptores registrados hace 3+ días
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email, created_at")
      .lte("created_at", threeDaysAgo)
      .order("created_at", { ascending: true })
      .limit(50);

    if (subError) throw subError;
    if (!subscribers?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obtener logs existentes para estos emails
    const emails = subscribers.map((s) => s.email);
    const { data: existingLogs, error: logsError } = await supabase
      .from("email_drip_log")
      .select("email, email_type")
      .in("email", emails)
      .in("email_type", ["gear_guide", "itinerary_cta"])
      .eq("status", "sent");

    if (logsError) throw logsError;
    const sentSet = new Set((existingLogs || []).map((l) => `${l.email}:${l.email_type}`));

    let processed = 0;

    for (const sub of subscribers) {
      const subDate = new Date(sub.created_at);

      // Email 2: gear_guide (3+ días)
      if (!sentSet.has(`${sub.email}:gear_guide`)) {
        let status = "sent";
        let errorMessage: string | null = null;
        try {
          await sendEmail(
            sub.email,
            "🎒 Tu kit esencial para empezar a explorar",
            buildGearGuideEmail()
          );
          processed++;
        } catch (err) {
          status = "failed";
          errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Error sending gear_guide to ${sub.email}:`, errorMessage);
        }
        await supabase.from("email_drip_log").insert({
          email: sub.email,
          email_type: "gear_guide",
          status,
          error_message: errorMessage,
        });
        await delay(200);
      }

      // Email 3: itinerary_cta (7+ días)
      if (subDate <= new Date(sevenDaysAgo) && !sentSet.has(`${sub.email}:itinerary_cta`)) {
        let status = "sent";
        let errorMessage: string | null = null;
        try {
          await sendEmail(
            sub.email,
            "📋 ¿Listo para planear tu aventura? Te ayudamos",
            buildItineraryCtaEmail()
          );
          processed++;
        } catch (err) {
          status = "failed";
          errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Error sending itinerary_cta to ${sub.email}:`, errorMessage);
        }
        await supabase.from("email_drip_log").insert({
          email: sub.email,
          email_type: "itinerary_cta",
          status,
          error_message: errorMessage,
        });
        await delay(200);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Drip email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
