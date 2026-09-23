"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerFingerprint } from "@/lib/fingerprint";
import { COLUMNAS_TEMA_ALUMNO } from "@/lib/temas";
import { ordenarTemas, useCicloEnVivo } from "@/lib/use-ciclo-en-vivo";
import type { CicloSemanal, Tema } from "@/types/database";
import { EstadoVotacion, Rotulo } from "@/components/rotulo";
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

export function Votacion({
  cicloInicial,
  temasIniciales,
}: {
  cicloInicial: CicloSemanal;
  temasIniciales: Tema[];
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

  return (
    <div className="flex flex-col gap-8">
      {cerrado ? (
        <div className="tarjeta flex animate-aparecer items-center gap-4 p-5 [animation-delay:160ms]">
          <span className="font-serif text-2xl text-kin-400">終</span>
          <p className="text-sm leading-relaxed text-washi/75">
            La votación de esta clase ya cerró. Estos son los temas que eligieron.
          </p>
        </div>
      ) : (
        <form
          onSubmit={proponer}
          className="tarjeta flex animate-aparecer flex-col gap-4 p-5 [animation-delay:160ms] sm:p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <Rotulo kanji="提案">Propón un tema</Rotulo>
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
        <p role="alert" className="-mt-4 rounded-xl border border-shu-500/30 bg-shu-500/10 px-4 py-3 text-sm text-shu-400">
          {aviso}
        </p>
      )}

      <section className="flex animate-aparecer flex-col gap-4 [animation-delay:240ms]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Rotulo kanji="題目">Temas propuestos</Rotulo>
          <EstadoVotacion abierta={!cerrado} />
        </div>
        {!cerrado && ordenados.length > 0 && (
          <p className="-mt-2 text-xs text-washi/40">Puedes votar varios temas, una vez cada uno.</p>
        )}

        {ordenados.length === 0 ? (
          <div className="tarjeta flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="font-serif text-3xl text-washi/20">空</span>
            <p className="text-sm text-washi/55">
              {cerrado ? "No se propusieron temas." : "Todavía no hay temas. ¡Propón el primero!"}
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {ordenados.map((tema, indice) => {
              const yaVoto = votados.has(tema.id);
              return (
                <li
                  key={tema.id}
                  className="tarjeta tarjeta-interactiva flex animate-aparecer items-center gap-3 p-3.5 sm:gap-4 sm:p-4"
                  style={{ animationDelay: `${280 + Math.min(indice, 8) * 50}ms` }}
                >
                  <Puesto indice={indice} activo={tema.votos_count > 0} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="leading-snug break-words">{tema.texto}</span>
                    <span className="text-xs text-washi/40">{tema.alumno_alias || "Anónimo"}</span>
                    <BarraVotos votos={tema.votos_count} maximo={maximo} />
                  </div>
                  <button
                    type="button"
                    onClick={() => votar(tema.id)}
                    disabled={cerrado || yaVoto || !fingerprint}
                    aria-pressed={yaVoto}
                    aria-label={yaVoto ? "Ya votaste este tema" : "Votar este tema"}
                    className={`relative flex w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-all duration-300 ${
                      yaVoto
                        ? "border-shu-500/50 bg-shu-500/10"
                        : cerrado
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-white/12 bg-white/[0.04] enabled:hover:border-kin-400/50 enabled:hover:bg-kin-400/10 enabled:active:scale-95"
                    } disabled:cursor-default`}
                  >
                    <Contador valor={tema.votos_count} className="font-serif text-xl font-bold" />
                    <span
                      className={`text-[0.65rem] font-semibold tracking-wider uppercase ${
                        yaVoto ? "text-shu-400" : "text-washi/50"
                      }`}
                    >
                      {yaVoto ? "Votaste" : cerrado ? "votos" : "Votar"}
                    </span>
                    {yaVoto && (
                      <span
                        aria-hidden
                        className="absolute -top-2.5 -right-2.5 grid size-7 animate-sello place-items-center rounded-md bg-gradient-to-b from-shu-400 to-shu-600 font-serif text-xs font-bold text-[#fff4ea] shadow-[0_4px_12px_-2px_rgba(212,68,44,0.7)]"
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
  );
}
