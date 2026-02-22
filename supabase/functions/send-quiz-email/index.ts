import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://nomaderia.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Destination {
  title: string;
  slug: string;
  short_description: string | null;
  country: string;
  estimated_budget_usd: number | null;
  days_needed: string | null;
  hero_image_url: string | null;
  difficulty_level: string;
}

interface EmailRequest {
  email: string;
  destinations: Destination[];
  fitness_level: string;
  interest: string;
}

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  moderate: "Moderado",
  challenging: "Desafiante",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { email, destinations, fitness_level, interest }: EmailRequest = await req.json();

    if (!email || !destinations?.length) {
      return new Response(
        JSON.stringify({ error: "Email and destinations required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const topDest = destinations[0];
    const otherDests = destinations.slice(1);

    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#1C1917;font-family:'Inter',Arial,sans-serif;color:#F5F0EB;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="text-align:center;padding:30px 0 20px;">
      <h1 style="font-family:'Georgia',serif;font-size:28px;color:#F5F0EB;margin:0;">
        🏔️ Nomaderia
      </h1>
      <p style="color:#A8A29E;font-size:14px;margin-top:4px;">Tu Primera Aventura Te Está Esperando</p>
    </div>

    <!-- Greeting -->
    <div style="padding:20px 0;">
      <h2 style="font-family:'Georgia',serif;font-size:22px;color:#F5F0EB;margin:0 0 12px;">
        ¡Hola, aventurero/a! 🎉
      </h2>
      <p style="color:#D6D3D1;font-size:15px;line-height:1.6;margin:0;">
        Completaste el quiz de Nomaderia y encontramos el destino perfecto para ti. 
        Basado en tus preferencias, aquí está tu recomendación #1:
      </p>
    </div>

    <!-- Top Destination Card -->
    <div style="background-color:#292524;border-radius:12px;overflow:hidden;margin:20px 0;">
      ${topDest.hero_image_url ? `
      <div style="width:100%;height:200px;background-image:url('${topDest.hero_image_url}');background-size:cover;background-position:center;">
      </div>
      ` : `
      <div style="width:100%;height:200px;background:linear-gradient(135deg,#4A7C59 0%,#E86C3A 100%);">
      </div>
      `}
      <div style="padding:20px;">
        <h3 style="font-family:'Georgia',serif;font-size:24px;color:#F5F0EB;margin:0 0 8px;">
          ${topDest.title}
        </h3>
        <p style="color:#A8A29E;font-size:13px;margin:0 0 12px;">
          📍 ${topDest.country} · 
          ${topDest.days_needed ? `⏱️ ${topDest.days_needed} días · ` : ""}
          ${topDest.estimated_budget_usd ? `💰 ~$${topDest.estimated_budget_usd} USD · ` : ""}
          🏋️ ${difficultyLabel[topDest.difficulty_level] || topDest.difficulty_level}
        </p>
        <p style="color:#D6D3D1;font-size:14px;line-height:1.5;margin:0 0 16px;">
          ${topDest.short_description || "Un destino increíble que encaja perfectamente con tu perfil."}
        </p>
        <a href="${SITE_URL}/destinos/${topDest.slug}" 
           style="display:inline-block;background-color:#E86C3A;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          Ver Guía Completa →
        </a>
      </div>
    </div>

    ${otherDests.length > 0 ? `
    <!-- Other Recommendations -->
    <div style="padding:20px 0;">
      <h3 style="font-family:'Georgia',serif;font-size:18px;color:#F5F0EB;margin:0 0 12px;">
        También te podrían interesar:
      </h3>
      ${otherDests.map((d) => `
      <a href="${SITE_URL}/destinos/${d.slug}" 
         style="display:block;background-color:#292524;border-radius:8px;padding:16px;margin-bottom:8px;text-decoration:none;">
        <span style="font-family:'Georgia',serif;font-size:16px;color:#F5F0EB;">
          ${d.title}
        </span>
        <span style="display:block;color:#A8A29E;font-size:12px;margin-top:4px;">
          📍 ${d.country} ${d.estimated_budget_usd ? `· ~$${d.estimated_budget_usd} USD` : ""} · ${difficultyLabel[d.difficulty_level] || d.difficulty_level}
        </span>
      </a>
      `).join("")}
    </div>
    ` : ""}

    <!-- CTA: Itinerario Personalizado -->
    <div style="background-color:#292524;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <h3 style="font-family:'Georgia',serif;font-size:18px;color:#F5F0EB;margin:0 0 8px;">
        ¿Quieres que planifiquemos tu viaje?
      </h3>
      <p style="color:#D6D3D1;font-size:14px;line-height:1.5;margin:0 0 16px;">
        Nuestros itinerarios personalizados incluyen plan día a día, 
        presupuesto detallado, checklist de equipo y tips de seguridad.
      </p>
      <p style="color:#A8A29E;font-size:13px;margin:0 0 16px;">
        Desde $299 MXN / $19 USD
      </p>
      <a href="${SITE_URL}/calculadora" 
         style="display:inline-block;border:1px solid #E86C3A;color:#E86C3A;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">
        Calcular Mi Presupuesto
      </a>
    </div>

    <!-- Helpful Links -->
    <div style="padding:20px 0;border-top:1px solid #44403C;">
      <p style="color:#A8A29E;font-size:13px;margin:0 0 12px;">Recursos para preparar tu aventura:</p>
      <a href="${SITE_URL}/gear" style="color:#6BA3BE;font-size:13px;text-decoration:none;display:block;margin-bottom:6px;">
        🎒 Guía de Equipo Recomendado
      </a>
      <a href="${SITE_URL}/blog" style="color:#6BA3BE;font-size:13px;text-decoration:none;display:block;margin-bottom:6px;">
        📝 Blog: Tips Para Principiantes
      </a>
      <a href="${SITE_URL}/sobre-nosotros" style="color:#6BA3BE;font-size:13px;text-decoration:none;display:block;">
        ✈️ Sobre Nomaderia (Agente de Viajes Certificada)
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;border-top:1px solid #44403C;">
      <p style="color:#78716C;font-size:11px;margin:0;">
        © 2026 Nomaderia Adventures · 
        <a href="${SITE_URL}/privacidad" style="color:#78716C;text-decoration:underline;">Privacidad</a>
      </p>
      <p style="color:#78716C;font-size:11px;margin-top:8px;">
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
        subject: `🏔️ Tu destino ideal: ${topDest.title} — Nomaderia`,
        html: htmlEmail,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
