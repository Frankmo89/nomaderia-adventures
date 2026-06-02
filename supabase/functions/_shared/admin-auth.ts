import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.48.0";

export type CorsHeaders = Record<string, string>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const defaultCorsHeaders: CorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export type RequireAdminResult =
  | { user: User; error?: undefined }
  | { user?: undefined; error: Response };

export async function requireAdmin(
  req: Request,
  corsHeaders: CorsHeaders = defaultCorsHeaders,
): Promise<RequireAdminResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Variables de Supabase incompletas");
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) {
    return {
      error: new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const { data: roleData, error: roleError } = await authClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });

  if (roleError) {
    throw new Error(`Error validando rol admin: ${roleError.message}`);
  }

  if (!roleData) {
    return {
      error: new Response(
        JSON.stringify({ error: "No tienes permisos para ejecutar esta acción" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  return { user: userData.user };
}
