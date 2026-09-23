import Link from "next/link";
import { Marca } from "@/components/marca";
import type { Mentor } from "@/types/database";
import { salir } from "./acciones";

const ENLACE = "rounded-lg px-3 py-1.5 text-sm text-washi/60 transition-colors hover:bg-white/5 hover:text-washi";

export function Encabezado({ mentor }: { mentor: Mentor }) {
  const iniciales = mentor.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="tarjeta sticky top-3 z-20 flex animate-aparecer flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <Marca href="/mentor" compacta />
      <nav className="flex flex-wrap items-center gap-1">
        <Link href="/mentor" className={ENLACE}>
          Cinturones
        </Link>
        {mentor.rol === "admin" && mentor.estado === "activo" && (
          <Link href="/admin" className={ENLACE}>
            Administrar
          </Link>
        )}
        <Link
          href="/mentor/cuenta"
          title="Mi cuenta"
          className="ml-1 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-washi/70 transition-colors hover:bg-white/5 hover:text-washi"
        >
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-b from-ai-400/40 to-ai-400/10 text-[0.7rem] font-semibold text-washi ring-1 ring-white/15">
            {iniciales}
          </span>
          <span className="hidden sm:inline">{mentor.nombre}</span>
        </Link>
        <form action={salir}>
          <button type="submit" className={ENLACE}>
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
