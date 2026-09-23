import { Rotulo } from "@/components/rotulo";
import { requerirMentor } from "@/lib/auth";
import { cambiarContrasena } from "../acciones";
import { Contenedor } from "../contenedor";
import { FormularioCuenta } from "../formulario-cuenta";

export default async function CuentaPage() {
  const { mentor } = await requerirMentor();

  return (
    <Contenedor mentor={mentor}>
      <main className="flex animate-aparecer flex-col gap-6 [animation-delay:80ms]">
        <div className="flex flex-col gap-2">
          <Rotulo kanji="個人">Mi cuenta</Rotulo>
          <h1 className="font-serif text-3xl font-bold">{mentor.nombre}</h1>
          <p className="text-sm text-washi/50">{mentor.email}</p>
        </div>
        <section className="tarjeta w-full max-w-md p-6">
          <h2 className="mb-5 font-serif text-lg font-bold">Cambiar contraseña</h2>
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
    </Contenedor>
  );
}
