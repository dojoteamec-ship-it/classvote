// Fondo fijo de toda la app: noche índigo, luna, silueta de samurái,
// niebla y patrón seigaiha. Todo decorativo (aria-hidden) y muy tenue para
// no competir con el contenido.

// Olas seigaiha (青海波) como patrón repetible.
const SEIGAIHA = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'><g fill='none' stroke='#9db3e0' stroke-width='1'><path d='M0 40a40 40 0 0 1 80 0M8 40a32 32 0 0 1 64 0M16 40a24 24 0 0 1 48 0M24 40a16 16 0 0 1 32 0'/><path d='M-40 20a40 40 0 0 1 80 0M-32 20a32 32 0 0 1 64 0M-24 20a24 24 0 0 1 48 0M-16 20a16 16 0 0 1 32 0M40 20a40 40 0 0 1 80 0M48 20a32 32 0 0 1 64 0M56 20a24 24 0 0 1 48 0M64 20a16 16 0 0 1 32 0'/></g></svg>`,
)}")`;

// Grano sutil para que el degradado no se vea plano.
const GRANO = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='.5'/></svg>`,
)}")`;

export function FondoDojo() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Cielo */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_0%,#16305e_0%,#0a1630_45%,#040914_100%)]" />

      {/* Seigaiha, solo en la parte baja */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] opacity-[0.05] [mask-image:linear-gradient(to_top,black,transparent)]"
        style={{ backgroundImage: SEIGAIHA, backgroundSize: "80px 40px" }}
      />

      {/* Luna */}
      <div className="absolute top-[8%] right-[-6rem] size-[34rem] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(230,207,156,0.16),rgba(157,179,224,0.06)_45%,transparent_70%)] blur-[2px] sm:right-[4%]" />

      {/* Samurái */}
      <svg
        viewBox="0 0 400 800"
        className="absolute right-[-5rem] bottom-0 h-[88vh] max-h-[58rem] opacity-[0.075] blur-[1.2px] sm:right-[6%]"
        style={{
          maskImage: "linear-gradient(to top, transparent 2%, black 35%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, transparent 2%, black 35%, black 80%, transparent 100%)",
        }}
      >
        <defs>
          <linearGradient id="samurai" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d6f0" />
            <stop offset="1" stopColor="#6f8fcf" />
          </linearGradient>
        </defs>
        <g fill="url(#samurai)">
          {/* Katana en alto (hassō) */}
          <path d="M214 350 Q226 190 238 32 Q240 20 246 12 L248 16 Q243 26 242 36 Q232 192 222 352 Z" />
          <ellipse cx="216" cy="354" rx="17" ry="5" />
          <path d="M208 358 h14 l-3 64 h-8 Z" />
          {/* Maedate (media luna) y kabuto con fukigaeshi */}
          <path d="M132 120 Q200 30 270 120 Q200 80 132 120 Z" />
          <path d="M160 164 Q158 110 202 104 Q246 110 244 164 Z" />
          <path d="M162 150 Q140 138 130 154 Q146 162 164 168 Z" />
          <path d="M242 150 Q264 138 274 154 Q258 162 240 168 Z" />
          {/* Shikoro (protector de nuca), rostro y cuello */}
          <path d="M156 160 Q150 186 126 212 Q202 226 278 212 Q254 186 248 160 Z" />
          <path d="M180 200 Q178 228 186 242 L218 242 Q226 228 224 200 Z" />
          {/* Sode (hombreras) */}
          <path d="M156 238 Q118 234 94 252 Q86 304 78 360 Q112 352 148 348 Q150 292 156 238 Z" />
          <path d="M248 238 Q286 234 310 252 Q318 304 326 360 Q292 352 256 348 Q254 292 248 238 Z" />
          {/* Dō (coraza) y brazos hacia la empuñadura */}
          <path d="M150 236 Q202 224 254 236 Q262 322 250 412 Q202 420 154 412 Q142 322 150 236 Z" />
          <path d="M146 300 Q160 358 208 394 L222 374 Q180 346 166 292 Z" />
          <path d="M258 300 Q250 352 222 382 L206 366 Q232 338 240 292 Z" />
          {/* Kusazuri (faldón) y saya (vaina) */}
          <path d="M152 406 Q202 416 252 406 Q266 442 280 480 Q202 492 124 480 Q138 442 152 406 Z" />
          <path d="M246 404 Q302 380 362 348 L368 358 Q306 394 252 420 Z" />
          {/* Hakama */}
          <path d="M126 476 Q202 490 278 476 Q298 622 322 796 Q268 802 222 794 Q214 692 206 602 Q202 596 198 602 Q190 692 182 794 Q136 802 82 796 Q106 622 126 476 Z" />
        </g>
      </svg>

      {/* Niebla en movimiento lento */}
      <div className="absolute inset-x-[-10%] bottom-[-5%] h-[45%] animate-niebla bg-[radial-gradient(60%_60%_at_50%_100%,rgba(111,143,207,0.14),transparent_70%)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-noche-950 to-transparent" />

      {/* Grano */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: GRANO }} />
    </div>
  );
}
