// fecha_clase es una fecha local de Ecuador ("2026-09-24") y hora_local una
// hora ("19:00:00"). Se formatean sin convertir zonas horarias.
export function formatearClase(fecha: string, hora: string | null): string {
  const dia = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
  return hora ? `${dia} · ${hora.slice(0, 5)} (hora Ecuador)` : dia;
}
