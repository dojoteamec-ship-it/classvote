"use client";

import { useMemo, useState } from "react";
import { CuentaRegresiva } from "@/components/cuenta-regresiva";
import { instanteClase } from "@/lib/fecha";
import { EstadoVotacion, Rotulo } from "@/components/rotulo";
import { BarraVotos, Contador, Puesto } from "@/components/tema-ui";
import { createClient } from "@/lib/supabase/client";
import { ETIQUETA_SESION } from "@/lib/temas";
import { ordenarTemas, useCicloEnVivo } from "@/lib/use-ciclo-en-vivo";
import type { CicloSemanal, SesionTipo, Tema } from "@/types/database";
import { cambiarEstadoCiclo, cambiarOculto, cambiarTipoSesion } from "../acciones";

const OPCIONES_SESION: { valor: SesionTipo | null; etiqueta: string; kanji: string }[] = [
  { valor: null, etiqueta: "Sin definir", kanji: "未" },
  { valor: "qa", etiqueta: ETIQUETA_SESION.qa, kanji: "問" },
  { valor: "practica", etiqueta: ETIQUETA_SESION.practica, kanji: "乱" },
];

function Cifra({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="tarjeta flex flex-col gap-1 px-4 py-3">
      <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-washi/40 uppercase">{etiqueta}</span>
      <span className="titular text-2xl">{children}</span>
    </div>
  );
}

export function PanelCiclo({
  cicloInicial,
  temasIniciales,
  horaClase,
}: {
  cicloInicial: CicloSemanal;
  temasIniciales: Tema[];
  horaClase: string | null;
}) {
  const [supabase] = useState(createClient);
  const { ciclo, setCiclo, temas, setTemas } = useCicloEnVivo(supabase, cicloInicial, temasIniciales, {
    incluirOcultos: true,
  });
  const [error, setError] = useState<string | null>(null);
  const ordenados = useMemo(() => [...temas].sort(ordenarTemas), [temas]);
  const cerrado = ciclo.estado === "cerrado";
  const visibles = temas.filter((t) => !t.oculto);
  const totalVotos = visibles.reduce((suma, t) => suma + t.votos_count, 0);
  const maximo = Math.max(0, ...visibles.map((t) => t.votos_count));

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
    const anterior = { estado: ciclo.estado, reabierto: ciclo.reabierto };
    guardar(
      () => setCiclo((c) => ({ ...c, estado: nuevo, reabierto: c.reabierto || nuevo === "votando" })),
      () => setCiclo((c) => ({ ...c, ...anterior })),
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

  const cierre = cerrado ? (
    "Cerrada"
  ) : ciclo.reabierto || !horaClase ? (
    "Manual"
  ) : (
    <CuentaRegresiva objetivo={instanteClase(ciclo.fecha_clase, horaClase)} compacta />
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid animate-aparecer grid-cols-2 gap-3 [animation-delay:160ms] sm:grid-cols-4">
        <Cifra etiqueta="Temas">
          <Contador valor={visibles.length} />
        </Cifra>
        <Cifra etiqueta="Votos">
          <Contador valor={totalVotos} className="texto-acento" />
        </Cifra>
        <Cifra etiqueta="Cierra en">{cierre}</Cifra>
        <div className="tarjeta flex flex-col justify-center gap-2 px-4 py-3">
          <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-washi/40 uppercase">En vivo</span>
          <EstadoVotacion abierta={!cerrado} />
        </div>
      </section>

      <section className="tarjeta flex animate-aparecer flex-col gap-5 p-5 [animation-delay:220ms] sm:p-6">
        <div className="flex flex-col gap-3">
          <Rotulo kanji="稽古">Tipo de sesión</Rotulo>
          <div role="radiogroup" aria-label="Tipo de sesión" className="grid gap-2 sm:grid-cols-3">
            {OPCIONES_SESION.map((op) => {
              const activo = ciclo.tipo_sesion === op.valor;
              return (
                <button
                  key={op.etiqueta}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => elegirTipo(op.valor)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-300 ${
                    activo
                      ? "border-cian-400/60 bg-cian-400/12 text-washi shadow-[0_0_0_4px_rgba(61,208,251,0.1)]"
                      : "border-white/10 bg-white/[0.03] text-washi/60 hover:border-white/20 hover:text-washi"
                  }`}
                >
                  <span className={`font-display text-xl ${activo ? "text-cian-300" : "text-washi/30"}`}>
                    {op.kanji}
                  </span>
                  {op.etiqueta}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-washi/45">
            {cerrado
              ? "Los alumnos ya no pueden proponer ni votar."
              : ciclo.reabierto
                ? "Reabierta manualmente: no se cerrará sola, ciérrala cuando termines."
                : horaClase
                  ? `Se cierra sola a las ${horaClase.slice(0, 5)} del día de la clase.`
                  : null}
          </p>
          <button
            type="button"
            onClick={alternarEstado}
            className={cerrado ? "boton-secundario" : "boton-secundario hover:!border-shu-500/50 hover:!text-shu-400"}
          >
            {cerrado ? "Reabrir votación" : "Cerrar votación ahora"}
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-shu-500/30 bg-shu-500/10 px-4 py-3 text-sm text-shu-400">
            {error}
          </p>
        )}
      </section>

      <section className="flex animate-aparecer flex-col gap-4 [animation-delay:280ms]">
        <Rotulo kanji="題目">Temas por votos</Rotulo>

        {ordenados.length === 0 ? (
          <div className="tarjeta flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="font-display text-3xl text-washi/20">空</span>
            <p className="text-sm text-washi/55">Los alumnos todavía no han propuesto temas.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {ordenados.map((tema, indice) => (
              <li
                key={tema.id}
                className={`tarjeta flex animate-aparecer items-center gap-4 p-4 transition-opacity duration-300 ${
                  tema.oculto ? "opacity-45" : ""
                }`}
                style={{ animationDelay: `${320 + Math.min(indice, 8) * 50}ms` }}
              >
                <Puesto indice={indice} activo={!tema.oculto && tema.votos_count > 0} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className={`leading-snug break-words ${tema.oculto ? "line-through" : ""}`}>
                    {tema.texto}
                  </span>
                  <span className="text-xs text-washi/40">
                    {tema.alumno_alias || "Anónimo"}
                    {tema.oculto ? " · oculto para los alumnos" : ""}
                  </span>
                  {!tema.oculto && <BarraVotos votos={tema.votos_count} maximo={maximo} />}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="flex items-baseline gap-1">
                    <Contador valor={tema.votos_count} className="font-display text-2xl font-bold" />
                    <span className="text-[0.65rem] text-washi/40 uppercase">
                      {tema.votos_count === 1 ? "voto" : "votos"}
                    </span>
                  </span>
                  <button type="button" onClick={() => alternarOculto(tema)} className="boton-secundario py-1 text-xs">
                    {tema.oculto ? "Mostrar" : "Ocultar"}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
