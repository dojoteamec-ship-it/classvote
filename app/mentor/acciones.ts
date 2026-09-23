"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CicloEstado, SesionTipo } from "@/types/database";

export type EstadoFormulario =
  | { error?: string; aviso?: string; valores?: Record<string, string> }
  | undefined;

export async function entrar(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("entrar", error.code, error.message);
    const mensaje =
      error.code === "email_not_confirmed"
        ? "Tu correo todavía no está confirmado. Pídele al administrador que restablezca tu contraseña."
        : "Correo o contraseña incorrectos.";
    return { error: mensaje, valores: { email } };
  }
  redirect("/mentor");
}

export async function registrarse(_: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const nombre = String(form.get("nombre") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const valores = { nombre, email };
  if (nombre.length < 2) return { error: "Escribe tu nombre.", valores };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres.", valores };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });
  if (error) {
    // El código técnico ayuda a diagnosticar desde la captura o los logs.
    console.error("registrarse", error.code, error.status, error.message);
    return {
      error:
        error.code === "user_already_exists"
          ? "Ya existe una cuenta con ese correo. Inicia sesión."
          : `No se pudo crear la cuenta (${error.code ?? error.status ?? "error"}: ${error.message}).`,
      valores,
    };
  }
  // Si Supabase todavía pide confirmar el correo, no hay sesión aún.
  if (!data.session) {
    return { aviso: "Revisa tu correo para confirmar la cuenta y luego inicia sesión." };
  }
  redirect("/mentor");
}

export async function cambiarContrasena(
  _: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const password = String(form.get("password") ?? "");
  const confirmacion = String(form.get("confirmacion") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmacion) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("cambiarContrasena", error.code, error.message);
    return {
      error:
        error.code === "same_password"
          ? "La nueva contraseña debe ser distinta a la actual."
          : "No se pudo cambiar la contraseña. Intenta de nuevo.",
    };
  }
  return { aviso: "Listo, tu contraseña se cambió." };
}

export async function salir() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/mentor/entrar");
}

// Acciones del panel. RLS (puede_gestionar) decide si el mentor puede hacerlas:
// si no puede, la base no actualiza ninguna fila y se devuelve error.
type Resultado = { error?: string };

async function actualizar(
  tabla: "ciclos_semanales" | "temas",
  id: string,
  cambios: Record<string, unknown>,
): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(tabla).update(cambios).eq("id", id).select("id");
  if (error || !data?.length) return { error: "No se pudo guardar el cambio." };
  return {};
}

export async function cambiarTipoSesion(cicloId: string, tipo: SesionTipo | null) {
  return actualizar("ciclos_semanales", cicloId, { tipo_sesion: tipo });
}

export async function cambiarEstadoCiclo(cicloId: string, estado: CicloEstado) {
  return actualizar("ciclos_semanales", cicloId, {
    estado,
    cerrado_en: estado === "cerrado" ? new Date().toISOString() : null,
  });
}

export async function cambiarOculto(temaId: string, oculto: boolean) {
  return actualizar("temas", temaId, { oculto });
}
