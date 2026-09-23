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
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="mentor_id" value={mentorId} />
      <button
        disabled={pendiente}
        className="rounded-md border border-current/20 px-2 py-1 text-xs hover:bg-current/5 disabled:opacity-40"
      >
        Restablecer contraseña
      </button>
      {estado?.clave && (
        <span className="text-xs">
          Temporal: <code className="rounded bg-current/10 px-1 py-0.5 font-mono select-all">{estado.clave}</code>{" "}
          (cópiala ahora y envíasela; pídele que la cambie en Mi cuenta)
        </span>
      )}
      {estado?.error && <span className="text-xs text-red-600">{estado.error}</span>}
    </form>
  );
}
