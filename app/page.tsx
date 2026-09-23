import Link from "next/link";
import { Sello } from "@/components/marca";

// Los alumnos entran desde el enlace de su cinturón (/votar/[slug]).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="animate-aparecer">
        <Sello className="size-14 -rotate-6 text-3xl" />
      </div>
      <div className="flex animate-aparecer flex-col gap-4 [animation-delay:120ms]">
        <p className="rotulo justify-center">
          <span className="font-serif text-sm tracking-normal text-kin-400">道場</span>
          RoninX Academy
        </p>
        <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-6xl">
          Class<span className="texto-oro">Vote</span>
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-washi/65">
          Cada semana, tu voz decide el tema de la clase Mondo de tu cinturón. Entra desde el enlace de
          tu grupo.
        </p>
      </div>
      <Link
        href="/mentor"
        className="animate-aparecer text-xs font-medium tracking-[0.2em] text-washi/40 uppercase transition-colors [animation-delay:240ms] hover:text-kin-300"
      >
        師範 · Acceso mentores
      </Link>
    </main>
  );
}
