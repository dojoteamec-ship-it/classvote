"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { EstadoFormulario } from "./acciones";

type Campo = { name: string; label: string; type: string; autoComplete: string; minLength?: number };

const INPUT = "rounded-md border border-current/20 bg-transparent p-2 font-normal";

export function FormularioCuenta({
  accion,
  campos,
  boton,
  pie,
}: {
  accion: (estado: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  campos: Campo[];
  boton: string;
  pie?: { texto: string; enlace: string; href: string };
}) {
  const [estado, enviar, pendiente] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-lg border border-current/20 p-4">
      {campos.map((campo) => (
        <label key={campo.name} className="flex flex-col gap-1 text-sm font-medium">
          {campo.label}
          <input
            name={campo.name}
            type={campo.type}
            autoComplete={campo.autoComplete}
            minLength={campo.minLength}
            defaultValue={estado?.valores?.[campo.name]}
            required
            className={INPUT}
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={pendiente}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
      >
        {pendiente ? "Un momento…" : boton}
      </button>
      {estado?.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}
      {estado?.aviso && <p className="text-sm">{estado.aviso}</p>}
      {pie && (
        <p className="text-sm opacity-70">
          {pie.texto}{" "}
          <Link href={pie.href} className="underline">
            {pie.enlace}
          </Link>
        </p>
      )}
    </form>
  );
}
