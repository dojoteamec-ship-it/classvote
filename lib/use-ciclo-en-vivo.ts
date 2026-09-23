"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CicloSemanal, Tema } from "@/types/database";

// Estado de un ciclo y sus temas, sincronizado con Supabase Realtime.
// Lo usan la vista del alumno (sin ocultos) y el panel del mentor (con ocultos).
export function useCicloEnVivo(
  supabase: SupabaseClient,
  cicloInicial: CicloSemanal,
  temasIniciales: Tema[],
  { incluirOcultos }: { incluirOcultos: boolean },
) {
  const [ciclo, setCiclo] = useState(cicloInicial);
  const [temas, setTemas] = useState(temasIniciales);
  const cicloId = cicloInicial.id;

  useEffect(() => {
    const canal = supabase
      .channel(`ciclo-${cicloId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temas", filter: `ciclo_id=eq.${cicloId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<Tema>).id;
            setTemas((ts) => ts.filter((t) => t.id !== id));
            return;
          }
          const nuevo = payload.new as Tema;
          setTemas((ts) => {
            const sinEste = ts.filter((t) => t.id !== nuevo.id);
            if (nuevo.oculto && !incluirOcultos) return sinEste;
            return ts.some((t) => t.id === nuevo.id)
              ? ts.map((t) => (t.id === nuevo.id ? nuevo : t))
              : [...ts, nuevo];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ciclos_semanales", filter: `id=eq.${cicloId}` },
        (payload) => setCiclo(payload.new as CicloSemanal),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [supabase, cicloId, incluirOcultos]);

  return { ciclo, setCiclo, temas, setTemas };
}

export function ordenarTemas(a: Tema, b: Tema) {
  return b.votos_count - a.votos_count || a.creado_en.localeCompare(b.creado_en);
}
