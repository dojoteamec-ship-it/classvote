import Link from "next/link";

// Sello hanko (印) + nombre. `compacta` para barras de navegación.
export function Sello({ kanji = "投", className = "" }: { kanji?: string; className?: string }) {
  return (
    <span
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-shu-400 to-shu-600 font-serif text-lg font-bold text-[#fff4ea] shadow-[0_6px_20px_-6px_rgba(212,68,44,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] ${className}`}
    >
      {kanji}
    </span>
  );
}

export function Marca({ href = "/", compacta = false }: { href?: string; compacta?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <Sello className="-rotate-3 transition-transform duration-300 group-hover:rotate-0" />
      <span className="flex flex-col leading-tight">
        <span className={`font-serif font-bold tracking-wide ${compacta ? "text-base" : "text-lg"}`}>
          ClassVote
        </span>
        <span className="text-[0.65rem] font-medium tracking-[0.25em] text-washi/45 uppercase">
          RoninX Academy
        </span>
      </span>
    </Link>
  );
}
