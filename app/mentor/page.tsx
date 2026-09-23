import Link from "next/link";
import { Obi } from "@/components/obi";
import { Rotulo } from "@/components/rotulo";
import { requerirMentor } from "@/lib/auth";
import { obiDe } from "@/lib/cinturones";
import type { Cinturon } from "@/types/database";
import { Contenedor } from "./contenedor";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function Aviso({ kanji, titulo, texto }: { kanji: string; titulo: string; texto: string }) {
  return (
    <div className="tarjeta flex animate-aparecer items-start gap-5 p-6 [animation-delay:80ms]">
      <span className="font-display text-4xl text-cian-400/80">{kanji}</span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-bold">{titulo}</h1>
        <p className="text-sm leading-relaxed text-washi/60">{texto}</p>
      </div>
    </div>
  );
}

export default async function MentorPage() {
  const { supabase, mentor } = await requerirMentor();

  let cinturones: Cinturon[] = [];
  if (mentor.estado === "activo") {
    // El admin ve todos los cinturones activos; el mentor, solo los asignados.
    let consulta = supabase.from("cinturones").select("*").order("orden");
    if (mentor.rol !== "admin") {
      const { data: asignados } = await supabase
        .from("mentor_cinturones")
        .select("cinturon_id")
        .eq("mentor_id", mentor.id);
      consulta = consulta.in("id", (asignados ?? []).map((a) => a.cinturon_id));
    }
    cinturones = (await consulta.returns<Cinturon[]>()).data ?? [];
  }

  return (
    <Contenedor mentor={mentor}>
      {mentor.estado === "pendiente" && (
        <Aviso
          kanji="待"
          titulo="Tu cuenta está pendiente"
          texto="Cuando el administrador la apruebe y te asigne tu cinturón, lo verás aquí."
        />
      )}
      {mentor.estado === "inactivo" && (
        <Aviso
          kanji="休"
          titulo="Tu cuenta está desactivada"
          texto="Si crees que es un error, contacta al administrador."
        />
      )}

      {mentor.estado === "activo" && (
        <main className="flex flex-col gap-6">
          <div className="flex animate-aparecer flex-col gap-2 [animation-delay:80ms]">
            <Rotulo kanji="帯">Tus cinturones</Rotulo>
            <h1 className="font-display text-3xl font-bold">
              Hola, <span className="texto-acento">{mentor.nombre.split(" ")[0]}</span>
            </h1>
          </div>

          {cinturones.length === 0 ? (
            <Aviso
              kanji="空"
              titulo="Sin cinturones asignados"
              texto="Pídele al administrador que te asigne uno."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {cinturones.map((c, i) => (
                <li key={c.id} className="animate-aparecer" style={{ animationDelay: `${140 + i * 60}ms` }}>
                  <Link
                    href={`/mentor/${c.slug}`}
                    className="tarjeta tarjeta-interactiva group flex h-full flex-col gap-6 overflow-hidden p-5"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-2 -bottom-6 font-display text-[7rem] leading-none text-white/[0.035] transition-colors duration-500 group-hover:text-cian-400/[0.07]"
                    >
                      {obiDe(c.slug).kanji}
                    </span>
                    <Obi slug={c.slug} nombre={c.nombre} />
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs tracking-wider text-washi/40 uppercase">Clase Mondo</span>
                        <span className="font-display text-lg font-semibold">
                          {c.dia_semana !== null ? DIAS[c.dia_semana] : ""} · {c.hora_local?.slice(0, 5)}
                        </span>
                      </div>
                      <span className="text-sm text-washi/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-cian-300">
                        Abrir panel →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </Contenedor>
  );
}
