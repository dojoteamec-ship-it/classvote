import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { registrarse } from "../acciones";
import { FormularioCuenta } from "../formulario-cuenta";
import { PantallaAcceso } from "../pantalla-acceso";

export default async function RegistroPage() {
  const { mentor } = await obtenerSesion();
  if (mentor) redirect("/mentor");

  return (
    <PantallaAcceso
      titulo="Crea tu cuenta"
      descripcion="Tu cuenta quedará pendiente hasta que el administrador la apruebe y te asigne tu cinturón."
    >
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
    </PantallaAcceso>
  );
}
