"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerFingerprint } from "@/lib/fingerprint";
import type { CicloSemanal, Tema } from "@/types/database";

const COLUMNAS_TEMA = "id, ciclo_id, texto, alumno_alias, votos_count, creado_en";
const KEY_ALIAS = "classvote:alias";
const keyVotados = (cicloId: string) => `classvote:votados:${cicloId}`;

function ordenar(a: Tema, b: Tema) {
  return b.votos_count - a.votos_count || a.creado_en.localeCompare(b.creado_en);
}

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
  const [ciclo, setCiclo] = useState(cicloInicial);
  const [temas, setTemas] = useState(temasIniciales);
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
  const ordenados = useMemo(() => [...temas].sort(ordenar), [temas]);

  // Tiempo real: temas nuevos, cambios de conteo y cierre del ciclo.
  useEffect(() => {
    const canal = supabase
      .channel(`ciclo-${ciclo.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temas", filter: `ciclo_id=eq.${ciclo.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<Tema>).id;
            setTemas((ts) => ts.filter((t) => t.id !== id));
            return;
          }
          const nuevo = payload.new as Tema;
          setTemas((ts) =>
            ts.some((t) => t.id === nuevo.id)
              ? ts.map((t) => (t.id === nuevo.id ? nuevo : t))
              : [...ts, nuevo],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ciclos_semanales", filter: `id=eq.${ciclo.id}` },
        (payload) => setCiclo(payload.new as CicloSemanal),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, ciclo.id]);

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
        ? "La votación de esta clase ya cerró."
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
      .select(COLUMNAS_TEMA)
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

  return (
    <div className="flex flex-col gap-6">
      {cerrado ? (
        <p className="rounded-lg border border-current/20 p-4 text-sm">
          La votación de esta clase ya cerró. Estos son los temas que eligieron.
        </p>
      ) : (
        <form onSubmit={proponer} className="flex flex-col gap-3 rounded-lg border border-current/20 p-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Propón un tema
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              minLength={3}
              maxLength={200}
              rows={2}
              required
              placeholder="Ej.: ¿Cómo calculo el ROAS real de mi campaña?"
              className="rounded-md border border-current/20 bg-transparent p-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Tu nombre (opcional)
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={40}
              placeholder="Anónimo"
              className="rounded-md border border-current/20 bg-transparent p-2 font-normal"
            />
          </label>
          <button
            type="submit"
            disabled={enviando || texto.trim().length < 3}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {enviando ? "Enviando…" : "Proponer tema"}
          </button>
        </form>
      )}

      {aviso && (
        <p role="alert" className="text-sm text-red-600">
          {aviso}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Temas propuestos</h2>
          {!cerrado && (
            <span className="text-xs opacity-60">Puedes votar varios temas, una vez cada uno</span>
          )}
        </div>

        {ordenados.length === 0 ? (
          <p className="text-sm opacity-70">
            {cerrado ? "No se propusieron temas." : "Todavía no hay temas. ¡Propón el primero!"}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ordenados.map((tema) => {
              const yaVoto = votados.has(tema.id);
              return (
                <li
                  key={tema.id}
                  className="flex items-center gap-3 rounded-lg border border-current/20 p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="break-words">{tema.texto}</span>
                    <span className="text-xs opacity-60">{tema.alumno_alias || "Anónimo"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => votar(tema.id)}
                    disabled={cerrado || yaVoto || !fingerprint}
                    aria-pressed={yaVoto}
                    aria-label={yaVoto ? "Ya votaste este tema" : "Votar este tema"}
                    className={`flex min-w-16 flex-col items-center rounded-md border px-3 py-1 text-sm ${
                      yaVoto
                        ? "border-foreground bg-foreground text-background"
                        : "border-current/30 enabled:hover:bg-current/10"
                    } disabled:cursor-default`}
                  >
                    <span className="text-lg font-semibold leading-tight">{tema.votos_count}</span>
                    <span className="text-xs">{yaVoto ? "Votaste" : cerrado ? "votos" : "Votar"}</span>
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
