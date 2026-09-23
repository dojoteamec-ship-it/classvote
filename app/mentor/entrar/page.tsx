import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { entrar } from "../acciones";
import { FormularioCuenta } from "../formulario-cuenta";
import { PantallaAcceso } from "../pantalla-acceso";

export default async function EntrarPage() {
  const { mentor } = await obtenerSesion();
  if (mentor) redirect("/mentor");

  return (
    <PantallaAcceso titulo="Bienvenido de vuelta">
      <FormularioCuenta
        accion={entrar}
        boton="Entrar"
        campos={[
          { name: "email", label: "Correo", type: "email", autoComplete: "email" },
          { name: "password", label: "Contraseña", type: "password", autoComplete: "current-password" },
        ]}
        pie={{ texto: "¿Primera vez?", enlace: "Crea tu cuenta", href: "/mentor/registro" }}
      />
    </PantallaAcceso>
  );
}
