// Identificador anónimo del dispositivo: un UUID guardado en localStorage.
// No identifica a la persona; solo evita que el mismo navegador vote dos
// veces el mismo tema (la base lo refuerza con unique (tema_id, fingerprint)).
const KEY = "classvote:fp";
let cache: string | null = null;

export function obtenerFingerprint(): string {
  cache ??= leer();
  return cache;
}

function leer(): string {
  try {
    let fp = localStorage.getItem(KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(KEY, fp);
    }
    return fp;
  } catch {
    // Navegación privada o iframe sin acceso a storage.
    return crypto.randomUUID();
  }
}
