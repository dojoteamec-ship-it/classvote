import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { registrarse } from "../acciones";
import { FormularioCuenta } from "../formulario-cuenta";

export default async function RegistroPage() {
  const { mentor } = await obtenerSesion();
  if (mentor) redirect("/mentor");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Crear cuenta de mentor</h1>
      <p className="text-sm opacity-70">
        Tu cuenta quedará pendiente hasta que el administrador la apruebe y te asigne tu cinturón.
      </p>
      <FormularioCuenta
        accion={registrarse}
        boton="Crear cuenta"
        campos={[
          { name: "nombre", label: "Nombre", type: "text", autoComplete: "name" },
          { name: "email", label: "Correo", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Contraseña (mínimo 8 caracteres)",
            type: "password",
            autoComplete: "new-password",
            minLength: 8,
          },
        ]}
        pie={{ texto: "¿Ya tienes cuenta?", enlace: "Inicia sesión", href: "/mentor/entrar" }}
      />
    </main>
  );
}
