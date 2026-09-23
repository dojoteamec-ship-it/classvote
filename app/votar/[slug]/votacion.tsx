"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerFingerprint } from "@/lib/fingerprint";
import { COLUMNAS_TEMA_ALUMNO } from "@/lib/temas";
import { ordenarTemas, useCicloEnVivo } from "@/lib/use-ciclo-en-vivo";
import type { CicloSemanal, Tema } from "@/types/database";
import { CuentaRegresiva } from "@/components/cuenta-regresiva";
import { EstadoVotacion } from "@/components/rotulo";
import { BarraVotos, Contador, Puesto } from "@/components/tema-ui";

const KEY_ALIAS = "classvote:alias";
const keyVotados = (cicloId: string) => `classvote:votados:${cicloId}`;

function leerVotados(cicloId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(keyVotados(cicloId)) ?? "[]"));
  } catch {
    return new Set();
  }
}

function leerAlias(): string {
  try {
    return localStorage.getItem(KEY_ALIAS) ?? "";
  } catch {
    return "";
  }
}

// false en el servidor y en la hidratación, true después: permite leer
// localStorage durante el render sin descuadrar el HTML del servidor.
const sinSuscripcion = () => () => {};
function useMontado() {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false);
}

const NINGUNO: ReadonlySet<string> = new Set();

function guardarVotados(cicloId: string, votados: Set<string>) {
  try {
    localStorage.setItem(keyVotados(cicloId), JSON.stringify([...votados]));
  } catch {}
}

const PASOS = [
  ["提案", "Propón", "Escribe el tema que quieres ver en clase."],
  ["投票", "Vota", "Apoya todos los temas que te interesen, una vez cada uno."],
  ["決定", "Se decide", "El mentor llega a clase con los más votados."],
] as const;

export function Votacion({
  cicloInicial,
  temasIniciales,
  encabezado,
  cierre,
}: {
  cicloInicial: CicloSemanal;
  temasIniciales: Tema[];
  encabezado: React.ReactNode;
  /** Segundos Unix del inicio de la clase (cierre automático). */
  cierre: number | null;
}) {
  const [supabase] = useState(createClient);
  const { ciclo, temas, setTemas } = useCicloEnVivo(supabase, cicloInicial, temasIniciales, {
    incluirOcultos: false,
  });
  const montado = useMontado();
  const [votadosEditados, setVotados] = useState<Set<string> | null>(null);
  const [aliasEditado, setAlias] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Estado del navegador (fingerprint, votos ya dados, último alias): se lee
  // de localStorage hasta que el alumno lo modifica en esta sesión.
  const fingerprint = montado ? obtenerFingerprint() : null;
  const votados = votadosEditados ?? (montado ? leerVotados(ciclo.id) : NINGUNO);
  const alias = aliasEditado ?? (montado ? leerAlias() : "");

  const cerrado = ciclo.estado === "cerrado";
  const ordenados = useMemo(() => [...temas].sort(ordenarTemas), [temas]);

  function sumarVoto(temaId: string, delta: number) {
    setTemas((ts) =>
      ts.map((t) => (t.id === temaId ? { ...t, votos_count: t.votos_count + delta } : t)),
    );
  }

  async function votar(temaId: string) {
    if (!fingerprint || cerrado || votados.has(temaId)) return;
    setAviso(null);

    const siguientes = new Set(votados).add(temaId);
    setVotados(siguientes);
    guardarVotados(ciclo.id, siguientes);
    sumarVoto(temaId, 1);

    const { error } = await supabase
      .from("votos")
      .insert({ tema_id: temaId, alumno_fingerprint: fingerprint });
    if (!error) return;

    // Ya existía el voto (otra pestaña, storage borrado): queda marcado.
    sumarVoto(temaId, -1);
    if (error.code === "23505") return;

    const sinVoto = new Set(siguientes);
    sinVoto.delete(temaId);
    setVotados(sinVoto);
    guardarVotados(ciclo.id, sinVoto);
    setAviso(
      error.code === "42501"
        ? "Este tema ya no está disponible o la votación cerró. Recarga la página."
        : "No se pudo registrar tu voto. Intenta de nuevo.",
    );
  }

  async function proponer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = texto.trim();
    const nombre = alias.trim();
    if (limpio.length < 3 || cerrado) return;

    setEnviando(true);
    setAviso(null);
    const { data, error } = await supabase
      .from("temas")
      .insert({ ciclo_id: ciclo.id, texto: limpio, alumno_alias: nombre || null })
      .select(COLUMNAS_TEMA_ALUMNO)
      .single<Tema>();
    setEnviando(false);

    if (error || !data) {
      setAviso(
        error?.code === "42501"
          ? "La votación de esta clase ya cerró."
          : "No se pudo enviar tu tema. Intenta de nuevo.",
      );
      return;
    }

    setTemas((ts) => (ts.some((t) => t.id === data.id) ? ts : [...ts, data]));
    setTexto("");
    try {
      if (nombre) localStorage.setItem(KEY_ALIAS, nombre);
    } catch {}
  }

  const maximo = ordenados[0]?.votos_count ?? 0;
  const conCuenta = !cerrado && !ciclo.reabierto && cierre !== null;

  return (
    <main className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* Columna protagonista */}
      <aside className="flex animate-aparecer flex-col gap-8 [animation-delay:80ms] lg:sticky lg:top-8 lg:self-start">
        {encabezado}

        {conCuenta && (
          <div className="flex flex-col gap-3">
            <span className="rotulo">La votación cierra en</span>
            <CuentaRegresiva objetivo={cierre} />
          </div>
        )}
        {cerrado && (
          <div className="tarjeta flex items-center gap-4 p-5">
            <span className="text-2xl text-cian-400">終</span>
            <p className="text-sm leading-relaxed text-washi/70">
              La votación de esta clase ya cerró. Estos son los temas que eligieron.
            </p>
          </div>
        )}

        <ol className="hidden flex-col gap-4 border-t border-white/[0.06] pt-6 lg:flex">
          {PASOS.map(([kanji, titulo, texto]) => (
            <li key={titulo} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cian-400/10 text-sm text-cian-300 ring-1 ring-cian-400/25">
                {kanji}
              </span>
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight">{titulo}</span>
                <span className="text-sm text-washi/50">{texto}</span>
              </div>
            </li>
          ))}
        </ol>
      </aside>

      {/* Columna de participación */}
      <div className="flex flex-col gap-8">
        {!cerrado && (
          <form
            onSubmit={proponer}
            className="tarjeta flex animate-aparecer flex-col gap-4 p-5 [animation-delay:160ms] sm:p-7"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Propón un tema</h2>
              <span className="text-xs text-washi/35 tabular-nums">{texto.length}/200</span>
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              minLength={3}
              maxLength={200}
              rows={3}
              required
              aria-label="Tema que quieres proponer"
              placeholder="Ej.: ¿Cómo calculo el ROAS real de mi campaña?"
              className="campo resize-none"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                maxLength={40}
                aria-label="Tu nombre (opcional)"
                placeholder="Tu nombre (opcional)"
                className="campo sm:flex-1"
              />
              <button type="submit" disabled={enviando || texto.trim().length < 3} className="boton-primario">
                {enviando ? "Enviando…" : "Proponer tema"}
              </button>
            </div>
          </form>
        )}

        {aviso && (
          <p role="alert" className="-mt-4 rounded-2xl border border-shu-500/30 bg-shu-500/10 px-4 py-3 text-sm text-shu-400">
            {aviso}
          </p>
        )}

        <section className="flex animate-aparecer flex-col gap-4 [animation-delay:240ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Temas propuestos <span className="text-washi/35">· {ordenados.length}</span>
            </h2>
            <EstadoVotacion abierta={!cerrado} />
          </div>

          {ordenados.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="text-3xl text-washi/20">空</span>
              <p className="text-sm text-washi/55">
                {cerrado ? "No se propusieron temas." : "Todavía no hay temas. ¡Propón el primero!"}
              </p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {ordenados.map((tema, indice) => {
                const yaVoto = votados.has(tema.id);
                const lider = indice === 0 && tema.votos_count > 0;
                return (
                  <li
                    key={tema.id}
                    className={`tarjeta tarjeta-interactiva flex animate-aparecer items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
                      lider ? "ring-1 ring-cian-400/30 shadow-[0_0_60px_-30px_rgba(61,208,251,0.8)]" : ""
                    }`}
                    style={{ animationDelay: `${280 + Math.min(indice, 8) * 50}ms` }}
                  >
                    <Puesto indice={indice} activo={tema.votos_count > 0} />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className={`leading-snug break-words ${lider ? "text-[1.05rem] font-medium" : ""}`}>
                        {tema.texto}
                      </span>
                      <span className="text-xs text-washi/40">{tema.alumno_alias || "Anónimo"}</span>
                      <BarraVotos votos={tema.votos_count} maximo={maximo} />
                    </div>
                    <button
                      type="button"
                      onClick={() => votar(tema.id)}
                      disabled={cerrado || yaVoto || !fingerprint}
                      aria-pressed={yaVoto}
                      aria-label={yaVoto ? "Ya votaste este tema" : "Votar este tema"}
                      className={`relative flex w-[4.75rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-2 py-2.5 transition-all duration-300 ${
                        yaVoto
                          ? "border-cian-400/50 bg-cian-400/10"
                          : cerrado
                            ? "border-white/[0.07] bg-white/[0.03]"
                            : "border-white/10 bg-white/[0.05] enabled:hover:border-cian-400/50 enabled:hover:bg-cian-400/10 enabled:active:scale-95"
                      } disabled:cursor-default`}
                    >
                      {yaVoto && (
                        <span aria-hidden className="absolute inset-0 animate-onda rounded-2xl ring-2 ring-cian-400/60" />
                      )}
                      <Contador valor={tema.votos_count} className="titular text-2xl" />
                      <span
                        className={`text-[0.65rem] font-semibold tracking-wider uppercase ${
                          yaVoto ? "text-cian-300" : "text-washi/50"
                        }`}
                      >
                        {yaVoto ? "Votaste" : cerrado ? "votos" : "Votar"}
                      </span>
                      {yaVoto && (
                        <span
                          aria-hidden
                          className="absolute -top-2.5 -right-2.5 grid size-7 animate-sello place-items-center rounded-full bg-gradient-to-b from-cian-300 to-cian-500 text-xs font-bold text-noche-950 shadow-[0_0_18px_-2px_rgba(61,208,251,0.9)]"
                        >
                          印
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
