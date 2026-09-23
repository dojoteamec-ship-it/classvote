// Etiqueta de sección: kanji dorado + texto. Ej.: 題目 · Temas
export function Rotulo({ kanji, children }: { kanji: string; children: React.ReactNode }) {
  return (
    <span className="rotulo">
      <span className="font-serif text-sm tracking-normal text-kin-400">{kanji}</span>
      <span aria-hidden className="h-px w-5 bg-gradient-to-r from-kin-400/60 to-transparent" />
      {children}
    </span>
  );
}

// Indicador de estado de la votación con punto "en vivo".
export function EstadoVotacion({ abierta }: { abierta: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        abierta
          ? "border-matcha/30 bg-matcha/10 text-matcha"
          : "border-white/10 bg-white/5 text-washi/60"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${abierta ? "animate-pulso bg-matcha" : "bg-washi/40"}`}
      />
      {abierta ? "Votación abierta" : "Votación cerrada"}
    </span>
  );
}
