import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { entrar } from "../acciones";
import { FormularioCuenta } from "../formulario-cuenta";

export default async function EntrarPage() {
  const { mentor } = await obtenerSesion();
  if (mentor) redirect("/mentor");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Acceso mentores</h1>
      <FormularioCuenta
        accion={entrar}
        boton="Entrar"
        campos={[
          { name: "email", label: "Correo", type: "email", autoComplete: "email" },
          { name: "password", label: "Contraseña", type: "password", autoComplete: "current-password" },
        ]}
        pie={{ texto: "¿Primera vez?", enlace: "Crea tu cuenta", href: "/mentor/registro" }}
      />
    </main>
  );
}
