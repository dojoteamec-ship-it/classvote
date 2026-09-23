"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ETIQUETA_SESION } from "@/lib/temas";
import { ordenarTemas, useCicloEnVivo } from "@/lib/use-ciclo-en-vivo";
import type { CicloSemanal, SesionTipo, Tema } from "@/types/database";
import { cambiarEstadoCiclo, cambiarOculto, cambiarTipoSesion } from "../acciones";

const OPCIONES_SESION: { valor: SesionTipo | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Sin definir" },
  { valor: "qa", etiqueta: ETIQUETA_SESION.qa },
  { valor: "practica", etiqueta: ETIQUETA_SESION.practica },
];

export function PanelCiclo({
  cicloInicial,
  temasIniciales,
  titulo,
}: {
  cicloInicial: CicloSemanal;
  temasIniciales: Tema[];
  titulo: string;
}) {
  const [supabase] = useState(createClient);
  const { ciclo, setCiclo, temas, setTemas } = useCicloEnVivo(supabase, cicloInicial, temasIniciales, {
    incluirOcultos: true,
  });
  const [error, setError] = useState<string | null>(null);
  const ordenados = useMemo(() => [...temas].sort(ordenarTemas), [temas]);
  const cerrado = ciclo.estado === "cerrado";
  const totalVotos = temas.reduce((suma, t) => suma + (t.oculto ? 0 : t.votos_count), 0);

  // Cambio optimista: se aplica al instante y se revierte si la base lo rechaza.
  async function guardar(aplicar: () => void, revertir: () => void, accion: Promise<{ error?: string }>) {
    setError(null);
    aplicar();
    const { error } = await accion;
    if (error) {
      revertir();
      setError(error);
    }
  }

  function elegirTipo(tipo: SesionTipo | null) {
    const anterior = ciclo.tipo_sesion;
    guardar(
      () => setCiclo((c) => ({ ...c, tipo_sesion: tipo })),
      () => setCiclo((c) => ({ ...c, tipo_sesion: anterior })),
      cambiarTipoSesion(ciclo.id, tipo),
    );
  }

  function alternarEstado() {
    const nuevo = cerrado ? "votando" : "cerrado";
    const pregunta = cerrado
      ? "¿Reabrir la votación? Los alumnos podrán volver a proponer y votar."
      : "¿Cerrar la votación? Los alumnos ya no podrán proponer ni votar.";
    if (!window.confirm(pregunta)) return;
    const anterior = ciclo.estado;
    guardar(
      () => setCiclo((c) => ({ ...c, estado: nuevo })),
      () => setCiclo((c) => ({ ...c, estado: anterior })),
      cambiarEstadoCiclo(ciclo.id, nuevo),
    );
  }

  function alternarOculto(tema: Tema) {
    const estaba = Boolean(tema.oculto);
    const marcar = (oculto: boolean) =>
      setTemas((ts) => ts.map((t) => (t.id === tema.id ? { ...t, oculto } : t)));
    guardar(
      () => marcar(!estaba),
      () => marcar(estaba),
      cambiarOculto(tema.id, !estaba),
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-current/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold first-letter:uppercase">{titulo}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              cerrado ? "bg-current/10" : "bg-green-600 text-white"
            }`}
          >
            {cerrado ? "Votación cerrada" : "Votación abierta"}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de sesión</span>
          <div className="flex flex-wrap gap-2">
            {OPCIONES_SESION.map((op) => (
              <button
                key={op.etiqueta}
                type="button"
                onClick={() => elegirTipo(op.valor)}
                aria-pressed={ciclo.tipo_sesion === op.valor}
                className={`rounded-md border px-3 py-1 ${
                  ciclo.tipo_sesion === op.valor
                    ? "border-foreground bg-foreground text-background"
                    : "border-current/20 hover:bg-current/5"
                }`}
              >
                {op.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={alternarEstado}
          className="w-fit rounded-md border border-current/30 px-3 py-1 text-sm hover:bg-current/5"
        >
          {cerrado ? "Reabrir votación" : "Cerrar votación ahora"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Temas</h2>
          <span className="text-xs opacity-60">
            {temas.filter((t) => !t.oculto).length} temas · {totalVotos} votos · en vivo
          </span>
        </div>

        {ordenados.length === 0 ? (
          <p className="text-sm opacity-70">Los alumnos todavía no han propuesto temas.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ordenados.map((tema) => (
              <li
                key={tema.id}
                className={`flex items-center gap-3 rounded-lg border border-current/20 p-3 ${
                  tema.oculto ? "opacity-50" : ""
                }`}
              >
                <span className="min-w-10 text-center text-lg font-semibold">{tema.votos_count}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={`break-words ${tema.oculto ? "line-through" : ""}`}>{tema.texto}</span>
                  <span className="text-xs opacity-60">
                    {tema.alumno_alias || "Anónimo"}
                    {tema.oculto ? " · oculto para los alumnos" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => alternarOculto(tema)}
                  className="rounded-md border border-current/20 px-2 py-1 text-xs hover:bg-current/5"
                >
                  {tema.oculto ? "Mostrar" : "Ocultar"}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
