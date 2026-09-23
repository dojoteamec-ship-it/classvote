import { notFound } from "next/navigation";
import { Marca } from "@/components/marca";
import { Obi } from "@/components/obi";
import { createClient } from "@/lib/supabase/server";
import { formatearClase } from "@/lib/fecha";
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-6 pb-16 sm:pt-10">
      <div className="animate-aparecer">
        <Marca />
      </div>

      <header className="flex animate-aparecer flex-col gap-4 [animation-delay:80ms]">
        <Obi slug={cinturon.slug} nombre={cinturon.nombre} />
        <h1 className="font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl">
          ¿De qué quieres que hablemos en el <span className="texto-oro">Mondo</span>?
        </h1>
        {ciclo && (
          <p className="text-sm text-washi/60">
            Próxima clase ·{" "}
            <span className="text-washi/90 first-letter:uppercase">
              {formatearClase(ciclo.fecha_clase, cinturon.hora_local)}
            </span>
          </p>
        )}
      </header>

      {error || !ciclo ? (
        <p className="tarjeta p-5 text-sm text-washi/75">
          La votación no está disponible en este momento. Intenta de nuevo en unos minutos.
        </p>
      ) : (
        <Votacion cicloInicial={ciclo} temasIniciales={temas ?? []} />
      )}
    </main>
  );
}
