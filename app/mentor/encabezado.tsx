import Link from "next/link";
import type { Mentor } from "@/types/database";
import { salir } from "./acciones";

export function Encabezado({ mentor }: { mentor: Mentor }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-current/10 pb-3 text-sm">
      <Link href="/mentor" className="font-semibold">
        ClassVote · Mentores
      </Link>
      <div className="flex items-center gap-3">
        {mentor.rol === "admin" && mentor.estado === "activo" && (
          <Link href="/admin" className="underline">
            Administrar
          </Link>
        )}
        <span className="opacity-70">{mentor.nombre}</span>
        <form action={salir}>
          <button type="submit" className="underline">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
