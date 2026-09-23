import { Obi } from "@/components/obi";
import { Rotulo } from "@/components/rotulo";
import { requerirAdmin } from "@/lib/auth";
import type { Cinturon, Mentor, MentorCinturon } from "@/types/database";
import { Contenedor } from "../mentor/contenedor";
import { alternarCinturon, cambiarEstadoMentor, cambiarRolMentor } from "./acciones";
import { BotonRestablecer } from "./boton-restablecer";

const ESTADO = {
  pendiente: { texto: "Pendiente", clase: "border-cian-400/40 bg-cian-400/10 text-cian-300" },
  activo: { texto: "Activo", clase: "border-matcha/30 bg-matcha/10 text-matcha" },
  inactivo: { texto: "Desactivado", clase: "border-white/10 bg-white/5 text-washi/50" },
};

function Cifra({ etiqueta, valor, destacar = false }: { etiqueta: string; valor: number; destacar?: boolean }) {
  return (
    <div className="tarjeta flex flex-col gap-1 px-4 py-3">
      <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-washi/40 uppercase">{etiqueta}</span>
      <span className={`font-display text-2xl font-bold ${destacar ? "texto-acento" : ""}`}>{valor}</span>
    </div>
  );
}

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
  const cuenta = (f: (m: Mentor) => boolean) => lista.filter(f).length;

  return (
    <Contenedor mentor={yo}>
      <main className="flex flex-col gap-6">
        <div className="flex animate-aparecer flex-col gap-2 [animation-delay:80ms]">
          <Rotulo kanji="管理">Administración</Rotulo>
          <h1 className="font-display text-3xl font-bold">Mentores</h1>
        </div>

        <section className="grid animate-aparecer grid-cols-3 gap-3 [animation-delay:140ms]">
          <Cifra etiqueta="Pendientes" valor={cuenta((m) => m.estado === "pendiente")} destacar />
          <Cifra etiqueta="Activos" valor={cuenta((m) => m.estado === "activo")} />
          <Cifra etiqueta="Admins" valor={cuenta((m) => m.estado === "activo" && m.rol === "admin")} />
        </section>

        <ul className="flex flex-col gap-4">
          {lista.map((m, i) => {
            const esYo = m.id === yo.id;
            const iniciales = m.nombre
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");
            return (
              <li
                key={m.id}
                className={`tarjeta flex animate-aparecer flex-col gap-4 p-5 ${
                  m.estado === "pendiente" ? "ring-1 ring-cian-400/30" : ""
                } ${m.estado === "inactivo" ? "opacity-70" : ""}`}
                style={{ animationDelay: `${200 + Math.min(i, 10) * 50}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-b from-ai-400/40 to-ai-400/10 text-sm font-semibold ring-1 ring-white/15">
                      {iniciales}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {m.nombre} {esYo && <span className="text-xs text-washi/40">(tú)</span>}
                      </span>
                      <span className="truncate text-xs text-washi/45">{m.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={`rounded-full border px-2.5 py-0.5 ${ESTADO[m.estado].clase}`}>
                      {ESTADO[m.estado].texto}
                    </span>
                    {m.rol === "admin" && (
                      <span className="rounded-full border border-shu-500/40 bg-shu-500/10 px-2.5 py-0.5 text-shu-400">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {!esYo && (
                  <div className="flex flex-wrap items-center gap-2">
                    {m.estado !== "activo" && (
                      <form action={cambiarEstadoMentor}>
                        <input type="hidden" name="mentor_id" value={m.id} />
                        <input type="hidden" name="estado" value="activo" />
                        <button
                          className={m.estado === "pendiente" ? "boton-primario px-4 py-2 text-xs" : "boton-secundario"}
                        >
                          {m.estado === "pendiente" ? "Aprobar" : "Reactivar"}
                        </button>
                      </form>
                    )}
                    {m.estado !== "inactivo" && (
                      <form action={cambiarEstadoMentor}>
                        <input type="hidden" name="mentor_id" value={m.id} />
                        <input type="hidden" name="estado" value="inactivo" />
                        <button className="boton-secundario">
                          {m.estado === "pendiente" ? "Rechazar" : "Desactivar"}
                        </button>
                      </form>
                    )}
                    {m.estado === "activo" && (
                      <form action={cambiarRolMentor}>
                        <input type="hidden" name="mentor_id" value={m.id} />
                        <input type="hidden" name="rol" value={m.rol === "admin" ? "mentor" : "admin"} />
                        <button className="boton-secundario">
                          {m.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                        </button>
                      </form>
                    )}
                    {m.estado !== "inactivo" && <BotonRestablecer mentorId={m.id} />}
                  </div>
                )}

                {m.estado === "activo" && m.rol !== "admin" && (
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                    <span className="text-xs text-washi/40">Cinturones asignados · clic para asignar o quitar</span>
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
                              title={tiene ? `Quitar ${c.nombre}` : `Asignar ${c.nombre}`}
                              className={`rounded-md transition-all duration-300 hover:-translate-y-0.5 ${
                                tiene ? "" : "opacity-30 grayscale hover:opacity-70 hover:grayscale-0"
                              }`}
                            >
                              <Obi slug={c.slug} nombre={c.nombre.split(" — ")[0]} tamano="sm" />
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
    </Contenedor>
  );
}
