// El alumno no pide `oculto`: RLS ya le esconde esos temas.
export const COLUMNAS_TEMA_ALUMNO = "id, ciclo_id, texto, alumno_alias, votos_count, creado_en";
export const COLUMNAS_TEMA_MENTOR = `${COLUMNAS_TEMA_ALUMNO}, oculto`;

export const ETIQUETA_SESION = {
  qa: "Mondo (Q&A)",
  practica: "Randori (práctica)",
} as const;
