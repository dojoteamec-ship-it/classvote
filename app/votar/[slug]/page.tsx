import { notFound } from "next/navigation";
import { Marca } from "@/components/marca";
import { Obi } from "@/components/obi";
import { createClient } from "@/lib/supabase/server";
import { formatearClase, instanteClase } from "@/lib/fecha";
import { COLUMNAS_TEMA_ALUMNO } from "@/lib/temas";
import type { CicloSemanal, Cinturon, Tema } from "@/types/database";
import { Votacion } from "./votacion";

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
        .select(COLUMNAS_TEMA_ALUMNO)
        .eq("ciclo_id", ciclo.id)
        .order("votos_count", { ascending: false })
        .order("creado_en", { ascending: true })
        .returns<Tema[]>()
    : { data: null };

  const encabezado = (
    <header className="flex flex-col gap-5">
      <Obi slug={cinturon.slug} nombre={cinturon.nombre} />
      <h1 className="titular text-4xl text-balance sm:text-5xl lg:text-6xl">
        ¿De qué hablamos en el <span className="texto-acento">Mondo</span>?
      </h1>
      {ciclo && (
        <p className="text-base text-washi/55">
          Próxima clase ·{" "}
          <span className="text-washi/90 first-letter:uppercase">
            {formatearClase(ciclo.fecha_clase, cinturon.hora_local)}
          </span>
        </p>
      )}
    </header>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 pt-6 pb-20 sm:px-8 sm:pt-8">
      <nav className="animate-aparecer">
        <Marca />
      </nav>

      {error || !ciclo ? (
        <main className="flex flex-col gap-8">
          {encabezado}
          <p className="tarjeta p-6 text-sm text-washi/70">
            La votación no está disponible en este momento. Intenta de nuevo en unos minutos.
          </p>
        </main>
      ) : (
        <Votacion
          cicloInicial={ciclo}
          temasIniciales={temas ?? []}
          encabezado={encabezado}
          cierre={cinturon.hora_local ? instanteClase(ciclo.fecha_clase, cinturon.hora_local) : null}
        />
      )}
    </div>
  );
}
