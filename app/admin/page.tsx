import { requerirAdmin } from "@/lib/auth";
import { COLOR_CINTURON } from "@/lib/cinturones";
import type { Cinturon, Mentor, MentorCinturon } from "@/types/database";
import { Encabezado } from "../mentor/encabezado";
import { alternarCinturon, cambiarEstadoMentor, cambiarRolMentor } from "./acciones";

const ETIQUETA_ESTADO = { pendiente: "Pendiente", activo: "Activo", inactivo: "Desactivado" };
const BOTON = "rounded-md border border-current/20 px-2 py-1 text-xs hover:bg-current/5";

export default async function AdminPage() {
  const { supabase, mentor: yo } = await requerirAdmin();

  const [{ data: mentores }, { data: cinturones }, { data: asignaciones }] = await Promise.all([
    supabase.from("mentores").select("*").order("creado_en", { ascending: false }).returns<Mentor[]>(),
    supabase.from("cinturones").select("*").order("orden").returns<Cinturon[]>(),
    supabase.from("mentor_cinturones").select("*").returns<MentorCinturon[]>(),
  ]);

  const asignados = new Set((asignaciones ?? []).map((a) => `${a.mentor_id}:${a.cinturon_id}`));
  const orden = { pendiente: 0, activo: 1, inactivo: 2 };
  const lista = [...(mentores ?? [])].sort((a, b) => orden[a.estado] - orden[b.estado]);
  const pendientes = lista.filter((m) => m.estado === "pendiente").length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Encabezado mentor={yo} />
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Mentores</h1>
        <span className="text-sm opacity-70">
          {pendientes > 0 ? `${pendientes} pendiente(s) de aprobación` : "Sin pendientes"}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {lista.map((m) => {
          const esYo = m.id === yo.id;
          return (
            <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-current/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {m.nombre} {esYo && <span className="text-xs opacity-60">(tú)</span>}
                  </span>
                  <span className="text-xs opacity-60">{m.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      m.estado === "activo"
                        ? "bg-green-600 text-white"
                        : m.estado === "pendiente"
                          ? "bg-yellow-400 text-black"
                          : "bg-current/10"
                    }`}
                  >
                    {ETIQUETA_ESTADO[m.estado]}
                  </span>
                  {m.rol === "admin" && (
                    <span className="rounded-full bg-foreground px-2 py-0.5 font-medium text-background">Admin</span>
                  )}
                </div>
              </div>

              {!esYo && (
                <div className="flex flex-wrap gap-2">
                  {m.estado !== "activo" && (
                    <form action={cambiarEstadoMentor}>
                      <input type="hidden" name="mentor_id" value={m.id} />
                      <input type="hidden" name="estado" value="activo" />
                      <button className={BOTON}>{m.estado === "pendiente" ? "Aprobar" : "Reactivar"}</button>
                    </form>
                  )}
                  {m.estado !== "inactivo" && (
                    <form action={cambiarEstadoMentor}>
                      <input type="hidden" name="mentor_id" value={m.id} />
                      <input type="hidden" name="estado" value="inactivo" />
                      <button className={BOTON}>{m.estado === "pendiente" ? "Rechazar" : "Desactivar"}</button>
                    </form>
                  )}
                  {m.estado === "activo" && (
                    <form action={cambiarRolMentor}>
                      <input type="hidden" name="mentor_id" value={m.id} />
                      <input type="hidden" name="rol" value={m.rol === "admin" ? "mentor" : "admin"} />
                      <button className={BOTON}>{m.rol === "admin" ? "Quitar admin" : "Hacer admin"}</button>
                    </form>
                  )}
                </div>
              )}

              {m.estado === "activo" && m.rol !== "admin" && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-60">Cinturones asignados (clic para asignar o quitar)</span>
                  <div className="flex flex-wrap gap-2">
                    {(cinturones ?? []).map((c) => {
                      const tiene = asignados.has(`${m.id}:${c.id}`);
                      return (
                        <form key={c.id} action={alternarCinturon}>
                          <input type="hidden" name="mentor_id" value={m.id} />
                          <input type="hidden" name="cinturon_id" value={c.id} />
                          <input type="hidden" name="asignar" value={tiene ? "0" : "1"} />
                          <button
                            aria-pressed={tiene}
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              tiene ? COLOR_CINTURON[c.slug] : "border border-current/20 opacity-60"
                            }`}
                          >
                            {tiene ? "✓ " : ""}
                            {c.nombre.split(" — ")[0]}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
