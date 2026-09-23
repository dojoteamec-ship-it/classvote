import Link from "next/link";
import { notFound } from "next/navigation";
import { Obi } from "@/components/obi";
import { requerirMentorActivo } from "@/lib/auth";
import { formatearClase, hoyEnEcuador } from "@/lib/fecha";
import { COLUMNAS_TEMA_MENTOR } from "@/lib/temas";
import type { CicloSemanal, Cinturon, Tema } from "@/types/database";
import { Contenedor } from "../contenedor";
import { CopiarEnlace } from "./copiar-enlace";
import { PanelCiclo } from "./panel-ciclo";

const CICLOS_RECIENTES = 8;
const fechaCorta = (fecha: string) =>
  new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${fecha}T12:00:00Z`),
  );

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
    <Contenedor mentor={mentor}>
      <main className="flex flex-col gap-6">
        <header className="flex animate-aparecer flex-col gap-4 [animation-delay:80ms]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Obi slug={cinturon.slug} nombre={cinturon.nombre} />
            <CopiarEnlace ruta={`/votar/${cinturon.slug}`} />
          </div>
          {ciclo && (
            <h1 className="font-serif text-3xl font-bold first-letter:uppercase sm:text-4xl">
              {formatearClase(ciclo.fecha_clase, cinturon.hora_local)}
            </h1>
          )}
        </header>

        {lista.length > 1 && (
          <nav
            aria-label="Clases"
            className="-mx-1 flex animate-aparecer gap-2 overflow-x-auto px-1 pb-1 [animation-delay:120ms]"
          >
            {lista.map((c) => {
              const actual = c.id === ciclo?.id;
              return (
                <Link
                  key={c.id}
                  href={`/mentor/${cinturon.slug}?ciclo=${c.id}`}
                  aria-current={actual ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    actual
                      ? "border-kin-400/50 bg-kin-400/15 text-kin-300"
                      : "border-white/10 bg-white/[0.03] text-washi/55 hover:border-white/20 hover:text-washi"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${c.estado === "cerrado" ? "bg-washi/30" : "bg-matcha"}`}
                  />
                  {fechaCorta(c.fecha_clase)}
                  {c.fecha_clase === hoy && <span className="text-[0.6rem] tracking-wider uppercase">hoy</span>}
                </Link>
              );
            })}
          </nav>
        )}

        {ciclo ? (
          <PanelCiclo
            key={ciclo.id}
            cicloInicial={ciclo}
            temasIniciales={temas ?? []}
            horaClase={cinturon.hora_local}
          />
        ) : (
          <p className="tarjeta p-6 text-sm text-washi/60">No hay clases registradas para este cinturón.</p>
        )}
      </main>
    </Contenedor>
  );
}
