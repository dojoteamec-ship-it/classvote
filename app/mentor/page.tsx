import Link from "next/link";
import { requerirMentor } from "@/lib/auth";
import { COLOR_CINTURON } from "@/lib/cinturones";
import type { Cinturon } from "@/types/database";
import { Encabezado } from "./encabezado";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default async function MentorPage() {
  const { supabase, mentor } = await requerirMentor();

  let cinturones: Cinturon[] = [];
  if (mentor.estado === "activo") {
    // El admin ve todos los cinturones activos; el mentor, solo los asignados.
    let consulta = supabase.from("cinturones").select("*").order("orden");
    if (mentor.rol !== "admin") {
      const { data: asignados } = await supabase
        .from("mentor_cinturones")
        .select("cinturon_id")
        .eq("mentor_id", mentor.id);
      consulta = consulta.in("id", (asignados ?? []).map((a) => a.cinturon_id));
    }
    cinturones = (await consulta.returns<Cinturon[]>()).data ?? [];
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Encabezado mentor={mentor} />

      {mentor.estado === "pendiente" && (
        <p className="rounded-lg border border-current/20 p-4 text-sm">
          Tu cuenta está pendiente de aprobación. Cuando el administrador la apruebe y te asigne tu
          cinturón, lo verás aquí.
        </p>
      )}
      {mentor.estado === "inactivo" && (
        <p className="rounded-lg border border-current/20 p-4 text-sm">
          Tu cuenta está desactivada. Si crees que es un error, contacta al administrador.
        </p>
      )}

      {mentor.estado === "activo" && (
        <section className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">Tus cinturones</h1>
          {cinturones.length === 0 ? (
            <p className="text-sm opacity-70">
              Todavía no tienes cinturones asignados. Pídele al administrador que te asigne uno.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cinturones.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/mentor/${c.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-current/20 p-3 hover:bg-current/5"
                  >
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${COLOR_CINTURON[c.slug] ?? ""}`}>
                      {c.nombre}
                    </span>
                    <span className="text-sm opacity-70">
                      {c.dia_semana !== null ? DIAS[c.dia_semana] : ""} {c.hora_local?.slice(0, 5)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
