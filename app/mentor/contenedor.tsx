import type { Mentor } from "@/types/database";
import { Encabezado } from "./encabezado";

// Marco de las páginas con sesión: barra superior + contenido.
export function Contenedor({
  mentor,
  ancho = "max-w-4xl",
  children,
}: {
  mentor: Mentor;
  ancho?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto flex w-full ${ancho} flex-1 flex-col gap-8 px-4 pb-16`}>
      <Encabezado mentor={mentor} />
      {children}
    </div>
  );
}
