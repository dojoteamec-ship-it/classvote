"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { requerirAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MentorEstado, MentorRol } from "@/types/database";

// Todas pasan por requerirAdmin (UI) y por RLS con es_admin() (base).
// El admin no puede cambiarse a sí mismo el estado ni el rol, para no
// quedarse sin acceso por error.

export async function cambiarEstadoMentor(form: FormData) {
  const { supabase, mentor } = await requerirAdmin();
  const id = String(form.get("mentor_id"));
  const estado = String(form.get("estado")) as MentorEstado;
  if (id === mentor.id) return;
  await supabase.from("mentores").update({ estado }).eq("id", id);
  refresh();
}

export async function cambiarRolMentor(form: FormData) {
  const { supabase, mentor } = await requerirAdmin();
  const id = String(form.get("mentor_id"));
  const rol = String(form.get("rol")) as MentorRol;
  if (id === mentor.id) return;
  await supabase.from("mentores").update({ rol }).eq("id", id);
  refresh();
}

export async function alternarCinturon(form: FormData) {
  const { supabase } = await requerirAdmin();
  const mentorId = String(form.get("mentor_id"));
  const cinturonId = String(form.get("cinturon_id"));
  const asignar = form.get("asignar") === "1";
  if (asignar) {
    await supabase.from("mentor_cinturones").insert({ mentor_id: mentorId, cinturon_id: cinturonId });
  } else {
    await supabase
      .from("mentor_cinturones")
      .delete()
      .eq("mentor_id", mentorId)
      .eq("cinturon_id", cinturonId);
  }
  refresh();
}

// Sin letras ni números que se confundan al dictarlos (0/O, 1/l/I).
const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

export type ResultadoClave = { clave?: string; error?: string } | undefined;

// Pone una contraseña temporal (y confirma el correo) para un mentor que
// olvidó la suya. El admin se la pasa por un canal privado.
export async function restablecerContrasena(
  _: ResultadoClave,
  form: FormData,
): Promise<ResultadoClave> {
  const { supabase, mentor: yo } = await requerirAdmin();
  const id = String(form.get("mentor_id"));
  if (id === yo.id) return { error: "Cambia tu propia contraseña desde Mi cuenta." };

  const { data: mentor } = await supabase
    .from("mentores")
    .select("auth_user_id")
    .eq("id", id)
    .maybeSingle<{ auth_user_id: string | null }>();
  if (!mentor?.auth_user_id) return { error: "Este mentor no tiene cuenta de acceso." };

  const admin = createAdminClient();
  if (!admin) return { error: "No disponible en este entorno (falta la llave de servicio)." };

  const clave = Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  const { error } = await admin.auth.admin.updateUserById(mentor.auth_user_id, {
    password: clave,
    email_confirm: true,
  });
  if (error) {
    console.error("restablecerContrasena", error.code, error.message);
    return { error: "No se pudo restablecer la contraseña." };
  }
  return { clave };
}
