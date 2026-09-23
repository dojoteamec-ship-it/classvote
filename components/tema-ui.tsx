// Piezas visuales de un tema en la lista (alumno y mentor).

const KANJI_PODIO = ["一", "二", "三"];

// Puesto en el ranking: kanji dorados para el podio, números después.
export function Puesto({ indice, activo = true }: { indice: number; activo?: boolean }) {
  const podio = indice < 3 && activo;
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-full font-serif text-sm font-bold sm:size-9 sm:text-base ${
        podio
          ? "bg-gradient-to-b from-kin-300/20 to-kin-500/10 text-kin-300 ring-1 ring-kin-400/40"
          : "bg-white/5 text-washi/45 ring-1 ring-white/10"
      }`}
    >
      {podio ? KANJI_PODIO[indice] : indice + 1}
    </span>
  );
}

// Proporción de votos respecto al tema más votado.
export function BarraVotos({ votos, maximo }: { votos: number; maximo: number }) {
  const ancho = maximo > 0 ? Math.max(4, (votos / maximo) * 100) : 0;
  return (
    <span aria-hidden className="block h-1 w-full overflow-hidden rounded-full bg-white/5">
      <span
        className="block h-full rounded-full bg-gradient-to-r from-ai-400/70 to-kin-400/80 transition-[width] duration-700 ease-out"
        style={{ width: `${ancho}%` }}
      />
    </span>
  );
}

// Número que "late" cada vez que cambia (la key reinicia la animación).
export function Contador({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <span key={valor} className={`inline-block animate-latido tabular-nums ${className}`}>
      {valor}
    </span>
  );
}
