import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Cliente con service role: salta RLS. Solo para operaciones de Auth que el
// admin no puede hacer con su sesión (p. ej. restablecer contraseñas), y
// siempre después de requerirAdmin(). La llave solo existe en Production.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
