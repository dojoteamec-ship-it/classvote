import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Mentor } from "@/types/database";

// Único punto donde se resuelve quién es el usuario. Los permisos finos viven
// en la base (es_admin / puede_gestionar + RLS); esto solo decide qué mostrar.
export async function obtenerSesion() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { supabase, mentor: null };

  const { data: mentor } = await supabase
    .from("mentores")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle<Mentor>();
  return { supabase, mentor };
}

export async function requerirMentor() {
  const sesion = await obtenerSesion();
  if (!sesion.mentor) redirect("/mentor/entrar");
  return { supabase: sesion.supabase, mentor: sesion.mentor };
}

export async function requerirMentorActivo() {
  const sesion = await requerirMentor();
  if (sesion.mentor.estado !== "activo") redirect("/mentor");
  return sesion;
}

export async function requerirAdmin() {
  const sesion = await requerirMentorActivo();
  if (sesion.mentor.rol !== "admin") redirect("/mentor");
  return sesion;
}
