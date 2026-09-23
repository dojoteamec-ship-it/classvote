import Link from "next/link";
import { Emblema } from "@/components/marca";

// Los alumnos entran desde el enlace de su cinturón (/votar/[slug]).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
      <div className="animate-aparecer">
        <Emblema className="size-24" />
      </div>
      <div className="flex animate-aparecer flex-col items-center gap-5 [animation-delay:120ms]">
        <p className="rotulo">RoninX Academy · ClassVote</p>
        <h1 className="titular max-w-3xl text-5xl text-balance sm:text-7xl">
          Tu voz decide <span className="texto-acento">la clase.</span>
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-balance text-washi/55">
          Cada semana propones y votas el tema del Mondo de tu cinturón. Entra desde el enlace de tu grupo.
        </p>
      </div>
      <Link
        href="/mentor"
        className="animate-aparecer text-sm font-medium text-cian-300/80 transition-colors [animation-delay:240ms] hover:text-cian-200"
      >
        Acceso mentores →
      </Link>
    </main>
  );
}
