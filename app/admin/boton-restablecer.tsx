"use client";

import { useActionState } from "react";
import { restablecerContrasena } from "./acciones";

export function BotonRestablecer({ mentorId }: { mentorId: string }) {
  const [estado, enviar, pendiente] = useActionState(restablecerContrasena, undefined);

  return (
    <form
      action={enviar}
      onSubmit={(e) => {
        if (!window.confirm("¿Restablecer la contraseña? La actual dejará de funcionar.")) {
          e.preventDefault();
        }
      }}
      className="contents"
    >
      <input type="hidden" name="mentor_id" value={mentorId} />
      <button disabled={pendiente} className="boton-secundario">
        {pendiente ? "Generando…" : "Restablecer contraseña"}
      </button>
      {estado?.clave && (
        <span className="flex basis-full flex-wrap items-center gap-2 rounded-xl border border-kin-400/30 bg-kin-400/10 px-3 py-2 text-xs text-washi/80">
          Contraseña temporal:
          <code className="rounded-md bg-noche-950/70 px-2 py-1 font-mono text-sm text-kin-300 select-all">
            {estado.clave}
          </code>
          <span className="text-washi/50">Cópiala ahora y envíasela; que la cambie en Mi cuenta.</span>
        </span>
      )}
      {estado?.error && <span className="basis-full text-xs text-shu-400">{estado.error}</span>}
    </form>
  );
}
