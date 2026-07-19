// Helpers de unsubscribe compartidos entre send-drip-emails, send-welcome-email
// y la edge function pública `unsubscribe`.
//
// El link de baja lleva un token HMAC-SHA256(email) firmado con CRON_SECRET —
// sin columna de token en DB, verificable stateless. Si CRON_SECRET rota, los
// links viejos dejan de validar (aceptable: el usuario puede pedir la baja por
// correo a nomaderia.travel@gmail.com, listado en la página de error).

const encoder = new TextEncoder();

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function buildUnsubscribeToken(email: string, secret: string): Promise<string> {
  return hmacSha256Hex(email.trim().toLowerCase(), secret);
}

export async function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string,
): Promise<boolean> {
  const expected = await buildUnsubscribeToken(email, secret);
  // Comparación en tiempo constante
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function buildUnsubscribeUrl(
  supabaseUrl: string,
  email: string,
  secret: string,
): Promise<string> {
  const token = await buildUnsubscribeToken(email, secret);
  return `${supabaseUrl}/functions/v1/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/** Headers estándar para el payload de Resend (RFC 2369 + RFC 8058 one-click). */
export function unsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
