import { requerirMentor } from "@/lib/auth";
import { cambiarContrasena } from "../acciones";
import { Encabezado } from "../encabezado";
import { FormularioCuenta } from "../formulario-cuenta";

export default async function CuentaPage() {
  const { mentor } = await requerirMentor();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
      <Encabezado mentor={mentor} />
      <section className="flex max-w-sm flex-col gap-3">
        <h1 className="text-xl font-semibold">Mi cuenta</h1>
        <p className="text-sm opacity-70">{mentor.email}</p>
        <h2 className="font-medium">Cambiar contraseña</h2>
        <FormularioCuenta
          accion={cambiarContrasena}
          boton="Guardar contraseña"
          campos={[
            {
              name: "password",
              label: "Nueva contraseña (mínimo 8 caracteres)",
              type: "password",
              autoComplete: "new-password",
              minLength: 8,
            },
            {
              name: "confirmacion",
              label: "Repite la nueva contraseña",
              type: "password",
              autoComplete: "new-password",
              minLength: 8,
            },
          ]}
        />
      </section>
    </main>
  );
}
