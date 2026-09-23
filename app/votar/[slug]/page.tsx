import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COLOR_CINTURON } from "@/lib/cinturones";
import { formatearClase } from "@/lib/fecha";
import type { CicloSemanal, Cinturon, Tema } from "@/types/database";
import { Votacion } from "./votacion";

const COLUMNAS_TEMA = "id, ciclo_id, texto, alumno_alias, votos_count, creado_en";

export default async function VotarPage({ params }: PageProps<"/votar/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  // RLS solo devuelve cinturones activos: Blanco (Nivel 0) da 404.
  const { data: cinturon } = await supabase
    .from("cinturones")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Cinturon>();
  if (!cinturon) notFound();

  const { data: ciclo, error } = await supabase
    .rpc("ciclo_actual", { p_slug: slug })
    .maybeSingle<CicloSemanal>();

  const { data: temas } = ciclo
    ? await supabase
        .from("temas")
        .select(COLUMNAS_TEMA)
        .eq("ciclo_id", ciclo.id)
        .order("votos_count", { ascending: false })
        .order("creado_en", { ascending: true })
        .returns<Tema[]>()
    : { data: null };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <span
          className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${COLOR_CINTURON[cinturon.slug] ?? ""}`}
        >
          {cinturon.nombre}
        </span>
        <h1 className="text-2xl font-semibold">¿De qué quieres que hablemos en el Mondo?</h1>
        {ciclo && (
          <p className="text-sm opacity-70">
            Próxima clase: {formatearClase(ciclo.fecha_clase, cinturon.hora_local)}
          </p>
        )}
      </header>

      {error || !ciclo ? (
        <p className="rounded-lg border border-current/20 p-4 text-sm">
          La votación no está disponible en este momento. Intenta de nuevo en unos minutos.
        </p>
      ) : (
        <Votacion cicloInicial={ciclo} temasIniciales={temas ?? []} />
      )}
    </main>
  );
}
