import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirMentorActivo } from "@/lib/auth";
import { COLOR_CINTURON } from "@/lib/cinturones";
import { formatearClase, hoyEnEcuador } from "@/lib/fecha";
import { COLUMNAS_TEMA_MENTOR } from "@/lib/temas";
import type { CicloSemanal, Cinturon, Tema } from "@/types/database";
import { Encabezado } from "../encabezado";
import { PanelCiclo } from "./panel-ciclo";

const CICLOS_RECIENTES = 8;

export default async function PanelCinturonPage({
  params,
  searchParams,
}: PageProps<"/mentor/[slug]">) {
  const { slug } = await params;
  const { ciclo: cicloPedido } = await searchParams;
  const { supabase, mentor } = await requerirMentorActivo();

  const { data: cinturon } = await supabase
    .from("cinturones")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Cinturon>();
  if (!cinturon) notFound();

  const { data: puede } = await supabase.rpc("puede_gestionar", { p_cinturon_id: cinturon.id });
  if (!puede) notFound();

  // Garantiza que exista el ciclo de la próxima clase antes de listar.
  const { data: proximo } = await supabase
    .rpc("ciclo_actual", { p_slug: slug })
    .maybeSingle<CicloSemanal>();

  const { data: ciclos } = await supabase
    .from("ciclos_semanales")
    .select("*")
    .eq("cinturon_id", cinturon.id)
    .order("fecha_clase", { ascending: false })
    .limit(CICLOS_RECIENTES)
    .returns<CicloSemanal[]>();
  const lista = ciclos ?? [];

  // Por defecto: la clase de hoy (aunque ya haya empezado); si no, la próxima.
  const hoy = hoyEnEcuador();
  const ciclo =
    lista.find((c) => c.id === cicloPedido) ??
    lista.find((c) => c.fecha_clase === hoy) ??
    lista.find((c) => c.id === proximo?.id) ??
    lista[0];

  const { data: temas } = ciclo
    ? await supabase
        .from("temas")
        .select(COLUMNAS_TEMA_MENTOR)
        .eq("ciclo_id", ciclo.id)
        .returns<Tema[]>()
    : { data: null };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Encabezado mentor={mentor} />

      <header className="flex flex-col gap-2">
        <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${COLOR_CINTURON[cinturon.slug] ?? ""}`}>
          {cinturon.nombre}
        </span>
        <p className="text-sm opacity-70">
          Enlace para alumnos:{" "}
          <Link href={`/votar/${cinturon.slug}`} className="underline" target="_blank">
            /votar/{cinturon.slug}
          </Link>
        </p>
      </header>

      {lista.length > 1 && (
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Clases">
          {lista.map((c) => (
            <Link
              key={c.id}
              href={`/mentor/${cinturon.slug}?ciclo=${c.id}`}
              aria-current={c.id === ciclo?.id ? "page" : undefined}
              className={`rounded-md border px-2 py-1 ${
                c.id === ciclo?.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-current/20 hover:bg-current/5"
              }`}
            >
              {c.fecha_clase.slice(5).split("-").reverse().join("/")}
              {c.estado === "cerrado" ? " · cerrado" : ""}
            </Link>
          ))}
        </nav>
      )}

      {ciclo ? (
        <PanelCiclo
          key={ciclo.id}
          cicloInicial={ciclo}
          temasIniciales={temas ?? []}
          titulo={formatearClase(ciclo.fecha_clase, cinturon.hora_local)}
          horaClase={cinturon.hora_local}
        />
      ) : (
        <p className="text-sm opacity-70">No hay clases registradas para este cinturón.</p>
      )}
    </main>
  );
}
