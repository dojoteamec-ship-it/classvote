"use server";

import { refresh } from "next/cache";
import { requerirAdmin } from "@/lib/auth";
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
